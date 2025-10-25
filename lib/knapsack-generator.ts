/**
 * Knapsack Question Generator
 * Now uses static questions from static-questions.json instead of dynamic generation
 * Maintains backward compatibility with existing interfaces
 */

export interface Ball {
  id: number
  weight: number
  reward: number
  color: string
}

export interface Question {
  id: number
  capacity: number
  balls: Ball[]
  solution?: number[]
  explanation?: string
  difficulty?: string
  metadata?: {
    dominanceCount: number
    slackRatio: number
    optimalityGap: number
    densityVariance: number
  }
}

export interface GeneratorConfig {
  numItems: number
  minWeight: number
  maxWeight: number
  minReward: number
  maxReward: number
  targetSlackRatio?: number // C / sum(weights) target value
  difficultyLevel: 'easy' | 'medium' | 'hard'
  ensureUniqueSolution?: boolean
}

// Available colors for balls
const BALL_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", 
  "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500",
  "bg-teal-500", "bg-rose-500", "bg-cyan-500", "bg-lime-500",
  "bg-amber-500", "bg-emerald-500", "bg-violet-500", "bg-sky-500",
  "bg-stone-500", "bg-slate-500", "bg-gray-500", "bg-zinc-500"
]

/**
 * Solves 0-1 knapsack problem using dynamic programming
 * Returns optimal solution and total reward
 */
export function solveKnapsack(items: Ball[], capacity: number): {
  solution: number[]
  maxReward: number
  solutionWeight: number
} {
  const n = items.length
  const dp: number[][] = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0))
  
  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      const item = items[i - 1]
      if (item.weight <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w], // Don't take item
          dp[i - 1][w - item.weight] + item.reward // Take item
        )
      } else {
        dp[i][w] = dp[i - 1][w]
      }
    }
  }
  
  // Backtrack to find solution
  const solution: number[] = []
  let w = capacity
  let totalWeight = 0
  
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      solution.push(items[i - 1].id)
      totalWeight += items[i - 1].weight
      w -= items[i - 1].weight
    }
  }
  
  return {
    solution: solution.reverse(),
    maxReward: dp[n][capacity],
    solutionWeight: totalWeight
  }
}

/**
 * Checks if item i dominates item j
 * Item i dominates j if w_i <= w_j and r_i >= r_j (with at least one strict inequality)
 */
export function itemDominates(item1: Ball, item2: Ball): boolean {
  return (item1.weight <= item2.weight && item1.reward >= item2.reward) &&
         (item1.weight < item2.weight || item1.reward > item2.reward)
}

/**
 * Removes dominated items from the item set
 * Returns filtered items and count of removed items
 */
export function removeDominatedItems(items: Ball[]): {
  filtered: Ball[]
  removedCount: number
} {
  const filtered: Ball[] = []
  
  for (const item of items) {
    let isDominated = false
    
    for (const other of items) {
      if (item.id !== other.id && itemDominates(other, item)) {
        isDominated = true
        break
      }
    }
    
    if (!isDominated) {
      filtered.push(item)
    }
  }
  
  return {
    filtered,
    removedCount: items.length - filtered.length
  }
}

/**
 * Calculates difficulty metrics for a knapsack problem
 */
export function analyzeDifficulty(items: Ball[], capacity: number, solution: number[]): {
  dominanceCount: number
  slackRatio: number
  optimalityGap: number
  densityVariance: number
} {
  // Count dominated items
  const { removedCount } = removeDominatedItems(items)
  const dominanceCount = removedCount
  
  // Calculate slack ratio
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  const slackRatio = capacity / totalWeight
  
  // Calculate density variance
  const densities = items.map(item => item.reward / item.weight)
  const avgDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length
  const densityVariance = densities.reduce((sum, d) => sum + Math.pow(d - avgDensity, 2), 0) / densities.length
  
  // Calculate optimality gap (difference between best and second-best solutions)
  const optimal = solveKnapsack(items, capacity)
  
  // Find second-best solution by trying all combinations without the optimal solution
  let secondBestReward = 0
  const optimalSet = new Set(solution)
  
  // Generate all possible combinations
  for (let mask = 0; mask < (1 << items.length); mask++) {
    const combination: number[] = []
    let totalWeight = 0
    let totalReward = 0
    
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        combination.push(items[i].id)
        totalWeight += items[i].weight
        totalReward += items[i].reward
      }
    }
    
    // Skip if over capacity or is the optimal solution
    if (totalWeight > capacity) continue
    if (combination.length === optimalSet.size && 
        combination.every(id => optimalSet.has(id))) continue
    
    secondBestReward = Math.max(secondBestReward, totalReward)
  }
  
  const optimalityGap = optimal.maxReward - secondBestReward
  
  return {
    dominanceCount,
    slackRatio,
    optimalityGap,
    densityVariance
  }
}

/**
 * Creates items with specific dominance patterns for controlled difficulty
 */
export function createDominancePattern(
  config: GeneratorConfig,
  dominanceType: 'full' | 'partial' | 'none'
): Ball[] {
  const items: Ball[] = []
  
  switch (dominanceType) {
    case 'full':
      // Create fully dominated chain: item1 > item2 > item3 > ...
      for (let i = 0; i < config.numItems; i++) {
        items.push({
          id: i + 1,
          weight: config.minWeight + i * 2,
          reward: config.maxReward - i * 3,
          color: BALL_COLORS[i % BALL_COLORS.length]
        })
      }
      break
      
    case 'partial':
      // Create some dominance relationships but not complete chain
      for (let i = 0; i < config.numItems; i++) {
        let weight: number
        let reward: number
        
        if (i < Math.floor(config.numItems / 2)) {
          // First half with clear dominance
          weight = config.minWeight + i * 2
          reward = config.maxReward - i * 2
        } else {
          // Second half with mixed patterns
          weight = config.minWeight + Math.floor(Math.random() * (config.maxWeight - config.minWeight))
          reward = config.minReward + Math.floor(Math.random() * (config.maxReward - config.minReward))
        }
        
        items.push({
          id: i + 1,
          weight,
          reward,
          color: BALL_COLORS[i % BALL_COLORS.length]
        })
      }
      break
      
    case 'none':
      // No clear dominance patterns - random but balanced
      for (let i = 0; i < config.numItems; i++) {
        items.push({
          id: i + 1,
          weight: config.minWeight + Math.floor(Math.random() * (config.maxWeight - config.minWeight)),
          reward: config.minReward + Math.floor(Math.random() * (config.maxReward - config.minReward)),
          color: BALL_COLORS[i % BALL_COLORS.length]
        })
      }
      break
  }
  
  return items
}

/**
 * Adjusts capacity to achieve target slack ratio if specified
 */
export function adjustCapacityForSlackRatio(items: Ball[], targetSlackRatio?: number): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  
  if (targetSlackRatio) {
    return Math.floor(totalWeight * targetSlackRatio)
  }
  
  // Default to moderate slack (can fit about 60-80% of items)
  return Math.floor(totalWeight * 0.7)
}

/**
 * Validates that the generated question has a unique optimal solution
 */
export function hasUniqueSolution(items: Ball[], capacity: number): boolean {
  const optimal = solveKnapsack(items, capacity)
  let solutionCount = 0
  
  // Check all possible combinations
  for (let mask = 0; mask < (1 << items.length); mask++) {
    let totalWeight = 0
    let totalReward = 0
    
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        totalWeight += items[i].weight
        totalReward += items[i].reward
      }
    }
    
    if (totalWeight <= capacity && totalReward === optimal.maxReward) {
      solutionCount++
      if (solutionCount > 1) {
        return false
      }
    }
  }
  
  return solutionCount === 1
}

/**
 * Main question generator function
 */
export function generateKnapsackQuestion(
  id: number,
  config: GeneratorConfig
): Question {
  const maxAttempts = 100
  let attempts = 0
  
  while (attempts < maxAttempts) {
    attempts++
    
    // Determine dominance pattern based on difficulty
    let dominanceType: 'full' | 'partial' | 'none'
    switch (config.difficultyLevel) {
      case 'easy':
        dominanceType = 'full'
        break
      case 'medium':
        dominanceType = 'partial'
        break
      case 'hard':
        dominanceType = 'none'
        break
    }
    
    // Create items with desired dominance pattern
    const items = createDominancePattern(config, dominanceType)
    
    // Adjust capacity for target slack ratio
    const capacity = adjustCapacityForSlackRatio(items, config.targetSlackRatio)
    
    // Solve the problem
    const solution = solveKnapsack(items, capacity)
    
    // Check if solution meets requirements
    if (solution.solution.length === 0) {
      continue // No valid solution
    }
    
    if (config.ensureUniqueSolution && !hasUniqueSolution(items, capacity)) {
      continue // Multiple optimal solutions
    }
    
    // Calculate difficulty metrics
    const metadata = analyzeDifficulty(items, capacity, solution.solution)
    
    // Create explanation
    const explanation = `The optimal selection maximizes reward (${solution.maxReward}) while staying within capacity (${solution.solutionWeight}/${capacity}).`
    
    return {
      id,
      capacity,
      balls: items,
      solution: solution.solution,
      explanation,
      difficulty: config.difficultyLevel,
      metadata
    }
  }
  
  throw new Error(`Failed to generate valid question after ${maxAttempts} attempts`)
}

/**
 * Generates a set of questions using static questions from JSON
 */
export function generateQuestionSet(
  count: number,
  baseConfig: Partial<GeneratorConfig> = {}
): Question[] {
  // Import static question loader
  const { getSkillTestQuestions, getBenchmarkTestQuestions, getFinalTestQuestions, getPracticeQuestions } = require('./static-question-loader')
  
  // Determine which question set to use based on context
  // This is a simplified approach - in practice, you'd pass the phase as a parameter
  let staticQuestions: any[] = []
  
  // For now, default to skill test questions (training phase)
  // In practice, you'd determine this based on the current phase
  staticQuestions = getSkillTestQuestions()
  
  // Convert static questions to the expected format
  return staticQuestions.slice(0, count).map((q, index) => ({
    id: index + 1,
    capacity: q.capacity,
    balls: q.balls,
    solution: q.solution,
    explanation: q.explanation,
    difficulty: q.difficulty,
    metadata: q.metadata
  }))
}

/**
 * Generates practice questions (hardcoded 6 questions)
 */
export function generatePracticeQuestions(): Question[] {
  const { getPracticeQuestions } = require('./static-question-loader')
  const practiceQuestions = getPracticeQuestions()
  
  return practiceQuestions.map((q: any, index: number) => ({
    id: index + 1,
    capacity: q.capacity,
    balls: q.balls,
    solution: q.solution,
    explanation: q.explanation,
    difficulty: q.difficulty,
    metadata: {
      dominanceCount: 0,
      slackRatio: 0,
      optimalityGap: 0,
      densityVariance: 0
    }
  }))
}

/**
 * Pre-defined configurations for different phases
 */
export const PHASE_CONFIGS = {
  training: {
    numItems: 3,
    minWeight: 3,
    maxWeight: 8,
    minReward: 9,
    maxReward: 24,
    ensureUniqueSolution: true
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
} as const
