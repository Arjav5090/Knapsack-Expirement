"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Target, TrendingDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import KnapsackQuestion from "@/components/knapsack-question"

interface PredictionPhaseProps {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

// Generate 30 questions in descending difficulty order (Hard → Medium → Easy)
const generatePredictionQuestions = () => {
  const hardQuestions = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    capacity: 35 + i * 2,
    balls: [
      { id: 1, weight: 20 + i, reward: 60 + i * 3, color: "bg-red-500" },
      { id: 2, weight: 18 + i, reward: 54 + i * 3, color: "bg-blue-500" },
      { id: 3, weight: 15 + i, reward: 45 + i * 3, color: "bg-green-500" },
      { id: 4, weight: 12 + i, reward: 36 + i * 3, color: "bg-yellow-500" },
      { id: 5, weight: 10 + i, reward: 30 + i * 3, color: "bg-purple-500" },
      { id: 6, weight: 8 + i, reward: 24 + i * 3, color: "bg-pink-500" },
    ],
    solution: [1, 3],
    difficulty: "hard",
  }))

  const mediumQuestions = Array.from({ length: 10 }, (_, i) => ({
    id: i + 11,
    capacity: 20 + i,
    balls: [
      { id: 1, weight: 10 + i, reward: 30 + i * 2, color: "bg-orange-500" },
      { id: 2, weight: 8 + i, reward: 24 + i * 2, color: "bg-teal-500" },
      { id: 3, weight: 6 + i, reward: 18 + i * 2, color: "bg-rose-500" },
      { id: 4, weight: 5 + i, reward: 15 + i * 2, color: "bg-cyan-500" },
      { id: 5, weight: 4 + i, reward: 12 + i * 2, color: "bg-lime-500" },
    ],
    solution: [1, 2],
    difficulty: "medium",
  }))

  const easyQuestions = Array.from({ length: 10 }, (_, i) => ({
    id: i + 21,
    capacity: 12 + i,
    balls: [
      { id: 1, weight: 6 + i, reward: 18 + i, color: "bg-indigo-500" },
      { id: 2, weight: 4 + i, reward: 12 + i, color: "bg-pink-500" },
      { id: 3, weight: 3 + i, reward: 9 + i, color: "bg-orange-500" },
    ],
    solution: [1, 2],
    difficulty: "easy",
  }))

  return [...hardQuestions, ...mediumQuestions, ...easyQuestions]
}

export default function PredictionPhase({ onNext, updateParticipantData }: PredictionPhaseProps) {
  const [questions] = useState(generatePredictionQuestions())
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ questionId: number; selected: number[]; correct: boolean; timeSpent: number }>
  >([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [isComplete, setIsComplete] = useState(false)

  // Timer
  useEffect(() => {
    if (!showInstructions && timeLeft > 0 && !isComplete) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showInstructions, timeLeft, isComplete])

  const handleAnswer = (selectedBalls: number[], isCorrect: boolean) => {
    const timeSpent = Date.now() - questionStartTime
    const newAnswer = {
      questionId: questions[currentQuestion].id,
      selected: selectedBalls,
      correct: isCorrect,
      timeSpent: Math.round(timeSpent / 1000),
    }

    setAnswers((prev) => [...prev, newAnswer])
    nextQuestion()
  }

  const handleTimeUp = () => {
    if (currentQuestion < questions.length) {
      // Mark remaining questions as unanswered
      const remainingQuestions = questions.slice(currentQuestion).map((q) => ({
        questionId: q.id,
        selected: [],
        correct: false,
        timeSpent: 0,
      }))
      setAnswers((prev) => [...prev, ...remainingQuestions])
    }
    completePhase()
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setQuestionStartTime(Date.now())
    } else {
      completePhase()
    }
  }

  const completePhase = () => {
    setIsComplete(true)
    const correctAnswers = answers.filter((a) => a.correct).length
    const unansweredQuestions = answers.filter((a) => a.selected.length === 0).length
    const totalPoints = correctAnswers * 2 + unansweredQuestions * 1

    updateParticipantData({
      prediction: {
        completed: true,
        correctAnswers,
        totalQuestions: questions.length,
        totalPoints,
        timeUsed: 20 * 60 - timeLeft,
        answers,
      },
    })
  }

  const startPhase = () => {
    setShowInstructions(false)
    setQuestionStartTime(Date.now())
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 mr-2 text-red-600" />
              Final Test - Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Final Assessment Phase</h3>

              <div className="space-y-4 text-red-700">
                <p>
                  This is the final test with <strong>30 knapsack questions</strong> for chances to win a prize. You
                  have exactly <strong>20 minutes</strong> to complete the test.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Question Order
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>
                        • Questions 1-10: <strong>Hard</strong> difficulty
                      </li>
                      <li>
                        • Questions 11-20: <strong>Medium</strong> difficulty
                      </li>
                      <li>
                        • Questions 21-30: <strong>Easy</strong> difficulty
                      </li>
                      <li>• Strictly descending difficulty order</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Test Rules
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• 20 minutes total time limit</li>
                      <li>• Linear progression through questions</li>
                      <li>• Same scoring as benchmark test</li>
                      <li>• Performance affects prize chances</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">
                    💡 <strong>Strategy Note:</strong> Questions start very difficult and get easier. Consider your time
                    allocation carefully - easier questions are at the end!
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={startPhase} size="lg" className="bg-red-600 hover:bg-red-700">
                <Target className="h-5 w-5 mr-2" />
                Start Final Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    const correctAnswers = answers.filter((a) => a.correct).length
    const unansweredQuestions = answers.filter((a) => a.selected.length === 0).length
    const incorrectAnswers = answers.filter((a) => a.selected.length > 0 && !a.correct).length
    const totalPoints = correctAnswers * 2 + unansweredQuestions * 1

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 mr-2 text-green-600" />
              Final Test Complete!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Final Performance</h3>

                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-yellow-600">{unansweredQuestions}</div>
                    <div className="text-sm text-gray-600">Unanswered</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-red-600">{incorrectAnswers}</div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-red-500">
                    <div className="text-3xl font-bold text-red-600">{totalPoints}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                </div>

                <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">
                    You earned <strong>{totalPoints} probability points</strong> from this test!
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Performance from one of your tests will be randomly selected for the final prize calculation.
                  </p>
                </div>

                <Button onClick={onNext} size="lg">
                  Continue to Question Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100
  const difficultyColor = {
    easy: "bg-green-500",
    medium: "bg-yellow-500",
    hard: "bg-red-500",
  }[question.difficulty]

  // Determine current difficulty section
  let sectionInfo = ""
  if (currentQuestion < 10) {
    sectionInfo = `Hard Section (${currentQuestion + 1}/10)`
  } else if (currentQuestion < 20) {
    sectionInfo = `Medium Section (${currentQuestion - 9}/10)`
  } else {
    sectionInfo = `Easy Section (${currentQuestion - 19}/10)`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Timer and Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <Badge className={`text-white ${difficultyColor}`}>{question.difficulty.toUpperCase()}</Badge>
              <Badge variant="outline">{sectionInfo}</Badge>
            </div>

            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                timeLeft <= 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <Progress value={progress} className="h-2" />

          {timeLeft <= 300 && (
            <div className="mt-2 text-center">
              <Badge variant="destructive" className="animate-pulse">
                Less than 5 minutes remaining!
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Difficulty Indicator */}
      <div className="bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 border rounded-lg p-3">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className={currentQuestion < 10 ? "font-bold" : ""}>Hard (1-10)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className={currentQuestion >= 10 && currentQuestion < 20 ? "font-bold" : ""}>Medium (11-20)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className={currentQuestion >= 20 ? "font-bold" : ""}>Easy (21-30)</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`question-${currentQuestion}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <KnapsackQuestion question={question} onAnswer={handleAnswer} isInteractive={true} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
