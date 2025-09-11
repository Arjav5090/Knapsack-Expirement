"use strict";
/**
 * Backend question generation utilities
 * Provides server-side question generation with seeding for reproducibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHASE_CONFIGS = void 0;
exports.solveKnapsack = solveKnapsack;
exports.itemDominates = itemDominates;
exports.removeDominatedItems = removeDominatedItems;
exports.analyzeDifficulty = analyzeDifficulty;
exports.createDominancePattern = createDominancePattern;
exports.adjustCapacityForSlackRatio = adjustCapacityForSlackRatio;
exports.hasUniqueSolution = hasUniqueSolution;
exports.generateKnapsackQuestion = generateKnapsackQuestion;
exports.generatePhaseQuestions = generatePhaseQuestions;
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
    seed;
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        // Better seeded random using linear congruential generator
        this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
        return this.seed / Math.pow(2, 32);
    }
    range(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    choice(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}
/**
 * Solves 0-1 knapsack problem using dynamic programming
 */
function solveKnapsack(items, capacity) {
    const n = items.length;
    const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
    // Fill DP table
    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= capacity; w++) {
            const item = items[i - 1];
            if (item.weight <= w) {
                dp[i][w] = Math.max(dp[i - 1][w], // Don't take item
                dp[i - 1][w - item.weight] + item.reward // Take item
                );
            }
            else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    // Backtrack to find solution
    const solution = [];
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
function itemDominates(item1, item2) {
    return (item1.weight <= item2.weight && item1.reward >= item2.reward) &&
        (item1.weight < item2.weight || item1.reward > item2.reward);
}
/**
 * Removes dominated items from the item set
 */
function removeDominatedItems(items) {
    const filtered = [];
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
function analyzeDifficulty(items, capacity, solution) {
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
        const combination = [];
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
        if (totalWeight > capacity)
            continue;
        if (combination.length === optimalSet.size &&
            combination.every(id => optimalSet.has(id)))
            continue;
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
function createDominancePattern(config, dominanceType, rng) {
    const items = [];
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
                let weight;
                let reward;
                if (i < Math.floor(config.numItems / 2)) {
                    // First half with clear dominance
                    weight = config.minWeight + i * 2;
                    reward = config.maxReward - i * 2;
                }
                else {
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
function adjustCapacityForSlackRatio(items, targetSlackRatio) {
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
function hasUniqueSolution(items, capacity) {
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
function generateKnapsackQuestion(id, config, seed) {
    const rng = new SeededRandom(seed + id); // Unique seed per question
    const maxAttempts = 50; // Reduced for server performance
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        // Determine dominance pattern based on difficulty
        let dominanceType;
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
exports.PHASE_CONFIGS = {
    training: {
        numItems: 3,
        minWeight: 2,
        maxWeight: 10,
        minReward: 8,
        maxReward: 30,
        ensureUniqueSolution: false // Allow multiple solutions for more variety
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
};
/**
 * Generates questions for different phases with seeded randomness
 */
function generatePhaseQuestions(phase, count, seed) {
    const difficulties = ['easy', 'medium', 'hard'];
    const questions = [];
    let baseConfig;
    let difficultyPattern;
    switch (phase) {
        case 'training':
            baseConfig = exports.PHASE_CONFIGS.training;
            // Vary between easy and some medium for practice variety
            difficultyPattern = [];
            for (let i = 0; i < count; i++) {
                // 70% easy, 30% medium for practice
                difficultyPattern.push(i < Math.ceil(count * 0.7) ? 'easy' : 'medium');
            }
            break;
        case 'benchmark':
            baseConfig = exports.PHASE_CONFIGS.benchmark;
            // Mixed difficulty for benchmark
            difficultyPattern = [];
            for (let i = 0; i < count; i++) {
                difficultyPattern.push(difficulties[i % difficulties.length]);
            }
            break;
        case 'prediction':
            baseConfig = exports.PHASE_CONFIGS.prediction;
            // Descending difficulty for prediction
            const hardCount = Math.ceil(count * 0.4);
            const mediumCount = Math.ceil(count * 0.3);
            const easyCount = count - hardCount - mediumCount;
            difficultyPattern = [
                ...Array(hardCount).fill('hard'),
                ...Array(mediumCount).fill('medium'),
                ...Array(easyCount).fill('easy')
            ];
            break;
    }
    for (let i = 0; i < count; i++) {
        const difficulty = difficultyPattern[i];
        const config = {
            ...baseConfig,
            difficultyLevel: difficulty,
            numItems: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5
        };
        // Use a unique seed for each question to ensure variety
        const questionSeed = seed + (i * 1000) + Math.floor(seed / 1000);
        try {
            const question = generateKnapsackQuestion(i + 1, config, questionSeed);
            questions.push(question);
        }
        catch (error) {
            console.warn(`Failed to generate question ${i + 1}, using fallback`);
            // Fallback with simpler config and different seed
            const simpleConfig = { ...config, ensureUniqueSolution: false };
            const fallbackSeed = questionSeed + 500;
            const question = generateKnapsackQuestion(i + 1, simpleConfig, fallbackSeed);
            questions.push(question);
        }
    }
    // Calculate analysis stats
    const counts = { easy: 0, medium: 0, hard: 0 };
    let totalDominance = 0;
    let totalSlackRatio = 0;
    let totalOptimalityGap = 0;
    questions.forEach(q => {
        if (q.difficulty === 'easy')
            counts.easy++;
        else if (q.difficulty === 'medium')
            counts.medium++;
        else if (q.difficulty === 'hard')
            counts.hard++;
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
        config: { ...baseConfig, difficultyLevel: 'mixed' },
        analysisStats
    };
}
