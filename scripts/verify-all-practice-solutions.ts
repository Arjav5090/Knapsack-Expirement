/**
 * Comprehensive verification script for all practice questions across the repository
 * Verifies that all solutions are correct using the knapsack solver
 */

interface Ball {
  id: number;
  weight: number;
  reward: number;
}

interface PracticeQuestion {
  id: number;
  capacity: number;
  balls: Ball[];
  solution: number[];
  explanation: string;
  difficulty: string;
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
 * Verify a practice question
 */
function verifyQuestion(q: PracticeQuestion, source: string): {
  isValid: boolean;
  isOptimal: boolean;
  actualSolution: number[];
  actualReward: number;
  expectedReward: number;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check if solution exists
  if (!q.solution || q.solution.length === 0) {
    errors.push('No solution provided');
    return { isValid: false, isOptimal: false, actualSolution: [], actualReward: 0, expectedReward: 0, errors };
  }
  
  // Calculate actual totals from provided solution
  const solutionItems = q.solution.map(id => q.balls.find(b => b.id === id)!);
  const actualWeight = solutionItems.reduce((sum, b) => sum + b.weight, 0);
  const actualReward = solutionItems.reduce((sum, b) => sum + b.reward, 0);
  
  // Check if solution is valid (weight <= capacity)
  const isValid = actualWeight <= q.capacity;
  if (!isValid) {
    errors.push(`Solution exceeds capacity: weight ${actualWeight} > capacity ${q.capacity}`);
  }
  
  // Calculate optimal solution
  const optimal = solveKnapsack(q.balls, q.capacity);
  const isOptimal = actualReward === optimal.maxReward && isValid;
  
  if (!isOptimal && isValid) {
    errors.push(`Solution is suboptimal: reward ${actualReward} < optimal ${optimal.maxReward}`);
    errors.push(`Optimal solution should be: [${optimal.solution.join(', ')}]`);
  }
  
  return {
    isValid,
    isOptimal,
    actualSolution: q.solution,
    actualReward,
    expectedReward: optimal.maxReward,
    errors
  };
}

// Practice questions from lib/participant-loader.ts
const participantLoaderQuestions: PracticeQuestion[] = [
  {
    id: 1,
    capacity: 8,
    balls: [
      { id: 1, weight: 3, reward: 12 },
      { id: 2, weight: 4, reward: 10 },
      { id: 3, weight: 2, reward: 8 },
      { id: 4, weight: 5, reward: 15 }
    ],
    solution: [1, 4],
    explanation: "Select items 1 and 4 for total weight 8 and reward 27, using the full capacity.",
    difficulty: "easy"
  },
  {
    id: 2,
    capacity: 10,
    balls: [
      { id: 1, weight: 4, reward: 15 },
      { id: 2, weight: 3, reward: 12 },
      { id: 3, weight: 5, reward: 18 },
      { id: 4, weight: 2, reward: 10 }
    ],
    solution: [2, 3, 4],
    explanation: "Select items 2, 3, and 4 for total weight 10 and reward 40, using the full capacity.",
    difficulty: "easy"
  },
  {
    id: 3,
    capacity: 12,
    balls: [
      { id: 1, weight: 4, reward: 16 },
      { id: 2, weight: 3, reward: 12 },
      { id: 3, weight: 5, reward: 20 },
      { id: 4, weight: 2, reward: 8 }
    ],
    solution: [1, 2, 3],
    explanation: "Select items 1, 2, and 3 for total weight 12 and reward 48, using the full capacity.",
    difficulty: "medium"
  },
  {
    id: 4,
    capacity: 15,
    balls: [
      { id: 1, weight: 5, reward: 20 },
      { id: 2, weight: 3, reward: 15 },
      { id: 3, weight: 4, reward: 18 },
      { id: 4, weight: 6, reward: 22 }
    ],
    solution: [1, 3, 4],
    explanation: "Select items 1, 3, and 4 for total weight 15 and reward 60, using the full capacity.",
    difficulty: "medium"
  },
  {
    id: 5,
    capacity: 18,
    balls: [
      { id: 1, weight: 6, reward: 24 },
      { id: 2, weight: 4, reward: 18 },
      { id: 3, weight: 5, reward: 22 },
      { id: 4, weight: 3, reward: 15 }
    ],
    solution: [1, 2, 3, 4],
    explanation: "Select all items 1, 2, 3, and 4 for total weight 18 and reward 79, using the full capacity.",
    difficulty: "hard"
  },
  {
    id: 6,
    capacity: 20,
    balls: [
      { id: 1, weight: 7, reward: 28 },
      { id: 2, weight: 4, reward: 20 },
      { id: 3, weight: 5, reward: 25 },
      { id: 4, weight: 3, reward: 18 }
    ],
    solution: [1, 2, 3, 4],
    explanation: "Select all items 1, 2, 3, and 4 for total weight 19 and reward 91, staying within capacity 20.",
    difficulty: "hard"
  }
];

// Practice questions from scripts/generate-participant-questions.ts (should match above)
const scriptQuestions: PracticeQuestion[] = [
  {
    id: 1,
    capacity: 8,
    balls: [
      { id: 1, weight: 3, reward: 12 },
      { id: 2, weight: 4, reward: 10 },
      { id: 3, weight: 2, reward: 8 },
      { id: 4, weight: 5, reward: 15 }
    ],
    solution: [1, 4],
    explanation: "Select items 1 and 4 for total weight 8 and reward 27, using the full capacity.",
    difficulty: "easy"
  },
  {
    id: 2,
    capacity: 10,
    balls: [
      { id: 1, weight: 4, reward: 15 },
      { id: 2, weight: 3, reward: 12 },
      { id: 3, weight: 5, reward: 18 },
      { id: 4, weight: 2, reward: 10 }
    ],
    solution: [2, 3, 4],
    explanation: "Select items 2, 3, and 4 for total weight 10 and reward 40, using the full capacity.",
    difficulty: "easy"
  },
  {
    id: 3,
    capacity: 12,
    balls: [
      { id: 1, weight: 4, reward: 16 },
      { id: 2, weight: 3, reward: 12 },
      { id: 3, weight: 5, reward: 20 },
      { id: 4, weight: 2, reward: 8 }
    ],
    solution: [1, 2, 3],
    explanation: "Select items 1, 2, and 3 for total weight 12 and reward 48, using the full capacity.",
    difficulty: "medium"
  },
  {
    id: 4,
    capacity: 15,
    balls: [
      { id: 1, weight: 5, reward: 20 },
      { id: 2, weight: 3, reward: 15 },
      { id: 3, weight: 4, reward: 18 },
      { id: 4, weight: 6, reward: 22 }
    ],
    solution: [1, 3, 4],
    explanation: "Select items 1, 3, and 4 for total weight 15 and reward 60, using the full capacity.",
    difficulty: "medium"
  },
  {
    id: 5,
    capacity: 18,
    balls: [
      { id: 1, weight: 6, reward: 24 },
      { id: 2, weight: 4, reward: 18 },
      { id: 3, weight: 5, reward: 22 },
      { id: 4, weight: 3, reward: 15 }
    ],
    solution: [1, 2, 3, 4],
    explanation: "Select all items 1, 2, 3, and 4 for total weight 18 and reward 79, using the full capacity.",
    difficulty: "hard"
  },
  {
    id: 6,
    capacity: 20,
    balls: [
      { id: 1, weight: 7, reward: 28 },
      { id: 2, weight: 4, reward: 20 },
      { id: 3, weight: 5, reward: 25 },
      { id: 4, weight: 3, reward: 18 }
    ],
    solution: [1, 2, 3, 4],
    explanation: "Select all items 1, 2, 3, and 4 for total weight 19 and reward 91, staying within capacity 20.",
    difficulty: "hard"
  }
];

console.log('🔍 Verifying all practice questions across the repository...\n');
console.log('=' .repeat(80));

let allValid = true;
let totalChecked = 0;

// Verify lib/participant-loader.ts
console.log('\n📁 lib/participant-loader.ts');
console.log('-'.repeat(80));
participantLoaderQuestions.forEach((q) => {
  totalChecked++;
  const result = verifyQuestion(q, 'lib/participant-loader.ts');
  const status = result.isValid && result.isOptimal ? '✅' : '❌';
  console.log(`${status} Q${q.id}: Solution [${result.actualSolution.join(', ')}] → Reward: ${result.actualReward} (Optimal: ${result.expectedReward})`);
  
  if (result.errors.length > 0) {
    allValid = false;
    result.errors.forEach(err => console.log(`   ⚠️  ${err}`));
  }
});

// Verify scripts/generate-participant-questions.ts
console.log('\n📁 scripts/generate-participant-questions.ts');
console.log('-'.repeat(80));
scriptQuestions.forEach((q) => {
  totalChecked++;
  const result = verifyQuestion(q, 'scripts/generate-participant-questions.ts');
  const status = result.isValid && result.isOptimal ? '✅' : '❌';
  console.log(`${status} Q${q.id}: Solution [${result.actualSolution.join(', ')}] → Reward: ${result.actualReward} (Optimal: ${result.expectedReward})`);
  
  if (result.errors.length > 0) {
    allValid = false;
    result.errors.forEach(err => console.log(`   ⚠️  ${err}`));
  }
});

// Check consistency between files
console.log('\n📊 Consistency Check');
console.log('-'.repeat(80));
let consistent = true;
for (let i = 0; i < participantLoaderQuestions.length; i++) {
  const q1 = participantLoaderQuestions[i];
  const q2 = scriptQuestions[i];
  
  const sol1 = q1.solution.sort().join(',');
  const sol2 = q2.solution.sort().join(',');
  
  if (sol1 !== sol2) {
    console.log(`❌ Q${q1.id}: Solutions differ between files`);
    console.log(`   lib/participant-loader.ts: [${q1.solution.join(', ')}]`);
    console.log(`   scripts/generate-participant-questions.ts: [${q2.solution.join(', ')}]`);
    consistent = false;
  }
}

if (consistent) {
  console.log('✅ All solutions are consistent across files');
}

console.log('\n' + '='.repeat(80));
console.log(`\n📈 Summary:`);
console.log(`   Total questions checked: ${totalChecked}`);
console.log(`   All valid and optimal: ${allValid ? '✅ YES' : '❌ NO'}`);
console.log(`   Files consistent: ${consistent ? '✅ YES' : '❌ NO'}`);

if (allValid && consistent) {
  console.log('\n🎉 All practice questions are correct and consistent!');
} else {
  console.log('\n⚠️  Some issues found. Please review the errors above.');
}
