"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, BarChart3, Star, ChevronLeft, ChevronRight } from "lucide-react"
import KnapsackQuestion from "@/components/knapsack-question"

interface BenchmarkPhaseProps {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

// Generate 30 questions with mixed difficulty in HME-HME pattern
const generateBenchmarkQuestions = () => {
  const hardQuestions = Array.from({ length: 10 }, (_, i) => ({
    id: i * 3 + 1,
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
    id: i * 3 + 2,
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
    id: i * 3 + 3,
    capacity: 12 + i,
    balls: [
      { id: 1, weight: 6 + i, reward: 18 + i, color: "bg-indigo-500" },
      { id: 2, weight: 4 + i, reward: 12 + i, color: "bg-pink-500" },
      { id: 3, weight: 3 + i, reward: 9 + i, color: "bg-orange-500" },
    ],
    solution: [1, 2],
    difficulty: "easy",
  }))

  // Create HME pattern: Hard-Medium-Easy repeated
  const questions = []
  for (let i = 0; i < 10; i++) {
    questions.push(hardQuestions[i])
    questions.push(mediumQuestions[i])
    questions.push(easyQuestions[i])
  }

  return questions
}

export default function BenchmarkPhase({ onNext, updateParticipantData }: BenchmarkPhaseProps) {
  const [questions] = useState(generateBenchmarkQuestions())
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{
    [key: number]: { selected: number[]; confirmed: boolean; correct: boolean }
  }>({})
  const [starredQuestions, setStarredQuestions] = useState<Set<number>>(new Set())
  const [showInstructions, setShowInstructions] = useState(true)
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 minutes
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
    const questionId = questions[currentQuestion].id
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selected: selectedBalls,
        confirmed: true,
        correct: isCorrect,
      },
    }))
  }

  const handleTimeUp = () => {
    completeTest()
  }

  const completeTest = () => {
    setIsComplete(true)
    const correctAnswers = Object.values(answers).filter((a) => a.confirmed && a.correct).length
    const confirmedAnswers = Object.values(answers).filter((a) => a.confirmed).length
    const unansweredQuestions = questions.length - confirmedAnswers
    const totalPoints = correctAnswers * 2 + unansweredQuestions * 1

    updateParticipantData({
      benchmark: {
        completed: true,
        correctAnswers,
        totalQuestions: questions.length,
        totalPoints,
        timeUsed: 20 * 60 - timeLeft,
        answers,
      },
    })
    onNext()
  }

  const toggleStar = (questionIndex: number) => {
    setStarredQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex)
      } else {
        newSet.add(questionIndex)
      }
      return newSet
    })
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index)
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
              <BarChart3 className="h-6 w-6 mr-2 text-purple-600" />
              Benchmark Test - Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Benchmark Assessment</h3>

              <div className="space-y-4 text-purple-700">
                <p>
                  You will complete a test with <strong>30 knapsack questions</strong> for chances to win a prize. You
                  have exactly <strong>20 minutes</strong> to complete the test.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🧭 Navigation</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Move to any question without penalty</li>
                      <li>• Use the question menu to jump around</li>
                      <li>• Star questions for easy reference</li>
                      <li>• View confirmed answers anytime</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🎯 Scoring</h4>
                    <ul className="text-sm space-y-1">
                      <li>
                        • <strong>2 points</strong> for each correct solution
                      </li>
                      <li>
                        • <strong>1 point</strong> for each unanswered solution
                      </li>
                      <li>
                        • <strong>0 points</strong> for incorrect solutions
                      </li>
                      <li>• Must confirm answers to count</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">
                    💡 <strong>Strategy Tip:</strong> You are NOT expected to finish every question. Plan your time
                    accordingly and focus on questions you can solve accurately.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => setShowInstructions(false)}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Clock className="h-5 w-5 mr-2" />
                Start Benchmark Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Benchmark Test Complete!</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Great job completing the benchmark test!</h3>
              <p className="text-gray-700 mb-6">
                Your performance has been recorded and will contribute to your final results.
              </p>
              <Button onClick={completeTest} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Continue to Final Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const currentAnswer = answers[question.id]
  const progress =
    (Object.keys(answers).filter((k) => answers[Number.parseInt(k)].confirmed).length / questions.length) * 100

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Question Navigation */}
        <div className="col-span-3">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Questions</h3>
                <div
                  className={`px-2 py-1 rounded text-sm font-mono ${
                    timeLeft <= 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-gray-500">
                {Object.keys(answers).filter((k) => answers[Number.parseInt(k)].confirmed).length} of {questions.length}{" "}
                completed
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <div className="grid grid-cols-6 gap-1 max-h-96 overflow-y-auto">
                {questions.map((q, index) => {
                  const isActive = index === currentQuestion
                  const isAnswered = answers[q.id]?.confirmed
                  const isStarred = starredQuestions.has(index)

                  return (
                    <div key={q.id} className="relative">
                      <Button
                        variant={isActive ? "default" : isAnswered ? "secondary" : "outline"}
                        size="sm"
                        className={`w-full h-10 text-xs ${isActive ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => navigateToQuestion(index)}
                      >
                        {index + 1}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute -top-1 -right-1 w-4 h-4 p-0 ${
                          isStarred ? "text-yellow-500" : "text-gray-300"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(index)
                        }}
                      >
                        <Star className="h-3 w-3" fill={isStarred ? "currentColor" : "none"} />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
                  <span>Starred</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Current Question */}
        <div className="col-span-9 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold">
                    Question {currentQuestion + 1} of {questions.length}
                  </h3>
                  <Badge
                    className={`text-white ${
                      question.difficulty === "easy"
                        ? "bg-green-500"
                        : question.difficulty === "medium"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  >
                    {question.difficulty.toUpperCase()}
                  </Badge>
                  {currentAnswer?.confirmed && <Badge variant="secondary">✓ Confirmed</Badge>}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === questions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <KnapsackQuestion
                question={question}
                onAnswer={handleAnswer}
                isInteractive={!currentAnswer?.confirmed}
                initialSelection={currentAnswer?.selected || []}
                isConfirmed={currentAnswer?.confirmed || false}
              />

              {currentAnswer?.confirmed && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    ✓ Answer confirmed. You can still view this question but cannot change your answer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={completeTest} variant="outline" className="bg-red-50 hover:bg-red-100 border-red-200">
              Finish Test Early
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
