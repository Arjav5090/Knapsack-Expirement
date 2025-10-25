/**
 * Backend question generation utilities
 * Now uses static questions from static-questions.json instead of dynamic generation
 * Maintains backward compatibility with existing interfaces
 */

// Define types that match frontend (simplified for backend)
interface Ball {
  id: number;
  weight: number;
  reward: number;
  color: string;
}

interface Question {
  id: number;
  capacity: number;
  balls: Ball[];
  solution?: number[];
  explanation?: string;
  difficulty?: string;
  metadata?: {
    dominanceCount: number;
    slackRatio: number;
    optimalityGap: number;
    densityVariance: number;
  };
}

interface GeneratorConfig {
  numItems: number;
  minWeight: number;
  maxWeight: number;
  minReward: number;
  maxReward: number;
  targetSlackRatio?: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  ensureUniqueSolution?: boolean;
}

// Available colors for balls
const BALL_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500",
  "bg-teal-500", "bg-rose-500", "bg-cyan-500", "bg-lime-500",
  "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-sky-500"
];

/**
 * Seeded random number generator for reproducible question generation
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Better seeded random using linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

/**
 * Solves 0-1 knapsack problem using dynamic programming
 */
export function solveKnapsack(items: Ball[], capacity: number): {
  solution: number[];
  maxReward: number;
  solutionWeight: number;
} {
  const n = items.length;
  const dp: number[][] = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  
  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      const item = items[i - 1];
      if (item.weight <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w], // Don't take item
          dp[i - 1][w - item.weight] + item.reward // Take item
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  // Backtrack to find solution
  const solution: number[] = [];
  let w = capacity;
  let totalWeight = 0;
  
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      solution.push(items[i - 1].id);
      totalWeight += items[i - 1].weight;
      w -= items[i - 1].weight;
    }
  }
  
  return {
    solution: solution.reverse(),
    maxReward: dp[n][capacity],
    solutionWeight: totalWeight
  };
}

/**
 * Checks if item i dominates item j
 */
export function itemDominates(item1: Ball, item2: Ball): boolean {
  return (item1.weight <= item2.weight && item1.reward >= item2.reward) &&
         (item1.weight < item2.weight || item1.reward > item2.reward);
}

/**
 * Removes dominated items from the item set
 */
export function removeDominatedItems(items: Ball[]): {
  filtered: Ball[];
  removedCount: number;
} {
  const filtered: Ball[] = [];
  
  for (const item of items) {
    let isDominated = false;
    
    for (const other of items) {
      if (item.id !== other.id && itemDominates(other, item)) {
        isDominated = true;
        break;
      }
    }
    
    if (!isDominated) {
      filtered.push(item);
    }
  }
  
  return {
    filtered,
    removedCount: items.length - filtered.length
  };
}

/**
 * Calculates difficulty metrics for a knapsack problem
 */
export function analyzeDifficulty(items: Ball[], capacity: number, solution: number[]): {
  dominanceCount: number;
  slackRatio: number;
  optimalityGap: number;
  densityVariance: number;
} {
  // Count dominated items
  const { removedCount } = removeDominatedItems(items);
  const dominanceCount = removedCount;
  
  // Calculate slack ratio
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const slackRatio = capacity / totalWeight;
  
  // Calculate density variance
  const densities = items.map(item => item.reward / item.weight);
  const avgDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length;
  const densityVariance = densities.reduce((sum, d) => sum + Math.pow(d - avgDensity, 2), 0) / densities.length;
  
  // Calculate optimality gap
  const optimal = solveKnapsack(items, capacity);
  
  // Find second-best solution
  let secondBestReward = 0;
  const optimalSet = new Set(solution);
  
  // Generate all possible combinations (limited for performance)
  const maxCombinations = Math.min(1 << items.length, 1024); // Limit to prevent timeout
  for (let mask = 0; mask < maxCombinations; mask++) {
    const combination: number[] = [];
    let totalWeight = 0;
    let totalReward = 0;
    
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        combination.push(items[i].id);
        totalWeight += items[i].weight;
        totalReward += items[i].reward;
      }
    }
    
    // Skip if over capacity or is the optimal solution
    if (totalWeight > capacity) continue;
    if (combination.length === optimalSet.size && 
        combination.every(id => optimalSet.has(id))) continue;
    
    secondBestReward = Math.max(secondBestReward, totalReward);
  }
  
  const optimalityGap = optimal.maxReward - secondBestReward;
  
  return {
    dominanceCount,
    slackRatio,
    optimalityGap,
    densityVariance
  };
}

/**
 * Creates items with specific dominance patterns for controlled difficulty
 */
export function createDominancePattern(
  config: GeneratorConfig,
  dominanceType: 'full' | 'partial' | 'none',
  rng: SeededRandom
): Ball[] {
  const items: Ball[] = [];
  
  switch (dominanceType) {
    case 'full':
      // Create fully dominated chain: item1 > item2 > item3 > ...
      for (let i = 0; i < config.numItems; i++) {
        items.push({
          id: i + 1,
          weight: config.minWeight + i * 2,
          reward: config.maxReward - i * 3,
          color: BALL_COLORS[i % BALL_COLORS.length]
        });
      }
      break;
      
    case 'partial':
      // Create some dominance relationships but not complete chain
      for (let i = 0; i < config.numItems; i++) {
        let weight: number;
        let reward: number;
        
        if (i < Math.floor(config.numItems / 2)) {
          // First half with clear dominance
          weight = config.minWeight + i * 2;
          reward = config.maxReward - i * 2;
        } else {
          // Second half with mixed patterns
          weight = rng.range(config.minWeight, config.maxWeight);
          reward = rng.range(config.minReward, config.maxReward);
        }
        
        items.push({
          id: i + 1,
          weight,
          reward,
          color: BALL_COLORS[i % BALL_COLORS.length]
        });
      }
      break;
      
    case 'none':
      // No clear dominance patterns - random but balanced
      for (let i = 0; i < config.numItems; i++) {
        items.push({
          id: i + 1,
          weight: rng.range(config.minWeight, config.maxWeight),
          reward: rng.range(config.minReward, config.maxReward),
          color: BALL_COLORS[i % BALL_COLORS.length]
        });
      }
      break;
  }
  
  return items;
}

/**
 * Adjusts capacity to achieve target slack ratio if specified
 */
export function adjustCapacityForSlackRatio(items: Ball[], targetSlackRatio?: number): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  if (targetSlackRatio) {
    return Math.floor(totalWeight * targetSlackRatio);
  }
  
  // Default to moderate slack (can fit about 60-80% of items)
  return Math.floor(totalWeight * 0.7);
}

/**
 * Validates that the generated question has a unique optimal solution
 */
export function hasUniqueSolution(items: Ball[], capacity: number): boolean {
  const optimal = solveKnapsack(items, capacity);
  let solutionCount = 0;
  
  // Check all possible combinations (limited for performance)
  const maxCombinations = Math.min(1 << items.length, 256);
  for (let mask = 0; mask < maxCombinations; mask++) {
    let totalWeight = 0;
    let totalReward = 0;
    
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        totalWeight += items[i].weight;
        totalReward += items[i].reward;
      }
    }
    
    if (totalWeight <= capacity && totalReward === optimal.maxReward) {
      solutionCount++;
      if (solutionCount > 1) {
        return false;
      }
    }
  }
  
  return solutionCount === 1;
}

/**
 * Main question generator function with seeded randomness
 */
export function generateKnapsackQuestion(
  id: number,
  config: GeneratorConfig,
  seed: number
): Question {
  const rng = new SeededRandom(seed + id); // Unique seed per question
  const maxAttempts = 50; // Reduced for server performance
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Determine dominance pattern based on difficulty
    let dominanceType: 'full' | 'partial' | 'none';
    switch (config.difficultyLevel) {
      case 'easy':
        dominanceType = 'full';
        break;
      case 'medium':
        dominanceType = 'partial';
        break;
      case 'hard':
        dominanceType = 'none';
        break;
    }
    
    // Create items with desired dominance pattern
    const items = createDominancePattern(config, dominanceType, rng);
    
    // Adjust capacity for target slack ratio
    const capacity = adjustCapacityForSlackRatio(items, config.targetSlackRatio);
    
    // Solve the problem
    const solution = solveKnapsack(items, capacity);
    
    // Check if solution meets requirements
    if (solution.solution.length === 0) {
      continue; // No valid solution
    }
    
    if (config.ensureUniqueSolution && !hasUniqueSolution(items, capacity)) {
      continue; // Multiple optimal solutions
    }
    
    // Calculate difficulty metrics
    const metadata = analyzeDifficulty(items, capacity, solution.solution);
    
    // Create explanation
    const explanation = `The optimal selection maximizes reward (${solution.maxReward}) while staying within capacity (${solution.solutionWeight}/${capacity}).`;
    
    return {
      id,
      capacity,
      balls: items,
      solution: solution.solution,
      explanation,
      difficulty: config.difficultyLevel,
      metadata
    };
  }
  
  throw new Error(`Failed to generate valid question after ${maxAttempts} attempts`);
}

/**
 * Pre-defined configurations for different phases
 */
export const PHASE_CONFIGS = {
  training: {
    numItems: 3,
    minWeight: 2,
    maxWeight: 10,
    minReward: 8,
    maxReward: 30,
    ensureUniqueSolution: false  // Allow multiple solutions for more variety
  },
  benchmark: {
    numItems: 5,
    minWeight: 4,
    maxWeight: 12,
    minReward: 12,
    maxReward: 36,
    ensureUniqueSolution: true
  },
  prediction: {
    numItems: 6,
    minWeight: 5,
    maxWeight: 15,
    minReward: 15,
    maxReward: 45,
    ensureUniqueSolution: true
  }
} as const;

/**
 * Loads static questions from JSON file
 */
function loadStaticQuestions() {
  try {
    const fs = require('fs');
    const path = require('path');
    const staticQuestionsPath = path.join(__dirname, '../../../lib/static-questions.json');
    const staticQuestions = JSON.parse(fs.readFileSync(staticQuestionsPath, 'utf8'));
    return staticQuestions.questions;
  } catch (error) {
    console.error('Failed to load static questions:', error);
    return [];
  }
}

/**
 * Gets questions for a specific phase and difficulty distribution
 */
function getStaticQuestionsForPhase(
  phase: 'training' | 'benchmark' | 'prediction',
  easyCount: number,
  mediumCount: number,
  hardCount: number
): Question[] {
  const allQuestions = loadStaticQuestions();
  const phaseQuestions = allQuestions.filter((q: any) => q.phase === phase);
  
  const easyQuestions = phaseQuestions.filter((q: any) => q.difficulty === 'easy');
  const mediumQuestions = phaseQuestions.filter((q: any) => q.difficulty === 'medium');
  const hardQuestions = phaseQuestions.filter((q: any) => q.difficulty === 'hard');
  
  // Shuffle and select the required number
  const shuffledEasy = [...easyQuestions].sort(() => Math.random() - 0.5);
  const shuffledMedium = [...mediumQuestions].sort(() => Math.random() - 0.5);
  const shuffledHard = [...hardQuestions].sort(() => Math.random() - 0.5);
  
  return [
    ...shuffledEasy.slice(0, easyCount),
    ...shuffledMedium.slice(0, mediumCount),
    ...shuffledHard.slice(0, hardCount)
  ];
}

/**
 * Generates questions for different phases using static questions
 */
export function generatePhaseQuestions(
  phase: 'training' | 'benchmark' | 'prediction',
  count: number,
  seed: number
): { questions: Question[]; config: GeneratorConfig; analysisStats: any } {
  let easyCount: number, mediumCount: number, hardCount: number;
  
  switch (phase) {
    case 'training':
      // Skill test: 3 easy + 4 medium + 3 hard = 10 total
      easyCount = 3;
      mediumCount = 4;
      hardCount = 3;
      break;
    case 'benchmark':
      // Benchmark test: 5 easy + 5 medium + 5 hard = 15 total
      easyCount = 5;
      mediumCount = 5;
      hardCount = 5;
      break;
    case 'prediction':
      // Final test: 5 easy + 5 medium + 5 hard = 15 total
      easyCount = 5;
      mediumCount = 5;
      hardCount = 5;
      break;
  }
  
  const questions = getStaticQuestionsForPhase(phase, easyCount, mediumCount, hardCount);
  
  // Calculate analysis stats
  const counts = { easy: 0, medium: 0, hard: 0 };
  let totalDominance = 0;
  let totalSlackRatio = 0;
  let totalOptimalityGap = 0;
  
  questions.forEach(q => {
    if (q.difficulty === 'easy') counts.easy++;
    else if (q.difficulty === 'medium') counts.medium++;
    else if (q.difficulty === 'hard') counts.hard++;
    
    if (q.metadata) {
      totalDominance += q.metadata.dominanceCount;
      totalSlackRatio += q.metadata.slackRatio;
      totalOptimalityGap += q.metadata.optimalityGap;
    }
  });
  
  const analysisStats = {
    easyCount: counts.easy,
    mediumCount: counts.medium,
    hardCount: counts.hard,
    averageDominance: totalDominance / questions.length,
    averageSlackRatio: totalSlackRatio / questions.length,
    averageOptimalityGap: totalOptimalityGap / questions.length
  };
  
  return {
    questions,
    config: { 
      numItems: 0, 
      minWeight: 0, 
      maxWeight: 0, 
      minReward: 0, 
      maxReward: 0, 
      difficultyLevel: 'mixed' as any 
    },
    analysisStats
  };
}
