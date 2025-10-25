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
 * Get practice questions (hardcoded 6 questions: 2 easy + 2 medium + 2 hard)
 */
export function getPracticeQuestions(): StaticQuestion[] {
  // Hardcoded practice questions
  const practiceQuestions = [
    {
      id: 1,
      capacity: 8,
      balls: [
        { id: 1, weight: 3, reward: 12, color: "bg-red-500" },
        { id: 2, weight: 4, reward: 10, color: "bg-blue-500" },
        { id: 3, weight: 2, reward: 8, color: "bg-green-500" }
      ],
      solution: [1, 3],
      explanation: "Select items 1 and 3 for total weight 5 and reward 20, staying within capacity 8.",
      difficulty: "easy"
    },
    {
      id: 2,
      capacity: 10,
      balls: [
        { id: 1, weight: 4, reward: 15, color: "bg-yellow-500" },
        { id: 2, weight: 3, reward: 12, color: "bg-purple-500" },
        { id: 3, weight: 5, reward: 18, color: "bg-pink-500" }
      ],
      solution: [1, 2],
      explanation: "Select items 1 and 2 for total weight 7 and reward 27, staying within capacity 10.",
      difficulty: "easy"
    },
    {
      id: 3,
      capacity: 12,
      balls: [
        { id: 1, weight: 4, reward: 16, color: "bg-indigo-500" },
        { id: 2, weight: 3, reward: 12, color: "bg-orange-500" },
        { id: 3, weight: 5, reward: 20, color: "bg-teal-500" },
        { id: 4, weight: 2, reward: 8, color: "bg-rose-500" }
      ],
      solution: [1, 3, 4],
      explanation: "Select items 1, 3, and 4 for total weight 11 and reward 44, staying within capacity 12.",
      difficulty: "medium"
    },
    {
      id: 4,
      capacity: 15,
      balls: [
        { id: 1, weight: 5, reward: 20, color: "bg-cyan-500" },
        { id: 2, weight: 3, reward: 15, color: "bg-lime-500" },
        { id: 3, weight: 4, reward: 18, color: "bg-amber-500" },
        { id: 4, weight: 6, reward: 22, color: "bg-emerald-500" }
      ],
      solution: [2, 3, 4],
      explanation: "Select items 2, 3, and 4 for total weight 13 and reward 55, staying within capacity 15.",
      difficulty: "medium"
    },
    {
      id: 5,
      capacity: 18,
      balls: [
        { id: 1, weight: 6, reward: 24, color: "bg-violet-500" },
        { id: 2, weight: 4, reward: 18, color: "bg-sky-500" },
        { id: 3, weight: 5, reward: 22, color: "bg-stone-500" },
        { id: 4, weight: 3, reward: 15, color: "bg-slate-500" },
        { id: 5, weight: 7, reward: 28, color: "bg-gray-500" }
      ],
      solution: [2, 3, 4, 5],
      explanation: "Select items 2, 3, 4, and 5 for total weight 16 and reward 65, staying within capacity 18.",
      difficulty: "hard"
    },
    {
      id: 6,
      capacity: 20,
      balls: [
        { id: 1, weight: 7, reward: 28, color: "bg-zinc-500" },
        { id: 2, weight: 4, reward: 20, color: "bg-red-600" },
        { id: 3, weight: 5, reward: 25, color: "bg-blue-600" },
        { id: 4, weight: 3, reward: 18, color: "bg-green-600" },
        { id: 5, weight: 6, reward: 30, color: "bg-yellow-600" }
      ],
      solution: [2, 3, 4, 5],
      explanation: "Select items 2, 3, 4, and 5 for total weight 18 and reward 93, staying within capacity 20.",
      difficulty: "hard"
    }
  ];
  
  return practiceQuestions;
}
