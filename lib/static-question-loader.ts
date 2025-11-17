/**
 * Utility to load and filter static questions from static-questions.json
 */

import staticQuestions from './static-questions.json';
import { NUM_BALLS } from './config';

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
 * Filters by NUM_BALLS to ensure all questions have the correct number of balls
 */
export function loadQuestionsForPhase(phase: 'training' | 'benchmark' | 'prediction'): QuestionSet {
  const phaseQuestions = staticQuestions.questions.filter(
    (q: StaticQuestion) => q.phase === phase && q.balls.length === NUM_BALLS
  );

  return {
    easy: phaseQuestions.filter(q => q.difficulty === 'easy'),
    medium: phaseQuestions.filter(q => q.difficulty === 'medium'),
    hard: phaseQuestions.filter(q => q.difficulty === 'hard')
  };
}

/**
 * Get specific number of questions for each difficulty
 * Filters by NUM_BALLS automatically via loadQuestionsForPhase
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
 * Randomize question order using weighted random selection
 * Optimized approach: randomly selects difficulty based on remaining counts
 * More memory-efficient than generating all permutations
 */
function randomizeQuestionOrder(
  easyQuestions: StaticQuestion[],
  mediumQuestions: StaticQuestion[],
  hardQuestions: StaticQuestion[],
  easyCount: number,
  mediumCount: number,
  hardCount: number
): StaticQuestion[] {
  // Shuffle questions within each difficulty group
  const shuffledEasy = [...easyQuestions].sort(() => Math.random() - 0.5);
  const shuffledMedium = [...mediumQuestions].sort(() => Math.random() - 0.5);
  const shuffledHard = [...hardQuestions].sort(() => Math.random() - 0.5);
  
  // Build result array by randomly selecting from remaining difficulties
  const result: StaticQuestion[] = [];
  let easyIndex = 0;
  let mediumIndex = 0;
  let hardIndex = 0;
  let eRemaining = easyCount;
  let mRemaining = mediumCount;
  let hRemaining = hardCount;
  
  const total = easyCount + mediumCount + hardCount;
  
  for (let i = 0; i < total; i++) {
    // Calculate weights based on remaining counts
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
      // Fallback if one category runs out
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
 * Get questions for Skill Test (Training): grouped by difficulty
 * Returns: all easy questions first, then all medium, then all hard
 * No randomization - maintains fixed order for Test 1
 */
export function getSkillTestQuestions(): StaticQuestion[] {
  const questions = loadQuestionsForPhase('training');
  
  // Shuffle within each difficulty group for variety, but keep groups separate
  const shuffledEasy = [...questions.easy].sort(() => Math.random() - 0.5);
  const shuffledMedium = [...questions.medium].sort(() => Math.random() - 0.5);
  const shuffledHard = [...questions.hard].sort(() => Math.random() - 0.5);
  
  // Return in order: all easy, then all medium, then all hard
  // Take enough questions to have a good distribution
  // Adjust counts as needed - using 3, 4, 3 as before but can be changed
  return [
    ...shuffledEasy.slice(0, 3),
    ...shuffledMedium.slice(0, 4),
    ...shuffledHard.slice(0, 3)
  ];
}

/**
 * Get questions for Benchmark Test: 10 easy + 10 medium + 10 hard = 30 total
 * Questions are randomized using permutation patterns
 */
export function getBenchmarkTestQuestions(): StaticQuestion[] {
  const questions = loadQuestionsForPhase('benchmark');
  
  // Shuffle within each difficulty group
  const shuffledEasy = [...questions.easy].sort(() => Math.random() - 0.5);
  const shuffledMedium = [...questions.medium].sort(() => Math.random() - 0.5);
  const shuffledHard = [...questions.hard].sort(() => Math.random() - 0.5);
  
  // Randomize order using permutation patterns
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
 * Get questions for Final Test (Prediction): 10 easy + 10 medium + 10 hard = 30 total
 * Questions are randomized using permutation patterns
 */
export function getFinalTestQuestions(): StaticQuestion[] {
  const questions = loadQuestionsForPhase('prediction');
  
  // Shuffle within each difficulty group
  const shuffledEasy = [...questions.easy].sort(() => Math.random() - 0.5);
  const shuffledMedium = [...questions.medium].sort(() => Math.random() - 0.5);
  const shuffledHard = [...questions.hard].sort(() => Math.random() - 0.5);
  
  // Randomize order using permutation patterns
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
 * Get practice questions (hardcoded 6 questions: 2 easy + 2 medium + 2 hard)
 * Updated to use NUM_BALLS
 */
export function getPracticeQuestions(): StaticQuestion[] {
  // Hardcoded practice questions - ensure they have NUM_BALLS balls
  const practiceQuestions: StaticQuestion[] = [
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
  
  // Filter to ensure all have NUM_BALLS
  return practiceQuestions.filter(q => q.balls.length === NUM_BALLS);
}
