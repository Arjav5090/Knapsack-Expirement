import express from 'express';
import { z } from 'zod';
import { QuestionSetModel } from '../models/Question';
import { generatePhaseQuestions } from '../lib/questionGenerator';

export const questionRouter = express.Router();

// Zod schemas for validation
const GenerateQuestionsSchema = z.object({
  participantId: z.string().min(1),
  phase: z.enum(['training', 'benchmark', 'prediction', 'practice', 'skill', 'strategy', 'final']),
  count: z.number().min(1).max(50).default(10),
  seed: z.number().optional()
});

const GetQuestionsSchema = z.object({
  participantId: z.string().min(1),
  phase: z.enum(['training', 'benchmark', 'prediction', 'practice', 'skill', 'strategy', 'final'])
});

/**
 * POST /api/v1/questions/generate
 * Generate and store a new question set for a participant and phase
 */
questionRouter.post('/api/v1/questions/generate', async (req, res) => {
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
    
    // Map phase names to generator phase names and get correct question count
    const generatorPhase = mapPhaseToGenerator(phase);
    const questionCount = getQuestionCountForPhase(phase);
    
    console.log(`[Question Generation] Generating ${questionCount} questions for participant ${participantId}, phase ${phase}, seed ${generationSeed}`);

    // Generate questions using static questions
    // Pass original phase name to handle 'skill' phase specially
    const { questions, config, analysisStats } = generatePhaseQuestions(
      generatorPhase,
      questionCount,
      generationSeed,
      phase // Pass original phase name
    );

    // Check if question set already exists and delete it
    await QuestionSetModel.deleteOne({ participantId, phase });

    // Save the generated question set
    const questionSet = await QuestionSetModel.create({
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

  } catch (error) {
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
questionRouter.get('/api/v1/questions/:participantId/:phase', async (req, res) => {
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

    const questionSet = await QuestionSetModel.findOne({ 
      participantId, 
      phase 
    }).lean() as any;

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

  } catch (error) {
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
questionRouter.post('/api/v1/questions/regenerate', async (req, res) => {
  try {
    const { participantId, phase } = req.body;
    
    if (!participantId || !phase) {
      return res.status(400).json({ error: 'participantId and phase are required' });
    }

    // Find existing question set to get the original seed
    const existingSet = await QuestionSetModel.findOne({ participantId, phase });
    
    if (!existingSet) {
      return res.status(404).json({ error: 'Original question set not found' });
    }

    const originalSeed = existingSet.seed;
    const count = existingSet.questions.length;

    console.log(`[Question Regeneration] Regenerating ${count} questions with original seed ${originalSeed}`);

    // Regenerate with same seed
    const generatorPhase = mapPhaseToGenerator(phase);
    const { questions, config, analysisStats } = generatePhaseQuestions(
      generatorPhase,
      count,
      originalSeed
    );

    // Update the existing question set
    const updatedSet = await QuestionSetModel.findOneAndUpdate(
      { participantId, phase },
      {
        questions,
        generationConfig: config,
        analysisStats,
        generatedAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Questions regenerated successfully',
      questionSetId: updatedSet?._id,
      questionsRegenerated: questions.length,
      analysisStats,
      seed: originalSeed
    });

  } catch (error) {
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
questionRouter.get('/api/v1/questions/stats/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;

    const questionSets = await QuestionSetModel.find({ participantId }).lean();

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

  } catch (error) {
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
function mapPhaseToGenerator(phase: string): 'training' | 'benchmark' | 'prediction' {
  switch (phase) {
    case 'training':
    case 'practice':
      return 'training';
    case 'skill':
      // Skill test (Test 1) uses training phase but with grouped ordering
      return 'training';
    case 'benchmark':
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
 * Helper function to get the correct question count for each phase
 */
function getQuestionCountForPhase(phase: string): number {
  switch (phase) {
    case 'training':
    case 'practice':
      return 6; // 2 easy + 2 medium + 2 hard (hardcoded practice questions)
    case 'skill':
      return 10; // Test 1: 3 easy + 4 medium + 3 hard
    case 'benchmark':
    case 'strategy':
      return 30; // 10 easy + 10 medium + 10 hard
    case 'prediction':
    case 'final':
      return 30; // 10 easy + 10 medium + 10 hard
    default:
      return 6; // Default fallback to practice
  }
}

/**
 * Helper function to calculate aggregate statistics across phases
 */
function calculateAggregateStats(questionSets: any[]) {
  if (questionSets.length === 0) return null;

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
