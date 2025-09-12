"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const Question_1 = require("../models/Question");
const questionGenerator_1 = require("../lib/questionGenerator");
exports.questionRouter = express_1.default.Router();
// Zod schemas for validation
const GenerateQuestionsSchema = zod_1.z.object({
    participantId: zod_1.z.string().min(1),
    phase: zod_1.z.enum(['training', 'benchmark', 'prediction', 'practice', 'skill', 'strategy', 'final']),
    count: zod_1.z.number().min(1).max(50).default(10),
    seed: zod_1.z.number().optional()
});
const GetQuestionsSchema = zod_1.z.object({
    participantId: zod_1.z.string().min(1),
    phase: zod_1.z.enum(['training', 'benchmark', 'prediction', 'practice', 'skill', 'strategy', 'final'])
});
/**
 * POST /api/v1/questions/generate
 * Generate and store a new question set for a participant and phase
 */
exports.questionRouter.post('/api/v1/questions/generate', async (req, res) => {
    try {
        const parsed = GenerateQuestionsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: parsed.error.flatten()
            });
        }
        const { participantId, phase, count, seed } = parsed.data;
        // Generate a deterministic seed if not provided
        const generationSeed = seed ?? Date.now() + participantId.charCodeAt(0);
        console.log(`[Question Generation] Generating ${count} questions for participant ${participantId}, phase ${phase}, seed ${generationSeed}`);
        // Map phase names to generator phase names
        const generatorPhase = mapPhaseToGenerator(phase);
        // Generate questions using the sophisticated generator
        const { questions, config, analysisStats } = (0, questionGenerator_1.generatePhaseQuestions)(generatorPhase, count, generationSeed);
        // Check if question set already exists and delete it
        await Question_1.QuestionSetModel.deleteOne({ participantId, phase });
        // Save the generated question set
        const questionSet = await Question_1.QuestionSetModel.create({
            participantId,
            phase,
            questions,
            generationConfig: config,
            analysisStats,
            seed: generationSeed,
            generatedAt: new Date(),
            version: '1.0'
        });
        console.log(`[Question Generation] Successfully generated and saved ${questions.length} questions`);
        res.status(201).json({
            success: true,
            questionSetId: questionSet._id,
            participantId,
            phase,
            questionsGenerated: questions.length,
            analysisStats,
            seed: generationSeed
        });
    }
    catch (error) {
        console.error('[Question Generation] Error:', error);
        res.status(500).json({
            error: 'Failed to generate questions',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v1/questions/:participantId/:phase
 * Retrieve questions for a specific participant and phase
 */
exports.questionRouter.get('/api/v1/questions/:participantId/:phase', async (req, res) => {
    try {
        const { participantId, phase } = req.params;
        const parsed = GetQuestionsSchema.safeParse({ participantId, phase });
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid parameters',
                details: parsed.error.flatten()
            });
        }
        console.log(`[Question Retrieval] Fetching questions for participant ${participantId}, phase ${phase}`);
        const questionSet = await Question_1.QuestionSetModel.findOne({
            participantId,
            phase
        }).lean();
        if (!questionSet) {
            return res.status(404).json({
                error: 'Question set not found',
                message: `No questions found for participant ${participantId} in phase ${phase}`
            });
        }
        res.json({
            success: true,
            questionSet: {
                questions: questionSet.questions,
                analysisStats: questionSet.analysisStats,
                generationConfig: questionSet.generationConfig,
                generatedAt: questionSet.generatedAt,
                seed: questionSet.seed,
                version: questionSet.version
            }
        });
    }
    catch (error) {
        console.error('[Question Retrieval] Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve questions',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v1/questions/regenerate
 * Regenerate questions with the same seed (for consistency)
 */
exports.questionRouter.post('/api/v1/questions/regenerate', async (req, res) => {
    try {
        const { participantId, phase } = req.body;
        if (!participantId || !phase) {
            return res.status(400).json({ error: 'participantId and phase are required' });
        }
        // Find existing question set to get the original seed
        const existingSet = await Question_1.QuestionSetModel.findOne({ participantId, phase });
        if (!existingSet) {
            return res.status(404).json({ error: 'Original question set not found' });
        }
        const originalSeed = existingSet.seed;
        const count = existingSet.questions.length;
        console.log(`[Question Regeneration] Regenerating ${count} questions with original seed ${originalSeed}`);
        // Regenerate with same seed
        const generatorPhase = mapPhaseToGenerator(phase);
        const { questions, config, analysisStats } = (0, questionGenerator_1.generatePhaseQuestions)(generatorPhase, count, originalSeed);
        // Update the existing question set
        const updatedSet = await Question_1.QuestionSetModel.findOneAndUpdate({ participantId, phase }, {
            questions,
            generationConfig: config,
            analysisStats,
            generatedAt: new Date()
        }, { new: true });
        res.json({
            success: true,
            message: 'Questions regenerated successfully',
            questionSetId: updatedSet?._id,
            questionsRegenerated: questions.length,
            analysisStats,
            seed: originalSeed
        });
    }
    catch (error) {
        console.error('[Question Regeneration] Error:', error);
        res.status(500).json({
            error: 'Failed to regenerate questions',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v1/questions/stats/:participantId
 * Get question generation statistics for a participant across all phases
 */
exports.questionRouter.get('/api/v1/questions/stats/:participantId', async (req, res) => {
    try {
        const { participantId } = req.params;
        const questionSets = await Question_1.QuestionSetModel.find({ participantId }).lean();
        const stats = questionSets.map(set => ({
            phase: set.phase,
            questionCount: set.questions.length,
            analysisStats: set.analysisStats,
            generatedAt: set.generatedAt,
            seed: set.seed
        }));
        const totalQuestions = questionSets.reduce((sum, set) => sum + set.questions.length, 0);
        const phaseCount = questionSets.length;
        res.json({
            success: true,
            participantId,
            totalQuestions,
            phaseCount,
            phases: stats,
            aggregateStats: calculateAggregateStats(questionSets)
        });
    }
    catch (error) {
        console.error('[Question Stats] Error:', error);
        res.status(500).json({
            error: 'Failed to retrieve question statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Helper function to map phase names to generator phase names
 */
function mapPhaseToGenerator(phase) {
    switch (phase) {
        case 'training':
        case 'practice':
            return 'training';
        case 'benchmark':
        case 'skill':
        case 'strategy':
            return 'benchmark';
        case 'prediction':
        case 'final':
            return 'prediction';
        default:
            return 'training'; // Default fallback
    }
}
/**
 * Helper function to calculate aggregate statistics across phases
 */
function calculateAggregateStats(questionSets) {
    if (questionSets.length === 0)
        return null;
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;
    let totalDominance = 0;
    let totalSlackRatio = 0;
    let totalOptimalityGap = 0;
    let questionCount = 0;
    questionSets.forEach(set => {
        const stats = set.analysisStats;
        totalEasy += stats.easyCount;
        totalMedium += stats.mediumCount;
        totalHard += stats.hardCount;
        totalDominance += stats.averageDominance * set.questions.length;
        totalSlackRatio += stats.averageSlackRatio * set.questions.length;
        totalOptimalityGap += stats.averageOptimalityGap * set.questions.length;
        questionCount += set.questions.length;
    });
    return {
        totalQuestions: questionCount,
        difficultyDistribution: {
            easy: totalEasy,
            medium: totalMedium,
            hard: totalHard
        },
        averageMetrics: {
            dominance: questionCount > 0 ? totalDominance / questionCount : 0,
            slackRatio: questionCount > 0 ? totalSlackRatio / questionCount : 0,
            optimalityGap: questionCount > 0 ? totalOptimalityGap / questionCount : 0
        }
    };
}
