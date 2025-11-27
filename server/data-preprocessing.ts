/**
 * Data Preprocessing Module
 * Handles data normalization, feature scaling, and dataset preparation for ML training
 */

import type { Patient } from "@shared/schema";

export interface DataSample {
  features: number[];
  label?: number;
  patientId?: string;
}

export interface NormalizationParams {
  min: number[];
  max: number[];
  mean: number[];
  std: number[];
}

export class DataPreprocessor {
  /**
   * Extract features from patient data for ML training
   */
  static extractFeatures(patient: Patient): number[] {
    const features: number[] = [];

    // Age (0-100)
    features.push(patient.age || 0);

    // Blood Pressure Systolic
    features.push(patient.bloodPressureSystolic || 0);

    // Blood Pressure Diastolic
    features.push(patient.bloodPressureDiastolic || 0);

    // Heart Rate
    features.push(patient.heartRate || 0);

    // Temperature
    features.push(parseFloat(patient.temperature || "36.5"));

    // Weight
    features.push(parseFloat(patient.weight || "70"));

    // Age-related risk (binary: 1 if >60, 0 otherwise)
    features.push(patient.age >= 60 ? 1 : 0);

    // Genotype risk (0=AA/AC, 1=AS/SC, 2=SS)
    const genotypeRisk =
      patient.genotype === "SS" ? 2 : patient.genotype === "AS" || patient.genotype === "SC" ? 1 : 0;
    features.push(genotypeRisk);

    // Has allergies (binary)
    features.push(patient.allergies && patient.allergies.length > 0 ? 1 : 0);

    return features;
  }

  /**
   * Normalize features using min-max scaling
   */
  static normalizeFeatures(features: number[], params?: NormalizationParams): number[] {
    if (!params) {
      return features; // Return as-is if no normalization params
    }

    return features.map((value, i) => {
      const min = params.min[i] || 0;
      const max = params.max[i] || 1;
      const range = max - min || 1;
      return (value - min) / range;
    });
  }

  /**
   * Standardize features (z-score normalization)
   */
  static standardizeFeatures(features: number[], params?: NormalizationParams): number[] {
    if (!params) {
      return features;
    }

    return features.map((value, i) => {
      const mean = params.mean[i] || 0;
      const std = params.std[i] || 1;
      return (value - mean) / (std || 1);
    });
  }

  /**
   * Calculate normalization parameters from dataset
   */
  static calculateNormalizationParams(samples: DataSample[]): NormalizationParams {
    if (samples.length === 0) {
      return { min: [], max: [], mean: [], std: [] };
    }

    const featureCount = samples[0].features.length;
    const min: number[] = Array(featureCount).fill(Infinity);
    const max: number[] = Array(featureCount).fill(-Infinity);
    const sum: number[] = Array(featureCount).fill(0);

    // Calculate min, max, and sum
    for (const sample of samples) {
      for (let i = 0; i < featureCount; i++) {
        min[i] = Math.min(min[i], sample.features[i]);
        max[i] = Math.max(max[i], sample.features[i]);
        sum[i] += sample.features[i];
      }
    }

    // Calculate mean
    const mean = sum.map((s) => s / samples.length);

    // Calculate standard deviation
    let sumSquaredDiff: number[] = Array(featureCount).fill(0);
    for (const sample of samples) {
      for (let i = 0; i < featureCount; i++) {
        sumSquaredDiff[i] += Math.pow(sample.features[i] - mean[i], 2);
      }
    }

    const std = sumSquaredDiff.map((s) => Math.sqrt(s / samples.length));

    return { min, max, mean, std };
  }

  /**
   * Split dataset into training and validation sets
   */
  static trainTestSplit(
    samples: DataSample[],
    testRatio: number = 0.2
  ): { train: DataSample[]; test: DataSample[] } {
    // Shuffle samples
    const shuffled = [...samples].sort(() => Math.random() - 0.5);

    const splitIndex = Math.floor(shuffled.length * (1 - testRatio));

    return {
      train: shuffled.slice(0, splitIndex),
      test: shuffled.slice(splitIndex),
    };
  }

  /**
   * Create cross-validation folds
   */
  static createCVFolds(samples: DataSample[], folds: number = 5): DataSample[][] {
    const foldSize = Math.ceil(samples.length / folds);
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const cvFolds: DataSample[][] = [];

    for (let i = 0; i < folds; i++) {
      const start = i * foldSize;
      const end = Math.min(start + foldSize, samples.length);
      cvFolds.push(shuffled.slice(start, end));
    }

    return cvFolds;
  }

  /**
   * Calculate feature importance based on variance
   */
  static calculateFeatureImportance(samples: DataSample[]): number[] {
    if (samples.length === 0) return [];

    const featureCount = samples[0].features.length;
    const variances: number[] = Array(featureCount).fill(0);
    const means: number[] = Array(featureCount).fill(0);

    // Calculate means
    for (const sample of samples) {
      for (let i = 0; i < featureCount; i++) {
        means[i] += sample.features[i];
      }
    }
    means.forEach((_, i) => (means[i] /= samples.length));

    // Calculate variances
    for (const sample of samples) {
      for (let i = 0; i < featureCount; i++) {
        variances[i] += Math.pow(sample.features[i] - means[i], 2);
      }
    }
    variances.forEach((_, i) => (variances[i] /= samples.length));

    // Normalize variances to importance scores (0-1)
    const maxVariance = Math.max(...variances) || 1;
    return variances.map((v) => v / maxVariance);
  }

  /**
   * Handle missing values (simple mean imputation)
   */
  static imputeMissingValues(samples: DataSample[]): DataSample[] {
    if (samples.length === 0) return samples;

    const featureCount = samples[0].features.length;
    const means: number[] = Array(featureCount).fill(0);

    // Calculate means for non-zero values
    const counts: number[] = Array(featureCount).fill(0);
    for (const sample of samples) {
      for (let i = 0; i < featureCount; i++) {
        if (sample.features[i] !== 0 && !isNaN(sample.features[i])) {
          means[i] += sample.features[i];
          counts[i]++;
        }
      }
    }

    means.forEach((_, i) => (means[i] = counts[i] > 0 ? means[i] / counts[i] : 0));

    // Replace zero values with means
    return samples.map((sample) => ({
      ...sample,
      features: sample.features.map((value, i) => (value === 0 ? means[i] : value)),
    }));
  }
}
