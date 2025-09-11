import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Ball interface to match frontend
const BallSchema = new Schema(
  {
    id: { type: Number, required: true },
    weight: { type: Number, required: true },
    reward: { type: Number, required: true },
    color: { type: String, required: true }
  },
  { _id: false }
);

// Question metadata for difficulty analysis
const QuestionMetadataSchema = new Schema(
  {
    dominanceCount: { type: Number, required: true },
    slackRatio: { type: Number, required: true },
    optimalityGap: { type: Number, required: true },
    densityVariance: { type: Number, required: true }
  },
  { _id: false }
);

// Individual question schema
const QuestionItemSchema = new Schema(
  {
    id: { type: Number, required: true },
    capacity: { type: Number, required: true },
    balls: { type: [BallSchema], required: true },
    solution: { type: [Number], required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    metadata: { type: QuestionMetadataSchema, required: true }
  },
  { _id: false }
);

// Generator configuration schema
const GeneratorConfigSchema = new Schema(
  {
    numItems: { type: Number, required: true },
    minWeight: { type: Number, required: true },
    maxWeight: { type: Number, required: true },
    minReward: { type: Number, required: true },
    maxReward: { type: Number, required: true },
    targetSlackRatio: { type: Number },
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], required: true },
    ensureUniqueSolution: { type: Boolean, default: true }
  },
  { _id: false }
);

// Question set analysis schema
const QuestionSetAnalysisSchema = new Schema(
  {
    easyCount: { type: Number, required: true },
    mediumCount: { type: Number, required: true },
    hardCount: { type: Number, required: true },
    averageDominance: { type: Number, required: true },
    averageSlackRatio: { type: Number, required: true },
    averageOptimalityGap: { type: Number, required: true }
  },
  { _id: false }
);

// Main question set schema
const QuestionSetSchema = new Schema(
  {
    participantId: { type: String, required: true, index: true },
    phase: { type: String, required: true, enum: ['training', 'benchmark', 'prediction', 'practice', 'skill', 'strategy', 'final'] },
    questions: { type: [QuestionItemSchema], required: true },
    generationConfig: { type: GeneratorConfigSchema, required: true },
    analysisStats: { type: QuestionSetAnalysisSchema, required: true },
    seed: { type: Number, required: true }, // For reproducibility
    generatedAt: { type: Date, default: () => new Date() },
    version: { type: String, default: '1.0' } // For tracking generator versions
  },
  { versionKey: false }
);

// Compound index for efficient queries
QuestionSetSchema.index({ participantId: 1, phase: 1 }, { unique: true });

export type QuestionSetDoc = InferSchemaType<typeof QuestionSetSchema>;
export const QuestionSetModel = mongoose.models.QuestionSet || mongoose.model('QuestionSet', QuestionSetSchema);
