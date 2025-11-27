/**
 * Machine Learning Models for Healthcare Predictions
 * Implements basic algorithms: Linear Regression, Logistic Regression, K-Means
 */

import type { DataSample } from "./data-preprocessing";

export interface Model {
  train(samples: DataSample[]): void;
  predict(features: number[]): number;
  evaluate(testSamples: DataSample[]): ModelMetrics;
  getWeights(): number[];
  getAccuracy(): number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse?: number;
  rmse?: number;
}

/**
 * Linear Regression Model for continuous predictions (e.g., health risk scores)
 */
export class LinearRegressionModel implements Model {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.01;
  private iterations: number = 1000;
  private accuracy: number = 0;

  constructor(learningRate: number = 0.01, iterations: number = 1000) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  train(samples: DataSample[]): void {
    if (samples.length === 0) return;

    const featureCount = samples[0].features.length;
    this.weights = Array(featureCount).fill(0);
    this.bias = 0;

    // Gradient descent
    for (let iter = 0; iter < this.iterations; iter++) {
      let totalError = 0;

      for (const sample of samples) {
        const prediction = this.predictValue(sample.features);
        const actual = sample.label || 0;
        const error = prediction - actual;
        totalError += error * error;

        // Update weights
        for (let i = 0; i < featureCount; i++) {
          this.weights[i] -= (this.learningRate * error * sample.features[i]) / samples.length;
        }

        // Update bias
        this.bias -= (this.learningRate * error) / samples.length;
      }

      // Track MSE for early stopping
      const mse = totalError / samples.length;
      if (iter % 100 === 0) {
        this.accuracy = 1 / (1 + mse); // Convert error to pseudo-accuracy
      }
    }
  }

  private predictValue(features: number[]): number {
    let prediction = this.bias;
    for (let i = 0; i < features.length; i++) {
      prediction += features[i] * this.weights[i];
    }
    return Math.max(0, Math.min(100, prediction)); // Clamp to 0-100 for health scores
  }

  predict(features: number[]): number {
    return this.predictValue(features);
  }

  evaluate(testSamples: DataSample[]): ModelMetrics {
    if (testSamples.length === 0) {
      return { accuracy: 0, precision: 0, recall: 0, f1Score: 0, mse: 0, rmse: 0 };
    }

    let totalError = 0;
    let sumSquaredError = 0;

    for (const sample of testSamples) {
      const prediction = this.predict(sample.features);
      const actual = sample.label || 0;
      const error = Math.abs(prediction - actual);
      totalError += error;
      sumSquaredError += error * error;
    }

    const mse = sumSquaredError / testSamples.length;
    const rmse = Math.sqrt(mse);
    const accuracy = Math.max(0, 1 - mse / 100); // Normalize to 0-1

    return {
      accuracy: Math.min(1, accuracy),
      precision: accuracy,
      recall: accuracy,
      f1Score: accuracy,
      mse,
      rmse,
    };
  }

  getWeights(): number[] {
    return [...this.weights, this.bias];
  }

  getAccuracy(): number {
    return this.accuracy;
  }
}

/**
 * Logistic Regression for binary classification (e.g., risk: high/low)
 */
export class LogisticRegressionModel implements Model {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number = 0.01;
  private iterations: number = 1000;
  private accuracy: number = 0;

  constructor(learningRate: number = 0.01, iterations: number = 1000) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  train(samples: DataSample[]): void {
    if (samples.length === 0) return;

    const featureCount = samples[0].features.length;
    this.weights = Array(featureCount).fill(0);
    this.bias = 0;

    // Gradient descent for logistic regression
    for (let iter = 0; iter < this.iterations; iter++) {
      let totalError = 0;

      for (const sample of samples) {
        const logits = this.computeLogits(sample.features);
        const prediction = this.sigmoid(logits);
        const actual = sample.label || 0;
        const error = prediction - actual;
        totalError += Math.abs(error);

        // Update weights
        for (let i = 0; i < featureCount; i++) {
          this.weights[i] -= (this.learningRate * error * sample.features[i]) / samples.length;
        }

        // Update bias
        this.bias -= (this.learningRate * error) / samples.length;
      }

      this.accuracy = 1 - totalError / samples.length;
    }
  }

  private computeLogits(features: number[]): number {
    let logits = this.bias;
    for (let i = 0; i < features.length; i++) {
      logits += features[i] * this.weights[i];
    }
    return logits;
  }

  predict(features: number[]): number {
    return this.sigmoid(this.computeLogits(features));
  }

  evaluate(testSamples: DataSample[]): ModelMetrics {
    if (testSamples.length === 0) {
      return { accuracy: 0, precision: 0, recall: 0, f1Score: 0 };
    }

    let tp = 0,
      tn = 0,
      fp = 0,
      fn = 0;
    const threshold = 0.5;

    for (const sample of testSamples) {
      const prediction = this.predict(sample.features) > threshold ? 1 : 0;
      const actual = sample.label || 0;

      if (prediction === 1 && actual === 1) tp++;
      else if (prediction === 0 && actual === 0) tn++;
      else if (prediction === 1 && actual === 0) fp++;
      else if (prediction === 0 && actual === 1) fn++;
    }

    const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = (2 * precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }

  getWeights(): number[] {
    return [...this.weights, this.bias];
  }

  getAccuracy(): number {
    return this.accuracy;
  }
}

/**
 * K-Means Clustering for patient segmentation
 */
export class KMeansModel implements Model {
  private centroids: number[][] = [];
  private k: number = 3;
  private maxIterations: number = 100;
  private accuracy: number = 0;

  constructor(k: number = 3, maxIterations: number = 100) {
    this.k = k;
    this.maxIterations = maxIterations;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  train(samples: DataSample[]): void {
    if (samples.length === 0 || samples.length < this.k) return;

    const featureCount = samples[0].features.length;

    // Initialize centroids randomly from samples
    this.centroids = [];
    const indices = new Set<number>();
    while (indices.size < this.k) {
      indices.add(Math.floor(Math.random() * samples.length));
    }
    for (const idx of indices) {
      this.centroids.push([...samples[idx].features]);
    }

    // K-means iterations
    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Assign samples to nearest centroid
      const clusters: number[][][] = Array(this.k)
        .fill(null)
        .map(() => []);

      for (const sample of samples) {
        let minDistance = Infinity;
        let closestCentroid = 0;

        for (let i = 0; i < this.k; i++) {
          const distance = this.euclideanDistance(sample.features, this.centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = i;
          }
        }

        clusters[closestCentroid].push(sample.features);
      }

      // Update centroids
      const newCentroids: number[][] = [];
      for (let i = 0; i < this.k; i++) {
        if (clusters[i].length === 0) {
          newCentroids.push(this.centroids[i]); // Keep old centroid
        } else {
          const newCentroid = Array(featureCount).fill(0);
          for (const sample of clusters[i]) {
            for (let j = 0; j < featureCount; j++) {
              newCentroid[j] += sample[j];
            }
          }
          for (let j = 0; j < featureCount; j++) {
            newCentroid[j] /= clusters[i].length;
          }
          newCentroids.push(newCentroid);
        }
      }

      // Check convergence
      let converged = true;
      for (let i = 0; i < this.k; i++) {
        if (this.euclideanDistance(this.centroids[i], newCentroids[i]) > 0.001) {
          converged = false;
          break;
        }
      }

      this.centroids = newCentroids;
      if (converged) break;
    }

    this.accuracy = 0.75; // K-means doesn't have ground truth accuracy
  }

  predict(features: number[]): number {
    let minDistance = Infinity;
    let closestCluster = 0;

    for (let i = 0; i < this.centroids.length; i++) {
      const distance = this.euclideanDistance(features, this.centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = i;
      }
    }

    return closestCluster;
  }

  evaluate(testSamples: DataSample[]): ModelMetrics {
    // K-means unsupervised, so use inertia-based pseudo-accuracy
    let totalInertia = 0;
    for (const sample of testSamples) {
      const cluster = this.predict(sample.features);
      totalInertia += this.euclideanDistance(sample.features, this.centroids[cluster]);
    }
    const avgInertia = totalInertia / (testSamples.length || 1);
    const accuracy = Math.max(0, 1 - avgInertia / 100);

    return {
      accuracy: Math.min(1, accuracy),
      precision: accuracy,
      recall: accuracy,
      f1Score: accuracy,
    };
  }

  getCentroids(): number[][] {
    return this.centroids;
  }

  getWeights(): number[] {
    return this.centroids.flat();
  }

  getAccuracy(): number {
    return this.accuracy;
  }
}
