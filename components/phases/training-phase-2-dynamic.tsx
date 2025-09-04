/**
 * Training Phase 2 - Dynamic Question Generation
 * 
 * This is an example integration of the dynamic knapsack question generator
 * into the existing training phase. It replaces the hardcoded questions
 * with dynamically generated ones based on difficulty specifications.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target, 
  TrendingUp,
  Brain,
  Zap
} from "lucide-react"
import KnapsackQuestion from "@/components/knapsack-question"

// Import the dynamic question generator
import { generateTrainingQuestions, analyzeQuestionSet } from "@/lib/question-utils"
import type { Question } from "@/lib/knapsack-generator"

interface TrainingPhase2DynamicProps {
  onNext: () => void
  updateParticipantData: (data: any) => void
}

export default function TrainingPhase2Dynamic({ onNext, updateParticipantData }: TrainingPhase2DynamicProps) {
  // Generate questions dynamically on component mount
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ questionId: number; selected: number[]; correct: boolean; timeSpent: number }>
  >([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [startTime, setStartTime] = useState<number>(0)
  const [totalTimeLeft, setTotalTimeLeft] = useState(15 * 60) // 15 minutes
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [isComplete, setIsComplete] = useState(false)
  const [generationStats, setGenerationStats] = useState<any>(null)
  const hasCompleted = useRef(false)

  // Generate questions on component mount
  useEffect(() => {
    try {
      // Generate 10 training questions with progressive difficulty
      const generatedQuestions = generateTrainingQuestions(10)
      setQuestions(generatedQuestions)
      
      // Analyze the generated question set
      const stats = analyzeQuestionSet(generatedQuestions)
      setGenerationStats(stats)
      
      console.log('Generated training questions:', generatedQuestions)
      console.log('Question set analysis:', stats)
    } catch (error) {
      console.error('Failed to generate questions:', error)
      // Fallback to a simple default question if generation fails
      const fallbackQuestion: Question = {
        id: 1,
        capacity: 10,
        balls: [
          { id: 1, weight: 6, reward: 18, color: "bg-red-500" },
          { id: 2, weight: 4, reward: 12, color: "bg-blue-500" },
          { id: 3, weight: 3, reward: 9, color: "bg-green-500" },
        ],
        solution: [1, 2],
        difficulty: "easy"
      }
      setQuestions([fallbackQuestion])
    }
  }, [])

  // Total timer
  useEffect(() => {
    if (!showInstructions && totalTimeLeft > 0 && !isComplete) {
      const timer = setInterval(() => {
        setTotalTimeLeft((prev) => {
          if (prev <= 1) {
            if (!hasCompleted.current) {
              completePhase()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showInstructions, isComplete])

  const startQuestions = () => {
    setShowInstructions(false)
    setStartTime(Date.now())
    setQuestionStartTime(Date.now())
  }

  const handleAnswer = (selectedBalls: number[], isCorrect: boolean) => {
    const timeSpent = Date.now() - questionStartTime
    const newAnswer = {
      questionId: questions[currentQuestion].id,
      selected: selectedBalls,
      correct: isCorrect,
      timeSpent: Math.round(timeSpent / 1000),
    }

    setAnswers((prev) => [...prev, newAnswer])
    
    setTimeout(() => {
      nextQuestion()
    }, 1000)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setQuestionStartTime(Date.now())
    } else {
      completePhase()
    }
  }

  const skipQuestion = () => {
    const timeSpent = Date.now() - questionStartTime
    const newAnswer = {
      questionId: questions[currentQuestion].id,
      selected: [],
      correct: false,
      timeSpent: Math.round(timeSpent / 1000),
    }
    setAnswers((prev) => [...prev, newAnswer])
    nextQuestion()
  }

  const completePhase = () => {
    if (hasCompleted.current) return
    hasCompleted.current = true
    
    setIsComplete(true)
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    const correctAnswers = answers.filter((a) => a.correct).length
    const score = Math.round((correctAnswers / questions.length) * 100)

    const phaseData = {
      trainingPhase2: {
        score,
        correctAnswers,
        totalQuestions: questions.length,
        totalTime,
        answers,
        generationStats, // Include info about the generated questions
        completedAt: new Date().toISOString(),
      },
    }

    updateParticipantData(phaseData)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Generating dynamic questions...</p>
        </div>
      </div>
    )
  }

  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 shadow-xl">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Training Phase 2: Dynamic Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            This phase uses dynamically generated knapsack problems with controlled difficulty progression
          </p>
        </motion.div>

        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <h2 className="text-2xl font-bold text-purple-900 flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              Dynamic Question Generation
            </h2>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">What's New:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Questions generated based on academic difficulty models
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Dominance relationships control problem complexity
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Progressive difficulty based on your performance
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Unique optimal solutions guaranteed
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Generated Question Set:</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <Badge variant="outline">{questions.length}</Badge>
                  </div>
                  {generationStats && (
                    <>
                      <div className="flex justify-between">
                        <span>Easy Questions:</span>
                        <Badge className="bg-green-100 text-green-800">{generationStats.easyCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Questions:</span>
                        <Badge className="bg-yellow-100 text-yellow-800">{generationStats.mediumCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Hard Questions:</span>
                        <Badge className="bg-red-100 text-red-800">{generationStats.hardCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Dominance:</span>
                        <Badge variant="outline">{generationStats.averageDominance.toFixed(1)}</Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Your Task
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li>• Solve {questions.length} dynamically generated knapsack problems</li>
                <li>• Each question has a unique optimal solution</li>
                <li>• Time limit: 15 minutes total OR 90 seconds per question</li>
                <li>• Questions become progressively more challenging</li>
                <li>• Focus on finding the truly optimal combination</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={startQuestions}
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
              >
                Start Dynamic Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    const correctAnswers = answers.filter((a) => a.correct).length
    const score = Math.round((correctAnswers / questions.length) * 100)
    const avgTime = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-xl">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Training Phase 2 Complete!
          </h1>
          <p className="text-xl text-gray-600">
            You've completed the dynamic question training
          </p>
        </motion.div>

        <Card className="border-2 border-green-200 shadow-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{score}%</div>
                <div className="text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{correctAnswers}/{questions.length}</div>
                <div className="text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{avgTime.toFixed(1)}s</div>
                <div className="text-gray-600">Avg Time per Question</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Performance:</h3>
              <div className="space-y-2">
                {answers.map((answer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${answer.correct ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>Question {answer.questionId}</span>
                      <Badge variant="outline">{questions[index]?.difficulty}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {answer.timeSpent}s
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button 
                onClick={onNext}
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg"
              >
                Continue to Next Phase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const correctSoFar = answers.filter((a) => a.correct).length

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Training Phase 2: Dynamic Questions
        </h1>
        <p className="text-gray-600">
          Question {currentQuestion + 1} of {questions.length} • {question.difficulty} difficulty
        </p>
      </div>

      {/* Progress and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentQuestion + 1}/{questions.length}</div>
            <div className="text-sm text-gray-600">Progress</div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{correctSoFar}/{answers.length}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(totalTimeLeft)}</div>
            <div className="text-sm text-gray-600">Time Left</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge 
              className={`text-sm ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {question.difficulty}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Difficulty</div>
          </CardContent>
        </Card>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`question-${currentQuestion}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <KnapsackQuestion
            question={question}
            onAnswer={handleAnswer}
            onSkip={skipQuestion}
            isInteractive={true}
            isTestMode={true}
            timeLimit={90}
            onTimeUp={() => {
              const timeSpent = Date.now() - questionStartTime
              const newAnswer = {
                questionId: question.id,
                selected: [],
                correct: false,
                timeSpent: Math.round(timeSpent / 1000),
              }
              setAnswers((prev) => [...prev, newAnswer])
              nextQuestion()
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
