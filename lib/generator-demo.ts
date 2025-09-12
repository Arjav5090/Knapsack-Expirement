/**
 * Demonstration and testing of the knapsack question generator
 * Run this to see examples of generated questions and their properties
 */

import { 
  generateKnapsackQuestion, 
  generateQuestionSet,
  analyzeDifficulty,
  itemDominates,
  removeDominatedItems,
  solveKnapsack,
  type GeneratorConfig 
} from './knapsack-generator'

import {
  generateTrainingQuestions,
  generateBenchmarkQuestions,
  generatePredictionQuestions,
  analyzeQuestionSet,
  validateQuestionSet,
  demonstrateGenerator
} from './question-utils'

/**
 * Test the basic generator functionality
 */
function testBasicGeneration() {
  console.log('=== Testing Basic Generation ===\n')
  
  // Test easy question generation
  const easyConfig: GeneratorConfig = {
    numItems: 3,
    minWeight: 3,
    maxWeight: 8,
    minReward: 9,
    maxReward: 24,
    difficultyLevel: 'easy',
    ensureUniqueSolution: true
  }
  
  const easyQuestion = generateKnapsackQuestion(1, easyConfig)
  
  console.log('Easy Question Generated:')
  console.log(`ID: ${easyQuestion.id}`)
  console.log(`Capacity: ${easyQuestion.capacity}`)
  console.log('Items:')
  easyQuestion.balls.forEach(ball => {
    console.log(`  Ball ${ball.id}: weight=${ball.weight}, reward=${ball.reward}, density=${(ball.reward/ball.weight).toFixed(2)}`)
  })
  console.log(`Solution: [${easyQuestion.solution?.join(', ')}]`)
  console.log(`Difficulty: ${easyQuestion.difficulty}`)
  console.log('Metadata:', easyQuestion.metadata)
  console.log(`Explanation: ${easyQuestion.explanation}`)
  console.log('')
  
  // Verify solution
  if (easyQuestion.solution) {
    const verification = solveKnapsack(easyQuestion.balls, easyQuestion.capacity)
    console.log('Solution Verification:')
    console.log(`Generated solution: [${easyQuestion.solution.join(', ')}]`)
    console.log(`Optimal solution: [${verification.solution.join(', ')}]`)
    console.log(`Solutions match: ${JSON.stringify(easyQuestion.solution.sort()) === JSON.stringify(verification.solution.sort())}`)
    console.log('')
  }
}

/**
 * Test dominance analysis
 */
function testDominanceAnalysis() {
  console.log('=== Testing Dominance Analysis ===\n')
  
  // Create items with known dominance relationships
  const testItems = [
    { id: 1, weight: 3, reward: 15, color: 'bg-red-500' },    // Dominates 2 and 3
    { id: 2, weight: 5, reward: 10, color: 'bg-blue-500' },   // Dominates 3
    { id: 3, weight: 7, reward: 8, color: 'bg-green-500' },   // Dominated by 1 and 2
    { id: 4, weight: 4, reward: 9, color: 'bg-yellow-500' }   // Independent
  ]
  
  console.log('Test Items:')
  testItems.forEach(item => {
    const density = (item.reward / item.weight).toFixed(2)
    console.log(`  Item ${item.id}: w=${item.weight}, r=${item.reward}, density=${density}`)
  })
  console.log('')
  
  // Test dominance relationships
  console.log('Dominance Relationships:')
  for (let i = 0; i < testItems.length; i++) {
    for (let j = 0; j < testItems.length; j++) {
      if (i !== j) {
        const dominates = itemDominates(testItems[i], testItems[j])
        if (dominates) {
          console.log(`  Item ${testItems[i].id} dominates Item ${testItems[j].id}`)
        }
      }
    }
  }
  console.log('')
  
  // Test dominated item removal
  const { filtered, removedCount } = removeDominatedItems(testItems)
  console.log(`Removed ${removedCount} dominated items`)
  console.log('Remaining items:', filtered.map(item => item.id))
  console.log('')
  
  // Test difficulty analysis
  const capacity = 10
  const solution = solveKnapsack(testItems, capacity)
  const difficulty = analyzeDifficulty(testItems, capacity, solution.solution)
  
  console.log(`Capacity: ${capacity}`)
  console.log(`Optimal solution: [${solution.solution.join(', ')}] with reward ${solution.maxReward}`)
  console.log('Difficulty Analysis:')
  console.log(`  Dominance count: ${difficulty.dominanceCount}`)
  console.log(`  Slack ratio: ${difficulty.slackRatio.toFixed(2)}`)
  console.log(`  Optimality gap: ${difficulty.optimalityGap}`)
  console.log(`  Density variance: ${difficulty.densityVariance.toFixed(2)}`)
  console.log('')
}

/**
 * Test question set generation for different phases
 */
function testPhaseGeneration() {
  console.log('=== Testing Phase Question Generation ===\n')
  
  // Test training questions
  console.log('Training Questions:')
  const trainingQuestions = generateTrainingQuestions(3)
  trainingQuestions.forEach((q, i) => {
    console.log(`  Q${i+1}: ${q.difficulty}, ${q.balls.length} items, capacity ${q.capacity}, solution [${q.solution?.join(', ')}]`)
  })
  console.log('')
  
  // Test benchmark questions
  console.log('Benchmark Questions:')
  const benchmarkQuestions = generateBenchmarkQuestions(6)
  benchmarkQuestions.forEach((q, i) => {
    console.log(`  Q${i+1}: ${q.difficulty}, ${q.balls.length} items, capacity ${q.capacity}, dominance ${q.metadata?.dominanceCount}`)
  })
  
  const benchmarkAnalysis = analyzeQuestionSet(benchmarkQuestions)
  console.log('Benchmark Analysis:')
  console.log(`  Easy: ${benchmarkAnalysis.easyCount}, Medium: ${benchmarkAnalysis.mediumCount}, Hard: ${benchmarkAnalysis.hardCount}`)
  console.log(`  Avg dominance: ${benchmarkAnalysis.averageDominance.toFixed(2)}`)
  console.log(`  Avg slack ratio: ${benchmarkAnalysis.averageSlackRatio.toFixed(2)}`)
  console.log('')
  
  // Test prediction questions
  console.log('Prediction Questions (Descending Difficulty):')
  const predictionQuestions = generatePredictionQuestions(6)
  predictionQuestions.forEach((q, i) => {
    console.log(`  Q${i+1}: ${q.difficulty}, ${q.balls.length} items, capacity ${q.capacity}`)
  })
  console.log('')
  
  // Validate all question sets
  console.log('Validation Results:')
  const trainingValidation = validateQuestionSet(trainingQuestions)
  const benchmarkValidation = validateQuestionSet(benchmarkQuestions)
  const predictionValidation = validateQuestionSet(predictionQuestions)
  
  console.log(`  Training: ${trainingValidation.isValid ? 'Valid' : 'Invalid'} ${trainingValidation.issues.join(', ')}`)
  console.log(`  Benchmark: ${benchmarkValidation.isValid ? 'Valid' : 'Invalid'} ${benchmarkValidation.issues.join(', ')}`)
  console.log(`  Prediction: ${predictionValidation.isValid ? 'Valid' : 'Invalid'} ${predictionValidation.issues.join(', ')}`)
  console.log('')
}

/**
 * Test edge cases and robustness
 */
function testEdgeCases() {
  console.log('=== Testing Edge Cases ===\n')
  
  // Test with minimal items
  console.log('Minimal Configuration:')
  try {
    const minimalConfig: GeneratorConfig = {
      numItems: 2,
      minWeight: 1,
      maxWeight: 3,
      minReward: 2,
      maxReward: 6,
      difficultyLevel: 'easy',
      ensureUniqueSolution: false
    }
    
    const minimalQuestion = generateKnapsackQuestion(1, minimalConfig)
    console.log(`  Generated question with ${minimalQuestion.balls.length} items`)
    console.log(`  Solution: [${minimalQuestion.solution?.join(', ')}]`)
  } catch (error) {
    console.log(`  Error: ${error}`)
  }
  console.log('')
  
  // Test with many items
  console.log('Large Configuration:')
  try {
    const largeConfig: GeneratorConfig = {
      numItems: 8,
      minWeight: 5,
      maxWeight: 20,
      minReward: 10,
      maxReward: 60,
      difficultyLevel: 'hard',
      ensureUniqueSolution: false
    }
    
    const largeQuestion = generateKnapsackQuestion(1, largeConfig)
    console.log(`  Generated question with ${largeQuestion.balls.length} items`)
    console.log(`  Capacity: ${largeQuestion.capacity}`)
    console.log(`  Solution size: ${largeQuestion.solution?.length}`)
    console.log(`  Dominance count: ${largeQuestion.metadata?.dominanceCount}`)
  } catch (error) {
    console.log(`  Error: ${error}`)
  }
  console.log('')
}

/**
 * Main demonstration function
 */
export function runFullDemo() {
  console.log('🎒 KNAPSACK QUESTION GENERATOR COMPREHENSIVE DEMO 🎒\n')
  console.log('=' * 60)
  console.log('')
  
  testBasicGeneration()
  testDominanceAnalysis()
  testPhaseGeneration()
  testEdgeCases()
  
  console.log('=== Demo Complete ===')
  console.log('The generator is ready for integration into your experiment phases!')
  console.log('')
  
  // Run the utility demo as well
  demonstrateGenerator()
}

// Export for use in other files or console testing
export {
  testBasicGeneration,
  testDominanceAnalysis,
  testPhaseGeneration,
  testEdgeCases
}
