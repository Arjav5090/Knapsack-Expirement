/**
 * Participant Question Loader
 * Implements the same logic as generate-participant-questions.ts
 * but loads and organizes questions dynamically in the frontend
 */

import staticQuestions from './static-questions.json';
import { NUM_BALLS } from './config';

export interface Ball {
  id: number;
  weight: number;
  reward: number;
  color: string;
}

export interface Question {
  id: number;
  capacity: number;
  balls: Ball[];
  solution?: number[];
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

interface QuestionSet {
  easy: Question[];
  medium: Question[];
  hard: Question[];
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Load questions for a specific phase and difficulty
 */
function loadQuestionsForPhase(phase: 'training' | 'benchmark' | 'prediction'): QuestionSet {
  const phaseQuestions = (staticQuestions.questions as Question[]).filter(
    (q) => q.phase === phase && q.balls.length === NUM_BALLS
  );

  return {
    easy: phaseQuestions.filter(q => q.difficulty === 'easy'),
    medium: phaseQuestions.filter(q => q.difficulty === 'medium'),
    hard: phaseQuestions.filter(q => q.difficulty === 'hard')
  };
}

/**
 * Randomize question order using weighted random selection
 */
function randomizeQuestionOrder(
  easyQuestions: Question[],
  mediumQuestions: Question[],
  hardQuestions: Question[],
  easyCount: number,
  mediumCount: number,
  hardCount: number
): Question[] {
  const shuffledEasy = shuffle(easyQuestions);
  const shuffledMedium = shuffle(mediumQuestions);
  const shuffledHard = shuffle(hardQuestions);
  
  const result: Question[] = [];
  let easyIndex = 0;
  let mediumIndex = 0;
  let hardIndex = 0;
  let eRemaining = easyCount;
  let mRemaining = mediumCount;
  let hRemaining = hardCount;
  
  const total = easyCount + mediumCount + hardCount;
  
  for (let i = 0; i < total; i++) {
    const totalRemaining = eRemaining + mRemaining + hRemaining;
    const rand = Math.random() * totalRemaining;
    
    if (rand < eRemaining && easyIndex < shuffledEasy.length) {
      result.push(shuffledEasy[easyIndex++]);
      eRemaining--;
    } else if (rand < eRemaining + mRemaining && mediumIndex < shuffledMedium.length) {
      result.push(shuffledMedium[mediumIndex++]);
      mRemaining--;
    } else if (hardIndex < shuffledHard.length) {
      result.push(shuffledHard[hardIndex++]);
      hRemaining--;
    } else if (easyIndex < shuffledEasy.length) {
      result.push(shuffledEasy[easyIndex++]);
      eRemaining--;
    } else if (mediumIndex < shuffledMedium.length) {
      result.push(shuffledMedium[mediumIndex++]);
      mRemaining--;
    }
  }
  
  return result;
}

/**
 * Get practice questions (hardcoded 6 questions: 2 easy + 2 medium + 2 hard)
 */
export function getPracticeQuestions(): Question[] {
  const practiceQuestions: Question[] = [
    {
      id: 1,
      capacity: 8,
      balls: [
        { id: 1, weight: 3, reward: 12, color: "bg-red-500" },
        { id: 2, weight: 4, reward: 10, color: "bg-blue-500" },
        { id: 3, weight: 2, reward: 8, color: "bg-green-500" },
        { id: 4, weight: 5, reward: 15, color: "bg-yellow-500" }
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
        { id: 3, weight: 5, reward: 18, color: "bg-pink-500" },
        { id: 4, weight: 2, reward: 10, color: "bg-indigo-500" }
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
        { id: 4, weight: 3, reward: 15, color: "bg-slate-500" }
      ],
      solution: [2, 3, 4],
      explanation: "Select items 2, 3, and 4 for total weight 12 and reward 55, staying within capacity 18.",
      difficulty: "hard"
    },
    {
      id: 6,
      capacity: 20,
      balls: [
        { id: 1, weight: 7, reward: 28, color: "bg-zinc-500" },
        { id: 2, weight: 4, reward: 20, color: "bg-red-600" },
        { id: 3, weight: 5, reward: 25, color: "bg-blue-600" },
        { id: 4, weight: 3, reward: 18, color: "bg-green-600" }
      ],
      solution: [2, 3, 4],
      explanation: "Select items 2, 3, and 4 for total weight 12 and reward 63, staying within capacity 20.",
      difficulty: "hard"
    }
  ];
  
  return practiceQuestions.filter(q => q.balls.length === NUM_BALLS);
}

/**
 * Get questions for Skill Test (Test 1): 3 easy + 4 medium + 3 hard = 10 total
 * Questions are GROUPED by difficulty (easy first, then medium, then hard)
 */
export function getSkillTestQuestions(): Question[] {
  const questions = loadQuestionsForPhase('training');
  
  // Shuffle within each difficulty group, but keep groups separate
  const shuffledEasy = shuffle(questions.easy);
  const shuffledMedium = shuffle(questions.medium);
  const shuffledHard = shuffle(questions.hard);
  
  // Return in order: all easy, then all medium, then all hard
  return [
    ...shuffledEasy.slice(0, 3),
    ...shuffledMedium.slice(0, 4),
    ...shuffledHard.slice(0, 3)
  ];
}

/**
 * Get questions for Benchmark Test (Test 2): 10 easy + 10 medium + 10 hard = 30 total
 * Questions are RANDOMIZED (not grouped)
 */
export function getBenchmarkPhaseQuestions(): Question[] {
  const questions = loadQuestionsForPhase('benchmark');
  
  const shuffledEasy = shuffle(questions.easy);
  const shuffledMedium = shuffle(questions.medium);
  const shuffledHard = shuffle(questions.hard);
  
  return randomizeQuestionOrder(
    shuffledEasy,
    shuffledMedium,
    shuffledHard,
    10,
    10,
    10
  );
}

/**
 * Get questions for Final Test (Test 3): 10 easy + 10 medium + 10 hard = 30 total
 * Questions are RANDOMIZED (not grouped)
 */
export function getPredictionPhaseQuestions(): Question[] {
  const questions = loadQuestionsForPhase('prediction');
  
  const shuffledEasy = shuffle(questions.easy);
  const shuffledMedium = shuffle(questions.medium);
  const shuffledHard = shuffle(questions.hard);
  
  return randomizeQuestionOrder(
    shuffledEasy,
    shuffledMedium,
    shuffledHard,
    10,
    10,
    10
  );
}

/**
 * Aliases for consistency with old static-loader
 */
export const getTrainingPhase1Questions = getPracticeQuestions;
export const getTrainingPhase2Questions = getSkillTestQuestions;

