/**
 * Utility functions for working with generated knapsack questions
 * Provides convenient wrappers and helper functions for different experiment phases
 */

import { 
  generateKnapsackQuestion, 
  generateQuestionSet, 
  PHASE_CONFIGS, 
  type Question, 
  type GeneratorConfig 
} from './knapsack-generator'

/**
 * Generates questions for the training phase
 * Easy difficulty with clear dominance patterns
 */
export function generateTrainingQuestions(count: number = 3): Question[] {
  return generateQuestionSet(count, {
    ...PHASE_CONFIGS.training,
    difficultyLevel: 'easy'
  })
}

/**
 * Generates questions for the benchmark phase
 * Mixed difficulty levels for strategy assessment
 */
export function generateBenchmarkQuestions(count: number = 10): Question[] {
  const questions: Question[] = []
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
  
  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[i % difficulties.length]
    
    const config: GeneratorConfig = {
      ...PHASE_CONFIGS.benchmark,
      difficultyLevel: difficulty,
      // Vary number of items based on difficulty
      numItems: difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6
    }
    
    try {
      const question = generateKnapsackQuestion(i + 1, config)
      questions.push(question)
    } catch (error) {
      console.warn(`Failed to generate benchmark question ${i + 1}, using fallback`)
      // Fallback with relaxed constraints
      const fallbackConfig = { ...config, ensureUniqueSolution: false }
      const question = generateKnapsackQuestion(i + 1, fallbackConfig)
      questions.push(question)
    }
  }
  
  return questions
}

/**
 * Generates questions for the prediction phase
 * Descending difficulty order
 */
export function generatePredictionQuestions(count: number = 8): Question[] {
  const questions: Question[] = []
  
  // Generate hard questions first, then medium, then easy
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['hard', 'hard', 'medium', 'medium', 'easy', 'easy', 'easy', 'easy']
  
  for (let i = 0; i < Math.min(count, difficulties.length); i++) {
    const difficulty = difficulties[i]
    
    const config: GeneratorConfig = {
      ...PHASE_CONFIGS.prediction,
      difficultyLevel: difficulty,
      numItems: difficulty === 'hard' ? 6 : difficulty === 'medium' ? 5 : 4
    }
    
    try {
      const question = generateKnapsackQuestion(i + 1, config)
      questions.push(question)
    } catch (error) {
      console.warn(`Failed to generate prediction question ${i + 1}, using fallback`)
      const fallbackConfig = { ...config, ensureUniqueSolution: false }
      const question = generateKnapsackQuestion(i + 1, fallbackConfig)
      questions.push(question)
    }
  }
  
  return questions
}

/**
 * Generates a single question with specific parameters
 */
export function generateCustomQuestion(
  id: number,
  difficulty: 'easy' | 'medium' | 'hard',
  options: Partial<GeneratorConfig> = {}
): Question {
  const baseConfig = PHASE_CONFIGS.benchmark
  
  const config: GeneratorConfig = {
    ...baseConfig,
    difficultyLevel: difficulty,
    ...options
  }
  
  return generateKnapsackQuestion(id, config)
}

/**
 * Analyzes the difficulty distribution of a question set
 */
export function analyzeQuestionSet(questions: Question[]): {
  easyCount: number
  mediumCount: number
  hardCount: number
  averageDominance: number
  averageSlackRatio: number
  averageOptimalityGap: number
} {
  const counts = { easy: 0, medium: 0, hard: 0 }
  let totalDominance = 0
  let totalSlackRatio = 0
  let totalOptimalityGap = 0
  
  questions.forEach(q => {
    if (q.difficulty === 'easy') counts.easy++
    else if (q.difficulty === 'medium') counts.medium++
    else if (q.difficulty === 'hard') counts.hard++
    
    if (q.metadata) {
      totalDominance += q.metadata.dominanceCount
      totalSlackRatio += q.metadata.slackRatio
      totalOptimalityGap += q.metadata.optimalityGap
    }
  })
  
  const count = questions.length
  
  return {
    easyCount: counts.easy,
    mediumCount: counts.medium,
    hardCount: counts.hard,
    averageDominance: totalDominance / count,
    averageSlackRatio: totalSlackRatio / count,
    averageOptimalityGap: totalOptimalityGap / count
  }
}

/**
 * Shuffles questions while maintaining some structure if needed
 */
export function shuffleQuestions<T>(array: T[], preserveOrder: boolean = false): T[] {
  if (preserveOrder) {
    return [...array]
  }
  
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Validates that a question set meets experiment requirements
 */
export function validateQuestionSet(questions: Question[]): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check for unique IDs
  const ids = questions.map(q => q.id)
  const uniqueIds = new Set(ids)
  if (ids.length !== uniqueIds.size) {
    issues.push('Duplicate question IDs found')
  }
  
  // Check for valid solutions
  questions.forEach((q, index) => {
    if (!q.solution || q.solution.length === 0) {
      issues.push(`Question ${index + 1} has no solution`)
    }
    
    if (q.balls.length === 0) {
      issues.push(`Question ${index + 1} has no items`)
    }
    
    if (q.capacity <= 0) {
      issues.push(`Question ${index + 1} has invalid capacity`)
    }
  })
  
  // Check difficulty distribution
  const analysis = analyzeQuestionSet(questions)
  if (analysis.easyCount === 0 && analysis.mediumCount === 0 && analysis.hardCount === 0) {
    issues.push('No difficulty levels assigned')
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Creates a complete question set for a specific experiment phase
 */
export function createPhaseQuestions(
  phase: 'training' | 'benchmark' | 'prediction',
  count?: number,
  seed?: number
): Question[] {
  // Set random seed for reproducibility if provided
  if (seed !== undefined) {
    Math.random = () => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }
  }
  
  let questions: Question[]
  
  switch (phase) {
    case 'training':
      questions = generateTrainingQuestions(count || 3)
      break
    case 'benchmark':
      questions = generateBenchmarkQuestions(count || 10)
      questions = shuffleQuestions(questions, false) // Semi-random order
      break
    case 'prediction':
      questions = generatePredictionQuestions(count || 8)
      // Keep descending difficulty order
      break
    default:
      throw new Error(`Unknown phase: ${phase}`)
  }
  
  // Validate the generated set
  const validation = validateQuestionSet(questions)
  if (!validation.isValid) {
    console.warn('Generated question set has issues:', validation.issues)
  }
  
  return questions
}

/**
 * Example usage and demonstration
 */
export function demonstrateGenerator(): void {
  console.log('=== Knapsack Question Generator Demo ===\n')
  
  // Generate a simple training question
  console.log('1. Training Question (Easy):')
  const trainingQ = generateCustomQuestion(1, 'easy', { numItems: 3 })
  console.log(`Capacity: ${trainingQ.capacity}`)
  console.log('Items:', trainingQ.balls.map(b => `(w=${b.weight}, r=${b.reward})`).join(', '))
  console.log(`Solution: ${trainingQ.solution}`)
  console.log(`Metadata:`, trainingQ.metadata)
  console.log('')
  
  // Generate a benchmark set
  console.log('2. Benchmark Question Set:')
  const benchmarkSet = generateBenchmarkQuestions(6)
  console.log(`Generated ${benchmarkSet.length} questions`)
  const analysis = analyzeQuestionSet(benchmarkSet)
  console.log('Distribution:', { 
    easy: analysis.easyCount, 
    medium: analysis.mediumCount, 
    hard: analysis.hardCount 
  })
  console.log(`Avg dominance count: ${analysis.averageDominance.toFixed(2)}`)
  console.log(`Avg slack ratio: ${analysis.averageSlackRatio.toFixed(2)}`)
  console.log('')
  
  // Generate prediction questions
  console.log('3. Prediction Questions (Descending Difficulty):')
  const predictionSet = generatePredictionQuestions(6)
  predictionSet.forEach((q, i) => {
    console.log(`Q${i+1}: ${q.difficulty} - ${q.balls.length} items, capacity ${q.capacity}`)
  })
}
