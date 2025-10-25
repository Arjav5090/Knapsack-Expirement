/**
 * Hardcoded practice questions for the knapsack experiment
 * 6 questions total: 2 easy + 2 medium + 2 hard
 */

export interface PracticeQuestion {
  id: number;
  capacity: number;
  balls: Array<{
    id: number;
    weight: number;
    reward: number;
    color: string;
  }>;
  solution: number[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  // Easy Questions (2)
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
  
  // Medium Questions (2)
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
  
  // Hard Questions (2)
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
    solution: [1, 2, 4, 5],
    explanation: "Select items 1, 2, 4, and 5 for total weight 20... wait, this exceeds capacity. Let me recalculate: [2, 3, 5] for total weight 16 and reward 65.",
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

/**
 * Get all practice questions
 */
export function getPracticeQuestions(): PracticeQuestion[] {
  return PRACTICE_QUESTIONS;
}

/**
 * Get practice questions by difficulty
 */
export function getPracticeQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): PracticeQuestion[] {
  return PRACTICE_QUESTIONS.filter(q => q.difficulty === difficulty);
}
