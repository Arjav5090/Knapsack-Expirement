/**
 * Script to generate static question set for all phases and difficulties
 * Generates many questions and removes duplicates to create a final static set
 */

import { writeFileSync } from 'fs';

// Define types
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
  phase?: string;
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
 * Seeded random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Solves 0-1 knapsack problem using dynamic programming
 */
function solveKnapsack(items: Ball[], capacity: number): {
  solution: number[];
  maxReward: number;
  solutionWeight: number;
} {
  const n = items.length;
  const dp: number[][] = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      const item = items[i - 1];
      if (item.weight <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - item.weight] + item.reward
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
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
 * Check if item i dominates item j
 */
function itemDominates(item1: Ball, item2: Ball): boolean {
  return (item1.weight <= item2.weight && item1.reward >= item2.reward) &&
         (item1.weight < item2.weight || item1.reward > item2.reward);
}

/**
 * Remove dominated items
 */
function removeDominatedItems(items: Ball[]): {
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
 * Analyze difficulty
 */
function analyzeDifficulty(items: Ball[], capacity: number, solution: number[]): {
  dominanceCount: number;
  slackRatio: number;
  optimalityGap: number;
  densityVariance: number;
} {
  const { removedCount } = removeDominatedItems(items);
  const dominanceCount = removedCount;
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const slackRatio = capacity / totalWeight;
  
  const densities = items.map(item => item.reward / item.weight);
  const avgDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length;
  const densityVariance = densities.reduce((sum, d) => sum + Math.pow(d - avgDensity, 2), 0) / densities.length;
  
  const optimal = solveKnapsack(items, capacity);
  
  let secondBestReward = 0;
  const optimalSet = new Set(solution);
  
  const maxCombinations = Math.min(1 << items.length, 1024);
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
 * Create dominance pattern
 */
function createDominancePattern(
  config: GeneratorConfig,
  dominanceType: 'full' | 'partial' | 'none',
  rng: SeededRandom
): Ball[] {
  const items: Ball[] = [];
  
  switch (dominanceType) {
    case 'full':
      // Create fully dominated chain with some randomness for variety
      for (let i = 0; i < config.numItems; i++) {
        // Add random variation to weights and rewards while maintaining dominance
        const weightVariation = rng.range(0, 2);
        const rewardVariation = rng.range(0, 3);
        items.push({
          id: i + 1,
          weight: config.minWeight + i * 2 + weightVariation,
          reward: config.maxReward - i * 3 - rewardVariation,
          color: BALL_COLORS[i % BALL_COLORS.length]
        });
      }
      break;
      
    case 'partial':
      for (let i = 0; i < config.numItems; i++) {
        let weight: number;
        let reward: number;
        
        if (i < Math.floor(config.numItems / 2)) {
          weight = config.minWeight + i * 2;
          reward = config.maxReward - i * 2;
        } else {
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
 * Adjust capacity
 */
function adjustCapacityForSlackRatio(items: Ball[], targetSlackRatio?: number, rng?: SeededRandom): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  if (targetSlackRatio) {
    return Math.floor(totalWeight * targetSlackRatio);
  }
  
  // Add some randomness to capacity for more variety (0.6 to 0.8)
  const slackRatio = rng ? 0.6 + rng.next() * 0.2 : 0.7;
  return Math.floor(totalWeight * slackRatio);
}

/**
 * Generate a single knapsack question
 */
function generateKnapsackQuestion(
  id: number,
  config: GeneratorConfig,
  phase: string,
  seed: number
): Question | null {
  const rng = new SeededRandom(seed + id);
  const maxAttempts = 50;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
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
    
    const items = createDominancePattern(config, dominanceType, rng);
    const capacity = adjustCapacityForSlackRatio(items, config.targetSlackRatio, rng);
    const solution = solveKnapsack(items, capacity);
    
    if (solution.solution.length === 0) {
      continue;
    }
    
    const metadata = analyzeDifficulty(items, capacity, solution.solution);
    const explanation = `The optimal selection maximizes reward (${solution.maxReward}) while staying within capacity (${solution.solutionWeight}/${capacity}).`;
    
    return {
      id,
      capacity,
      balls: items,
      solution: solution.solution,
      explanation,
      difficulty: config.difficultyLevel,
      phase,
      metadata
    };
  }
  
  return null;
}

/**
 * Configuration for each phase and difficulty
 */
const PHASE_CONFIGS = {
  training: {
    easy: { numItems: 3, minWeight: 2, maxWeight: 8, minReward: 8, maxReward: 24 },
    medium: { numItems: 4, minWeight: 3, maxWeight: 10, minReward: 10, maxReward: 30 },
    hard: { numItems: 5, minWeight: 4, maxWeight: 12, minReward: 12, maxReward: 36 }
  },
  benchmark: {
    easy: { numItems: 4, minWeight: 3, maxWeight: 10, minReward: 10, maxReward: 30 },
    medium: { numItems: 5, minWeight: 4, maxWeight: 12, minReward: 12, maxReward: 36 },
    hard: { numItems: 6, minWeight: 5, maxWeight: 15, minReward: 15, maxReward: 45 }
  },
  prediction: {
    easy: { numItems: 4, minWeight: 4, maxWeight: 12, minReward: 12, maxReward: 36 },
    medium: { numItems: 5, minWeight: 5, maxWeight: 14, minReward: 14, maxReward: 42 },
    hard: { numItems: 6, minWeight: 5, maxWeight: 15, minReward: 15, maxReward: 45 }
  }
};

/**
 * Generate question hash for duplicate detection
 */
function getQuestionHash(question: Question): string {
  // Create a hash based on capacity and sorted balls (by weight and reward)
  const sortedBalls = [...question.balls]
    .sort((a, b) => a.weight - b.weight || a.reward - b.reward)
    .map(b => `${b.weight}-${b.reward}`)
    .join(',');
  return `${question.capacity}:${sortedBalls}`;
}

/**
 * Remove duplicate questions
 */
function removeDuplicates(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const unique: Question[] = [];
  
  for (const question of questions) {
    const hash = getQuestionHash(question);
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(question);
    }
  }
  
  return unique;
}

/**
 * Main generation function
 */
function generateStaticQuestions() {
  console.log('🚀 Starting static question generation...\n');
  
  const allQuestions: Question[] = [];
  let questionId = 1;
  
  // Generate questions for each phase and difficulty
  const phases = ['training', 'benchmark', 'prediction'];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  
  // Generate a larger number of questions to ensure variety after deduplication
  const questionsPerCombination = 100; // Generate 100 questions per phase-difficulty combo
  
  for (const phase of phases) {
    console.log(`📋 Generating questions for ${phase.toUpperCase()} phase...`);
    
    for (const difficulty of difficulties) {
      console.log(`  ⚙️  Difficulty: ${difficulty}...`);
      
      const baseConfig = PHASE_CONFIGS[phase as keyof typeof PHASE_CONFIGS][difficulty];
      
      let successCount = 0;
      let seed = 10000 + Math.random() * 100000; // Random starting seed
      
      for (let i = 0; i < questionsPerCombination; i++) {
        const config: GeneratorConfig = {
          ...baseConfig,
          difficultyLevel: difficulty,
          ensureUniqueSolution: false // Allow more variety
        };
        
        const question = generateKnapsackQuestion(
          questionId++,
          config,
          phase,
          seed + i * 1000
        );
        
        if (question) {
          allQuestions.push(question);
          successCount++;
        }
      }
      
      console.log(`    ✅ Generated ${successCount} questions`);
    }
  }
  
  console.log(`\n📊 Total questions generated: ${allQuestions.length}`);
  
  // Remove duplicates
  console.log('\n🔍 Removing duplicates...');
  const uniqueQuestions = removeDuplicates(allQuestions);
  console.log(`✨ Unique questions after deduplication: ${uniqueQuestions.length}`);
  console.log(`🗑️  Removed ${allQuestions.length - uniqueQuestions.length} duplicates`);
  
  // Re-assign sequential IDs
  uniqueQuestions.forEach((q, index) => {
    q.id = index + 1;
  });
  
  // Generate statistics
  console.log('\n📈 Statistics:');
  const stats: Record<string, Record<string, number>> = {};
  
  for (const phase of phases) {
    stats[phase] = { easy: 0, medium: 0, hard: 0 };
    for (const difficulty of difficulties) {
      const count = uniqueQuestions.filter(
        q => q.phase === phase && q.difficulty === difficulty
      ).length;
      stats[phase][difficulty] = count;
    }
  }
  
  for (const phase of phases) {
    console.log(`\n  ${phase.toUpperCase()}:`);
    console.log(`    Easy: ${stats[phase].easy}`);
    console.log(`    Medium: ${stats[phase].medium}`);
    console.log(`    Hard: ${stats[phase].hard}`);
    console.log(`    Total: ${stats[phase].easy + stats[phase].medium + stats[phase].hard}`);
  }
  
  // Save to JSON file
  const outputPath = './lib/static-questions.json';
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalQuestions: uniqueQuestions.length,
      statistics: stats,
      version: '1.0.0'
    },
    questions: uniqueQuestions
  };
  
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Questions saved to: ${outputPath}`);
  console.log('✅ Done!\n');
}

// Run the generator
generateStaticQuestions();

