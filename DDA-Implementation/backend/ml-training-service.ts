/**
 * ML Training Service
 * Manages model training, evaluation, persistence, and inference
 */

import { storage } from "./production-storage";
import { DataPreprocessor, type DataSample } from "./data-preprocessing";
import { LinearRegressionModel, LogisticRegressionModel, KMeansModel, type Model, type ModelMetrics } from "./ml-models";
import type { Patient } from "@shared/schema";

export interface TrainingSession {
  id: string;
  modelType: "risk_prediction" | "diagnosis_classification" | "patient_clustering";
  status: "training" | "completed" | "failed";
  accuracy: number;
  metrics: ModelMetrics;
  trainedAt: Date;
  samplesUsed: number;
}

export interface PredictionResult {
  prediction: number | number[];
  confidence: number;
  modelType: string;
  interpretation: string;
}

export class MLTrainingService {
  private models: Map<string, Model> = new Map();
  private trainingSessions: Map<string, TrainingSession> = new Map();
  private preprocessor = DataPreprocessor;

  /**
   * Prepare training data from patient records
   */
  async prepareTrainingData(
    modelType: "risk_prediction" | "diagnosis_classification" | "patient_clustering"
  ): Promise<DataSample[]> {
    const patients = await storage.getAllPatients();
    const samples: DataSample[] = [];

    for (const patient of patients) {
      const features = this.preprocessor.extractFeatures(patient);

      let label: number | undefined;

      if (modelType === "risk_prediction") {
        // Label: health risk score (0-100)
        label = this.calculateHealthRiskLabel(patient);
      } else if (modelType === "diagnosis_classification") {
        // Label: has serious condition (0=no, 1=yes)
        label = this.calculateDiagnosisLabel(patient);
      }
      // For clustering, no label needed

      samples.push({
        features,
        label,
        patientId: patient.id,
      });
    }

    return samples;
  }

  private calculateHealthRiskLabel(patient: Patient): number {
    let risk = 0;

    if (patient.bloodPressureSystolic && patient.bloodPressureSystolic >= 140) risk += 20;
    if (patient.heartRate && (patient.heartRate > 100 || patient.heartRate < 60)) risk += 15;
    if (patient.temperature && parseFloat(patient.temperature) >= 38) risk += 20;
    if (patient.age >= 60) risk += 15;
    if (patient.genotype === "SS") risk += 20;

    return Math.min(100, risk);
  }

  private calculateDiagnosisLabel(patient: Patient): number {
    // 1 if serious condition detected, 0 otherwise
    const hasSeriousCondition =
      (patient.bloodPressureSystolic && patient.bloodPressureSystolic >= 160) ||
      (patient.temperature && parseFloat(patient.temperature) >= 39) ||
      patient.genotype === "SS";

    return hasSeriousCondition ? 1 : 0;
  }

  /**
   * Train a model
   */
  async trainModel(
    modelType: "risk_prediction" | "diagnosis_classification" | "patient_clustering"
  ): Promise<TrainingSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Prepare data
      const samples = await this.prepareTrainingData(modelType);

      if (samples.length < 5) {
        throw new Error("Insufficient training data (minimum 5 samples required)");
      }

      // Create and train model
      let model: Model;

      if (modelType === "risk_prediction") {
        model = new LinearRegressionModel(0.01, 500);
      } else if (modelType === "diagnosis_classification") {
        model = new LogisticRegressionModel(0.01, 500);
      } else {
        model = new KMeansModel(3, 100);
      }

      // Split data
      const { train, test } = this.preprocessor.trainTestSplit(samples, 0.2);

      // Train model
      model.train(train);

      // Evaluate
      const metrics = model.evaluate(test);

      // Store model
      this.models.set(sessionId, model);

      // Record session
      const session: TrainingSession = {
        id: sessionId,
        modelType,
        status: "completed",
        accuracy: metrics.accuracy,
        metrics,
        trainedAt: new Date(),
        samplesUsed: train.length,
      };

      this.trainingSessions.set(sessionId, session);

      return session;
    } catch (error) {
      const session: TrainingSession = {
        id: sessionId,
        modelType,
        status: "failed",
        accuracy: 0,
        metrics: { accuracy: 0, precision: 0, recall: 0, f1Score: 0 },
        trainedAt: new Date(),
        samplesUsed: 0,
      };

      this.trainingSessions.set(sessionId, session);
      throw error;
    }
  }

  /**
   * Make prediction using trained model
   */
  predict(sessionId: string, patient: Patient): PredictionResult {
    const model = this.models.get(sessionId);
    if (!model) {
      throw new Error(`Model session ${sessionId} not found`);
    }

    const session = this.trainingSessions.get(sessionId);
    if (!session) {
      throw new Error(`Training session ${sessionId} not found`);
    }

    const features = this.preprocessor.extractFeatures(patient);
    const prediction = model.predict(features);

    let interpretation = "";

    if (session.modelType === "risk_prediction") {
      const riskScore = Math.round(prediction);
      if (riskScore < 30) interpretation = "Low health risk";
      else if (riskScore < 50) interpretation = "Moderate health risk";
      else if (riskScore < 75) interpretation = "High health risk";
      else interpretation = "Critical health risk - immediate attention required";
    } else if (session.modelType === "diagnosis_classification") {
      interpretation = prediction > 0.5 ? "High likelihood of serious condition" : "Low likelihood of serious condition";
    } else {
      interpretation = `Patient clusters with group ${Math.round(prediction)}`;
    }

    return {
      prediction,
      confidence: session.accuracy,
      modelType: session.modelType,
      interpretation,
    };
  }

  /**
   * Get training session details
   */
  getSession(sessionId: string): TrainingSession | undefined {
    return this.trainingSessions.get(sessionId);
  }

  /**
   * List all training sessions
   */
  getAllSessions(): TrainingSession[] {
    return Array.from(this.trainingSessions.values());
  }

  /**
   * Cross-validation evaluation
   */
  async evaluateWithCrossValidation(
    modelType: "risk_prediction" | "diagnosis_classification" | "patient_clustering",
    folds: number = 5
  ): Promise<{ meanAccuracy: number; stdAccuracy: number; foldAccuracies: number[] }> {
    const samples = await this.prepareTrainingData(modelType);
    const cvFolds = this.preprocessor.createCVFolds(samples, folds);
    const accuracies: number[] = [];

    for (let i = 0; i < folds; i++) {
      const testFold = cvFolds[i];
      const trainFold = cvFolds.filter((_, idx) => idx !== i).flat();

      let model: Model;

      if (modelType === "risk_prediction") {
        model = new LinearRegressionModel();
      } else if (modelType === "diagnosis_classification") {
        model = new LogisticRegressionModel();
      } else {
        model = new KMeansModel();
      }

      model.train(trainFold);
      const metrics = model.evaluate(testFold);
      accuracies.push(metrics.accuracy);
    }

    const meanAccuracy = accuracies.reduce((a, b) => a + b, 0) / folds;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - meanAccuracy, 2), 0) / folds;
    const stdAccuracy = Math.sqrt(variance);

    return { meanAccuracy, stdAccuracy, foldAccuracies: accuracies };
  }

  /**
   * Get feature importance
   */
  async getFeatureImportance(
    modelType: "risk_prediction" | "diagnosis_classification" | "patient_clustering"
  ): Promise<{ features: string[]; importance: number[] }> {
    const samples = await this.prepareTrainingData(modelType);
    const importance = this.preprocessor.calculateFeatureImportance(samples);

    const featureNames = [
      "Age",
      "BP Systolic",
      "BP Diastolic",
      "Heart Rate",
      "Temperature",
      "Weight",
      "Age Risk",
      "Genotype Risk",
      "Has Allergies",
    ];

    return { features: featureNames, importance };
  }
}

// Singleton instance
export const mlTrainingService = new MLTrainingService();
