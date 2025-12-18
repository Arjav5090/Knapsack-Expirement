/**
 * Script to generate complete question set for a participant
 * Outputs all questions (practice, test 1, test 2, test 3) in JSON format
 */

import { writeFileSync } from 'fs';
import { NUM_BALLS } from '../lib/config';
import staticQuestions from '../lib/static-questions.json';

interface StaticQuestion {
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

interface QuestionSet {
  easy: StaticQuestion[];
  medium: StaticQuestion[];
  hard: StaticQuestion[];
}

/**
 * Load questions for a specific phase and difficulty
 * Filters by NUM_BALLS to ensure all questions have the correct number of balls
 */
function loadQuestionsForPhase(phase: 'training' | 'benchmark' | 'prediction'): QuestionSet {
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
 * Generate all permutations of a pattern with given counts
 * Example: generatePermutations(2, 2, 0) returns ['EEMM', 'EMEM', 'MEME', 'MMEE']
 */
function generatePermutations(easyCount: number, mediumCount: number, hardCount: number): string[] {
  const patterns: string[] = [];
  const total = easyCount + mediumCount + hardCount;
  
  function generate(current: string, eRemaining: number, mRemaining: number, hRemaining: number) {
    if (current.length === total) {
      patterns.push(current);
      return;
    }
    
    if (eRemaining > 0) {
      generate(current + 'E', eRemaining - 1, mRemaining, hRemaining);
    }
    if (mRemaining > 0) {
      generate(current + 'M', eRemaining, mRemaining - 1, hRemaining);
    }
    if (hRemaining > 0) {
      generate(current + 'H', eRemaining, mRemaining, hRemaining - 1);
    }
  }
  
  generate('', easyCount, mediumCount, hardCount);
  return patterns;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Randomize question order using weighted random selection
 * More efficient than generating all permutations - randomly selects difficulty
 * based on remaining counts
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
  const shuffledEasy = shuffle(easyQuestions);
  const shuffledMedium = shuffle(mediumQuestions);
  const shuffledHard = shuffle(hardQuestions);
  
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
 * Get practice questions (hardcoded 6 questions: 2 easy + 2 medium + 2 hard)
 */
function getPracticeQuestions(): StaticQuestion[] {
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
      solution: [1, 4],
      explanation: "Select items 1 and 4 for total weight 8 and reward 27, using the full capacity.",
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
      solution: [2, 3, 4],
      explanation: "Select items 2, 3, and 4 for total weight 10 and reward 40, using the full capacity.",
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
      solution: [1, 2, 3],
      explanation: "Select items 1, 2, and 3 for total weight 12 and reward 48, using the full capacity.",
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
      solution: [1, 3, 4],
      explanation: "Select items 1, 3, and 4 for total weight 15 and reward 60, using the full capacity.",
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
      solution: [1, 2, 3, 4],
      explanation: "Select all items 1, 2, 3, and 4 for total weight 18 and reward 79, using the full capacity.",
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
      solution: [1, 2, 3, 4],
      explanation: "Select all items 1, 2, 3, and 4 for total weight 19 and reward 91, staying within capacity 20.",
      difficulty: "hard"
    }
  ];
  
  // Filter to ensure all have NUM_BALLS
  return practiceQuestions.filter(q => q.balls.length === NUM_BALLS);
}

/**
 * Get questions for Skill Test (Training): grouped by difficulty
 * Returns: all easy questions first, then all medium, then all hard
 */
function getSkillTestQuestions(): StaticQuestion[] {
  const questions = loadQuestionsForPhase('training');
  
  // Shuffle within each difficulty group for variety, but keep groups separate
  const shuffledEasy = shuffle(questions.easy);
  const shuffledMedium = shuffle(questions.medium);
  const shuffledHard = shuffle(questions.hard);
  
  // Return in order: all easy, then all medium, then all hard
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
function getBenchmarkTestQuestions(): StaticQuestion[] {
  const questions = loadQuestionsForPhase('benchmark');
  
  // Shuffle within each difficulty group
  const shuffledEasy = shuffle(questions.easy);
  const shuffledMedium = shuffle(questions.medium);
  const shuffledHard = shuffle(questions.hard);
  
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
function getFinalTestQuestions(): StaticQuestion[] {
  const questions = loadQuestionsForPhase('prediction');
  
  // Shuffle within each difficulty group
  const shuffledEasy = shuffle(questions.easy);
  const shuffledMedium = shuffle(questions.medium);
  const shuffledHard = shuffle(questions.hard);
  
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
 * Generate complete question set for a participant
 */
function generateParticipantQuestionSet(participantId?: string, seed?: number): {
  participantId: string;
  generatedAt: string;
  numBalls: number;
  practice: StaticQuestion[];
  test1: StaticQuestion[];
  test2: StaticQuestion[];
  test3: StaticQuestion[];
  statistics: {
    practice: { easy: number; medium: number; hard: number; total: number };
    test1: { easy: number; medium: number; hard: number; total: number };
    test2: { easy: number; medium: number; hard: number; total: number };
    test3: { easy: number; medium: number; hard: number; total: number };
  };
} {
  // Set seed for reproducibility if provided
  if (seed !== undefined) {
    // Simple seeded random number generator
    let seedValue = seed;
    Math.random = () => {
      seedValue = (seedValue * 1664525 + 1013904223) % Math.pow(2, 32);
      return seedValue / Math.pow(2, 32);
    };
  }

  const pid = participantId || `participant-${Date.now()}`;
  
  // Generate all question sets
  const practiceQuestions = getPracticeQuestions();
  const test1Questions = getSkillTestQuestions();
  const test2Questions = getBenchmarkTestQuestions();
  const test3Questions = getFinalTestQuestions();

  // Calculate statistics
  const countByDifficulty = (questions: StaticQuestion[]) => ({
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
    total: questions.length
  });

  const statistics = {
    practice: countByDifficulty(practiceQuestions),
    test1: countByDifficulty(test1Questions),
    test2: countByDifficulty(test2Questions),
    test3: countByDifficulty(test3Questions)
  };

  return {
    participantId: pid,
    generatedAt: new Date().toISOString(),
    numBalls: NUM_BALLS,
    practice: practiceQuestions,
    test1: test1Questions,
    test2: test2Questions,
    test3: test3Questions,
    statistics
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let participantId: string | undefined;
  let seed: number | undefined;
  let outputPath = './participant-question-set.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--participant-id' || args[i] === '-p') {
      participantId = args[++i];
    } else if (args[i] === '--seed' || args[i] === '-s') {
      seed = parseInt(args[++i], 10);
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: tsx scripts/generate-participant-questions.ts [options]

Options:
  -p, --participant-id <id>  Participant ID (default: auto-generated)
  -s, --seed <number>        Random seed for reproducibility
  -o, --output <path>        Output file path (default: ./participant-question-set.json)
  -h, --help                 Show this help message

Examples:
  tsx scripts/generate-participant-questions.ts
  tsx scripts/generate-participant-questions.ts -p "P001" -s 12345
  tsx scripts/generate-participant-questions.ts -o "./output/p001-questions.json"
      `);
      process.exit(0);
    }
  }

  console.log('🚀 Generating complete question set for participant...\n');
  
  if (participantId) {
    console.log(`📋 Participant ID: ${participantId}`);
  }
  if (seed !== undefined) {
    console.log(`🎲 Seed: ${seed}`);
  }
  console.log(`📊 NUM_BALLS: ${NUM_BALLS}\n`);

  const questionSet = generateParticipantQuestionSet(participantId, seed);

  // Display statistics
  console.log('📈 Question Set Statistics:\n');
  console.log(`Practice: ${questionSet.statistics.practice.total} questions`);
  console.log(`  Easy: ${questionSet.statistics.practice.easy}, Medium: ${questionSet.statistics.practice.medium}, Hard: ${questionSet.statistics.practice.hard}\n`);
  
  console.log(`Test 1 (Skill): ${questionSet.statistics.test1.total} questions`);
  console.log(`  Easy: ${questionSet.statistics.test1.easy}, Medium: ${questionSet.statistics.test1.medium}, Hard: ${questionSet.statistics.test1.hard}\n`);
  
  console.log(`Test 2 (Benchmark): ${questionSet.statistics.test2.total} questions`);
  console.log(`  Easy: ${questionSet.statistics.test2.easy}, Medium: ${questionSet.statistics.test2.medium}, Hard: ${questionSet.statistics.test2.hard}\n`);
  
  console.log(`Test 3 (Prediction): ${questionSet.statistics.test3.total} questions`);
  console.log(`  Easy: ${questionSet.statistics.test3.easy}, Medium: ${questionSet.statistics.test3.medium}, Hard: ${questionSet.statistics.test3.hard}\n`);

  // Show Test 1 ordering (should be grouped)
  console.log('📋 Test 1 Order (should be grouped by difficulty):');
  const test1Order = questionSet.test1.map((q, i) => `${i + 1}. ${q.difficulty?.toUpperCase() || 'UNKNOWN'}`).join(', ');
  console.log(`  ${test1Order}\n`);

  // Show Test 2 ordering sample (should be randomized)
  console.log('📋 Test 2 Order Sample (first 10 questions, should be randomized):');
  const test2Order = questionSet.test2.slice(0, 10).map((q, i) => `${i + 1}. ${q.difficulty?.toUpperCase() || 'UNKNOWN'}`).join(', ');
  console.log(`  ${test2Order}...\n`);

  // Save to JSON file
  writeFileSync(outputPath, JSON.stringify(questionSet, null, 2));
  console.log(`💾 Question set saved to: ${outputPath}`);
  console.log(`✅ Total questions: ${questionSet.statistics.practice.total + questionSet.statistics.test1.total + questionSet.statistics.test2.total + questionSet.statistics.test3.total}\n`);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateParticipantQuestionSet };

