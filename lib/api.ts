import type { Question } from './knapsack-generator';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://knapsack-expirement.onrender.com';

export async function sendSession(session: {
    participantId: string;
    testId: string;
    events: Array<{ type: string; payload?: any; ts?: string }>;
    metadata?: { durationMs?: number; userAgent?: string };
  }) {
    const res = await fetch(`${API_BASE}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer supersecuretoken'
      },
      body: JSON.stringify(session)
    });
  
    if (!res.ok) {
      console.error('[sendSession] failed', await res.json());
      throw new Error('Session upload failed');
    }
  
    return res.json();
  }

// Question Management API Functions

export interface QuestionSetResponse {
  success: boolean;
  questionSet: {
    questions: Question[];
    analysisStats: {
      easyCount: number;
      mediumCount: number;
      hardCount: number;
      averageDominance: number;
      averageSlackRatio: number;
      averageOptimalityGap: number;
    };
    generationConfig: any;
    generatedAt: string;
    seed: number;
    version: string;
  };
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questionSetId: string;
  participantId: string;
  phase: string;
  questionsGenerated: number;
  analysisStats: any;
  seed: number;
}

/**
 * Generate questions for a specific participant and phase
 */
export async function generateQuestions(params: {
  participantId: string;
  phase: string;
  count?: number;
  seed?: number;
}): Promise<GenerateQuestionsResponse> {
  const res = await fetch(`${API_BASE}/api/v1/questions/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('[generateQuestions] failed', error);
    throw new Error(error.error || 'Question generation failed');
  }

  return res.json();
}

/**
 * Get questions for a specific participant and phase
 */
export async function getQuestions(
  participantId: string, 
  phase: string
): Promise<QuestionSetResponse> {
  const res = await fetch(`${API_BASE}/api/v1/questions/${participantId}/${phase}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('[getQuestions] failed', error);
    throw new Error(error.error || 'Failed to retrieve questions');
  }

  return res.json();
}

/**
 * Get or generate questions for a phase
 * This function first tries to get existing questions, and if not found, generates new ones
 */
export async function getOrGenerateQuestions(params: {
  participantId: string;
  phase: string;
  count?: number;
  seed?: number;
}): Promise<Question[]> {
  try {
    // First try to get existing questions
    const response = await getQuestions(params.participantId, params.phase);
    console.log(`[getOrGenerateQuestions] Found existing questions for ${params.phase}:`, response.questionSet.questions.length);
    return response.questionSet.questions;
  } catch (error) {
    // If not found, generate new questions
    console.log(`[getOrGenerateQuestions] No existing questions found, generating new ones for ${params.phase}`);
    
    const generateResponse = await generateQuestions(params);
    console.log(`[getOrGenerateQuestions] Generated ${generateResponse.questionsGenerated} questions`);
    
    // Now fetch the generated questions
    const response = await getQuestions(params.participantId, params.phase);
    return response.questionSet.questions;
  }
}

/**
 * Regenerate questions with the same seed for consistency
 */
export async function regenerateQuestions(
  participantId: string,
  phase: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/v1/questions/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ participantId, phase })
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('[regenerateQuestions] failed', error);
    throw new Error(error.error || 'Question regeneration failed');
  }

  return res.json();
}

/**
 * Get question statistics for a participant
 */
export async function getQuestionStats(participantId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/v1/questions/stats/${participantId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('[getQuestionStats] failed', error);
    throw new Error(error.error || 'Failed to retrieve question statistics');
  }

  return res.json();
}
  