"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionSetModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Ball interface to match frontend
const BallSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    weight: { type: Number, required: true },
    reward: { type: Number, required: true },
    color: { type: String, required: true }
}, { _id: false });
// Question metadata for difficulty analysis
const QuestionMetadataSchema = new mongoose_1.Schema({
    dominanceCount: { type: Number, required: true },
    slackRatio: { type: Number, required: true },
    optimalityGap: { type: Number, required: true },
    densityVariance: { type: Number, required: true }
}, { _id: false });
// Individual question schema
const QuestionItemSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    capacity: { type: Number, required: true },
    balls: { type: [BallSchema], required: true },
    solution: { type: [Number], required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    metadata: { type: QuestionMetadataSchema, required: true }
}, { _id: false });
// Generator configuration schema
const GeneratorConfigSchema = new mongoose_1.Schema({
    numItems: { type: Number, required: true },
    minWeight: { type: Number, required: true },
    maxWeight: { type: Number, required: true },
    minReward: { type: Number, required: true },
    maxReward: { type: Number, required: true },
    targetSlackRatio: { type: Number },
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], required: true },
    ensureUniqueSolution: { type: Boolean, default: true }
}, { _id: false });
// Question set analysis schema
const QuestionSetAnalysisSchema = new mongoose_1.Schema({
    easyCount: { type: Number, required: true },
    mediumCount: { type: Number, required: true },
    hardCount: { type: Number, required: true },
    averageDominance: { type: Number, required: true },
    averageSlackRatio: { type: Number, required: true },
    averageOptimalityGap: { type: Number, required: true }
}, { _id: false });
// Main question set schema
const QuestionSetSchema = new mongoose_1.Schema({
    participantId: { type: String, required: true, index: true },
    phase: { type: String, required: true, enum: ['training', 'benchmark', 'prediction', 'practice', 'skill', 'strategy', 'final'] },
    questions: { type: [QuestionItemSchema], required: true },
    generationConfig: { type: GeneratorConfigSchema, required: true },
    analysisStats: { type: QuestionSetAnalysisSchema, required: true },
    seed: { type: Number, required: true }, // For reproducibility
    generatedAt: { type: Date, default: () => new Date() },
    version: { type: String, default: '1.0' } // For tracking generator versions
}, { versionKey: false });
// Compound index for efficient queries
QuestionSetSchema.index({ participantId: 1, phase: 1 }, { unique: true });
exports.QuestionSetModel = mongoose_1.default.models.QuestionSet || mongoose_1.default.model('QuestionSet', QuestionSetSchema);
