# Knapsack Question Generator

A comprehensive dynamic question generator for the 0-1 knapsack problem, designed for behavioral experiments measuring strategy skills. The generator creates questions with controlled difficulty based on dominance relationships and other algorithmic complexity factors.

## 🎯 Overview

This generator implements the academic specifications for creating knapsack problems with varying difficulty levels. The primary difficulty factor is **dominance relationships** between items, while controlling for other factors like density variance, slack ratio, and optimality gap.

## 📁 Files

- **`knapsack-generator.ts`** - Core generator with algorithms and difficulty analysis
- **`question-utils.ts`** - Utility functions for different experiment phases
- **`generator-demo.ts`** - Demonstration and testing functions
- **`training-phase-2-dynamic.tsx`** - Example integration into existing phase

## 🚀 Quick Start

### Basic Usage

```typescript
import { generateKnapsackQuestion, type GeneratorConfig } from '@/lib/knapsack-generator'

// Generate a single question
const config: GeneratorConfig = {
  numItems: 4,
  minWeight: 3,
  maxWeight: 10,
  minReward: 9,
  maxReward: 30,
  difficultyLevel: 'medium',
  ensureUniqueSolution: true
}

const question = generateKnapsackQuestion(1, config)
```

### Phase-Specific Generation

```typescript
import { 
  generateTrainingQuestions,
  generateBenchmarkQuestions,
  generatePredictionQuestions 
} from '@/lib/question-utils'

// Generate training questions (easy difficulty)
const trainingQs = generateTrainingQuestions(3)

// Generate benchmark questions (mixed difficulty)
const benchmarkQs = generateBenchmarkQuestions(10)

// Generate prediction questions (descending difficulty)
const predictionQs = generatePredictionQuestions(8)
```

## 🧮 Core Algorithm

### Knapsack Solver

The generator uses dynamic programming to solve the 0-1 knapsack problem optimally:

```typescript
function solveKnapsack(items: Ball[], capacity: number): {
  solution: number[]
  maxReward: number
  solutionWeight: number
}
```

### Dominance Analysis

Item dominance is the primary difficulty factor:

```typescript
// Item i dominates j if w_i ≤ w_j and r_i ≥ r_j (with strict inequality)
function itemDominates(item1: Ball, item2: Ball): boolean
```

## 📊 Difficulty Metrics

The generator analyzes multiple complexity factors:

### 1. Dominance Count
Number of dominated items that can be removed to simplify the problem.
- **Higher count** = Easier problem (more obvious inferior choices)
- **Lower count** = Harder problem (more meaningful trade-offs)

### 2. Slack Ratio (σ)
Ratio of capacity to total weight: `σ = C / Σw_k`
- **Close to 1** = Tight constraint (most items should be included)
- **Much > 1** = Loose constraint (selective inclusion needed)

### 3. Optimality Gap (Δ)
Difference between optimal and second-best solutions: `Δ = R(S*) - R(S^(2))`
- **Higher gap** = Easier (clear optimal choice)
- **Lower gap** = Harder (close alternatives)

### 4. Density Variance
Variance in reward-to-weight ratios across items.
- **High variance** = Easier (clear winner by density)
- **Low variance** = Harder (similar efficiency items)

## 🎚️ Difficulty Levels

### Easy Questions
- **Full dominance patterns**: Clear chains where item₁ > item₂ > item₃
- **High dominance count**: Many obviously inferior items
- **Clear optimal solutions**: Large optimality gaps

### Medium Questions  
- **Partial dominance**: Some clear relationships, some ambiguous
- **Mixed patterns**: Balance of obvious and strategic choices
- **Moderate complexity**: Requires some analysis

### Hard Questions
- **No clear dominance**: Items require careful trade-off analysis
- **Low dominance count**: Most items are potentially useful
- **Small optimality gaps**: Multiple competitive solutions

## 🔧 Configuration Options

### GeneratorConfig Interface

```typescript
interface GeneratorConfig {
  numItems: number              // Number of items in the knapsack
  minWeight: number            // Minimum item weight
  maxWeight: number            // Maximum item weight  
  minReward: number            // Minimum item reward
  maxReward: number            // Maximum item reward
  targetSlackRatio?: number    // Target capacity ratio (optional)
  difficultyLevel: 'easy' | 'medium' | 'hard'
  ensureUniqueSolution?: boolean // Guarantee single optimal solution
}
```

### Pre-defined Phase Configs

```typescript
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
}
```

## 📝 Question Format

Generated questions follow the existing component interface:

```typescript
interface Question {
  id: number
  capacity: number
  balls: Ball[]                // Items with weight, reward, color
  solution?: number[]          // Optimal item IDs
  explanation?: string         // Solution explanation
  difficulty?: string          // Difficulty level
  metadata?: {                 // Algorithmic analysis
    dominanceCount: number
    slackRatio: number
    optimalityGap: number
    densityVariance: number
  }
}
```

## 🎮 Integration Examples

### Replace Hardcoded Questions

```typescript
// Before: Hardcoded array
const skillsQuestions = [
  { id: 1, capacity: 10, balls: [...], solution: [1, 2] },
  // ...
]

// After: Dynamic generation
const [questions, setQuestions] = useState<Question[]>([])

useEffect(() => {
  const generatedQuestions = generateTrainingQuestions(10)
  setQuestions(generatedQuestions)
}, [])
```

### Add Question Analysis

```typescript
import { analyzeQuestionSet, validateQuestionSet } from '@/lib/question-utils'

const questions = generateBenchmarkQuestions(10)
const analysis = analyzeQuestionSet(questions)
const validation = validateQuestionSet(questions)

console.log('Difficulty distribution:', {
  easy: analysis.easyCount,
  medium: analysis.mediumCount, 
  hard: analysis.hardCount
})

console.log('Average dominance:', analysis.averageDominance)
console.log('Valid question set:', validation.isValid)
```

## 🧪 Testing and Validation

### Run Demonstrations

```typescript
import { runFullDemo } from '@/lib/generator-demo'

// Comprehensive demonstration of all features
runFullDemo()
```

### Individual Tests

```typescript
import { 
  testBasicGeneration,
  testDominanceAnalysis,
  testPhaseGeneration,
  testEdgeCases 
} from '@/lib/generator-demo'

testBasicGeneration()     // Test single question generation
testDominanceAnalysis()   // Test dominance algorithms
testPhaseGeneration()     // Test phase-specific generators  
testEdgeCases()          // Test robustness
```

## 🎯 Academic Specifications Compliance

### ✅ Implemented Features

- **0-1 Knapsack Problem**: Classic formulation with binary item selection
- **Dominance-Based Difficulty**: Primary difficulty factor as specified
- **Unique Optimal Solutions**: Configurable to ensure single correct answer
- **All-or-Nothing Scoring**: Only optimal selection gets points
- **Controlled Heterogeneity**: Focus on dominance while controlling other factors
- **Progressive Difficulty**: Support for easy → medium → hard progression

### ✅ Algorithmic Factors

- **Dominance Analysis**: Item i dominates j if w_i ≤ w_j and r_i ≥ r_j
- **Density Calculation**: reward/weight ratio for greedy heuristic analysis
- **Slack Ratio**: Capacity vs total weight ratio
- **Optimality Gap**: Difference between best and second-best solutions

### ✅ Difficulty Control

- **Easy**: Full dominance chains, high dominance count
- **Medium**: Partial dominance patterns, mixed complexity
- **Hard**: Minimal dominance, requires careful trade-off analysis

## 🚀 Usage in Experiment Phases

### Training Phase
```typescript
const trainingQuestions = generateTrainingQuestions(3)
// → 3 easy questions with clear dominance patterns
```

### Benchmark Phase  
```typescript
const benchmarkQuestions = generateBenchmarkQuestions(10)
// → Mixed difficulty, semi-random order for strategy assessment
```

### Prediction Phase
```typescript  
const predictionQuestions = generatePredictionQuestions(8)
// → Descending difficulty for performance prediction
```

## 🔧 Customization

### Custom Difficulty Patterns

```typescript
// Create questions with specific dominance patterns
const customConfig: GeneratorConfig = {
  numItems: 5,
  minWeight: 5,
  maxWeight: 15,
  minReward: 10,
  maxReward: 45,
  difficultyLevel: 'hard',
  targetSlackRatio: 0.8,        // Specific capacity constraint
  ensureUniqueSolution: true
}

const question = generateKnapsackQuestion(1, customConfig)
```

### Batch Generation with Analysis

```typescript
const questions = generateQuestionSet(20, { difficultyLevel: 'medium' })
const analysis = analyzeQuestionSet(questions)

// Filter by specific criteria
const highDominanceQuestions = questions.filter(q => 
  q.metadata && q.metadata.dominanceCount >= 2
)
```

## 📋 Best Practices

1. **Always validate question sets** before using in experiments
2. **Use appropriate phase configs** for different experiment stages  
3. **Monitor generation statistics** to ensure desired difficulty distribution
4. **Test edge cases** with minimal/maximal configurations
5. **Provide fallbacks** for generation failures in production code

## 🐛 Troubleshooting

### Generation Failures
- **Too restrictive configs**: Relax `ensureUniqueSolution` or adjust ranges
- **Invalid item ranges**: Ensure minWeight < maxWeight, minReward < maxReward
- **Capacity issues**: Check targetSlackRatio compatibility with item ranges

### Performance Issues  
- **Large item counts**: Consider reducing `numItems` for real-time generation
- **Complex validation**: Use `ensureUniqueSolution: false` for faster generation
- **Batch generation**: Generate questions in advance rather than on-demand

## 🔮 Future Enhancements

- **Adaptive difficulty**: Adjust based on participant performance
- **Custom dominance patterns**: More sophisticated relationship configurations
- **Constraint satisfaction**: Generate questions meeting specific metric targets
- **Visualization tools**: Charts for difficulty analysis and question exploration
- **A/B testing support**: Generate matched question sets for comparison studies

---

This generator provides a robust foundation for dynamic knapsack question generation with academic rigor and experimental control. The dominance-based difficulty system ensures meaningful skill assessment while maintaining the theoretical foundations of the 0-1 knapsack problem.
