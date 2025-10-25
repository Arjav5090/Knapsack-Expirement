/**
 * Utility to load and filter static questions from static-questions.json
 */

import staticQuestions from './static-questions.json';

export interface StaticQuestion {
  id: number;
  capacity: number;
  balls: Array<{
    id: number;
    weight: number;
    reward: number;
    color: string;
  }>;
  solution: number[];
  explanation?: string;
  difficulty?: string;
  phase?: string;
  metadata?: {
    dominanceCount: number;
    slackRatio: number;
    optimalityGap: number;
    densityVariance: number;
  };
}

export interface QuestionSet {
  easy: StaticQuestion[];
  medium: StaticQuestion[];
  hard: StaticQuestion[];
}

/**
 * Load questions for a specific phase and difficulty
 */
export function loadQuestionsForPhase(phase: 'training' | 'benchmark' | 'prediction'): QuestionSet {
  const phaseQuestions = staticQuestions.questions.filter(
    (q: StaticQuestion) => q.phase === phase
  );

  return {
    easy: phaseQuestions.filter(q => q.difficulty === 'easy'),
    medium: phaseQuestions.filter(q => q.difficulty === 'medium'),
    hard: phaseQuestions.filter(q => q.difficulty === 'hard')
  };
}

/**
 * Get specific number of questions for each difficulty
 */
export function getQuestionSet(
  phase: 'training' | 'benchmark' | 'prediction',
  easyCount: number,
  mediumCount: number,
  hardCount: number
): StaticQuestion[] {
  const questions = loadQuestionsForPhase(phase);
  
  // Shuffle arrays to get random selection
  const shuffledEasy = [...questions.easy].sort(() => Math.random() - 0.5);
  const shuffledMedium = [...questions.medium].sort(() => Math.random() - 0.5);
  const shuffledHard = [...questions.hard].sort(() => Math.random() - 0.5);
  
  return [
    ...shuffledEasy.slice(0, easyCount),
    ...shuffledMedium.slice(0, mediumCount),
    ...shuffledHard.slice(0, hardCount)
  ];
}

/**
 * Get questions for Skill Test (Training): 3 easy + 4 medium + 3 hard = 10 total
 */
export function getSkillTestQuestions(): StaticQuestion[] {
  return getQuestionSet('training', 3, 4, 3);
}

/**
 * Get questions for Benchmark Test: 5 easy + 5 medium + 5 hard = 15 total
 */
export function getBenchmarkTestQuestions(): StaticQuestion[] {
  return getQuestionSet('benchmark', 5, 5, 5);
}

/**
 * Get questions for Final Test (Prediction): 5 easy + 5 medium + 5 hard = 15 total
 */
export function getFinalTestQuestions(): StaticQuestion[] {
  return getQuestionSet('prediction', 5, 5, 5);
}

/**
 * Get practice questions (same as skill test for now)
 */
export function getPracticeQuestions(): StaticQuestion[] {
  return getQuestionSet('training', 3, 4, 3);
}
