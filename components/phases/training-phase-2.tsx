"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Zap, Trophy, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import KnapsackQuestion from "@/components/knapsack-question"

interface TrainingPhase2Props {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

const skillsQuestions = [
  // Easy questions (1-3)
  {
    id: 1,
    capacity: 10,
    balls: [
      { id: 1, weight: 6, reward: 18, color: "bg-red-500" },
      { id: 2, weight: 4, reward: 12, color: "bg-blue-500" },
      { id: 3, weight: 3, reward: 9, color: "bg-green-500" },
    ],
    solution: [1, 2],
    difficulty: "easy",
  },
  {
    id: 2,
    capacity: 12,
    balls: [
      { id: 1, weight: 5, reward: 15, color: "bg-purple-500" },
      { id: 2, weight: 7, reward: 21, color: "bg-yellow-500" },
      { id: 3, weight: 4, reward: 12, color: "bg-pink-500" },
      { id: 4, weight: 3, reward: 9, color: "bg-indigo-500" },
    ],
    solution: [2, 3],
    difficulty: "easy",
  },
  {
    id: 3,
    capacity: 15,
    balls: [
      { id: 1, weight: 8, reward: 24, color: "bg-red-500" },
      { id: 2, weight: 6, reward: 18, color: "bg-blue-500" },
      { id: 3, weight: 5, reward: 15, color: "bg-green-500" },
      { id: 4, weight: 4, reward: 12, color: "bg-yellow-500" },
    ],
    solution: [1, 2],
    difficulty: "easy",
  },
  // Medium questions (4-7)
  {
    id: 4,
    capacity: 18,
    balls: [
      { id: 1, weight: 9, reward: 27, color: "bg-orange-500" },
      { id: 2, weight: 7, reward: 21, color: "bg-teal-500" },
      { id: 3, weight: 6, reward: 18, color: "bg-rose-500" },
      { id: 4, weight: 5, reward: 15, color: "bg-cyan-500" },
      { id: 5, weight: 4, reward: 12, color: "bg-lime-500" },
    ],
    solution: [1, 2],
    difficulty: "medium",
  },
  {
    id: 5,
    capacity: 20,
    balls: [
      { id: 1, weight: 10, reward: 30, color: "bg-red-500" },
      { id: 2, weight: 8, reward: 24, color: "bg-blue-500" },
      { id: 3, weight: 6, reward: 18, color: "bg-green-500" },
      { id: 4, weight: 5, reward: 15, color: "bg-yellow-500" },
      { id: 5, weight: 4, reward: 12, color: "bg-purple-500" },
    ],
    solution: [1, 2],
    difficulty: "medium",
  },
  {
    id: 6,
    capacity: 22,
    balls: [
      { id: 1, weight: 12, reward: 36, color: "bg-indigo-500" },
      { id: 2, weight: 10, reward: 30, color: "bg-pink-500" },
      { id: 3, weight: 8, reward: 24, color: "bg-orange-500" },
      { id: 4, weight: 6, reward: 18, color: "bg-teal-500" },
      { id: 5, weight: 5, reward: 15, color: "bg-rose-500" },
    ],
    solution: [1, 2],
    difficulty: "medium",
  },
  {
    id: 7,
    capacity: 25,
    balls: [
      { id: 1, weight: 15, reward: 45, color: "bg-cyan-500" },
      { id: 2, weight: 12, reward: 36, color: "bg-lime-500" },
      { id: 3, weight: 10, reward: 30, color: "bg-amber-500" },
      { id: 4, weight: 8, reward: 24, color: "bg-emerald-500" },
      { id: 5, weight: 6, reward: 18, color: "bg-violet-500" },
    ],
    solution: [1, 4],
    difficulty: "medium",
  },
  // Hard questions (8-10)
  {
    id: 8,
    capacity: 30,
    balls: [
      { id: 1, weight: 18, reward: 54, color: "bg-red-500" },
      { id: 2, weight: 15, reward: 45, color: "bg-blue-500" },
      { id: 3, weight: 12, reward: 36, color: "bg-green-500" },
      { id: 4, weight: 10, reward: 30, color: "bg-yellow-500" },
      { id: 5, weight: 8, reward: 24, color: "bg-purple-500" },
      { id: 6, weight: 6, reward: 18, color: "bg-pink-500" },
    ],
    solution: [1, 3],
    difficulty: "hard",
  },
  {
    id: 9,
    capacity: 35,
    balls: [
      { id: 1, weight: 20, reward: 60, color: "bg-indigo-500" },
      { id: 2, weight: 18, reward: 54, color: "bg-orange-500" },
      { id: 3, weight: 15, reward: 45, color: "bg-teal-500" },
      { id: 4, weight: 12, reward: 36, color: "bg-rose-500" },
      { id: 5, weight: 10, reward: 30, color: "bg-cyan-500" },
      { id: 6, weight: 8, reward: 24, color: "bg-lime-500" },
    ],
    solution: [1, 3],
    difficulty: "hard",
  },
  {
    id: 10,
    capacity: 40,
    balls: [
      { id: 1, weight: 25, reward: 75, color: "bg-amber-500" },
      { id: 2, weight: 20, reward: 60, color: "bg-emerald-500" },
      { id: 3, weight: 18, reward: 54, color: "bg-violet-500" },
      { id: 4, weight: 15, reward: 45, color: "bg-sky-500" },
      { id: 5, weight: 12, reward: 36, color: "bg-stone-500" },
      { id: 6, weight: 10, reward: 30, color: "bg-red-500" },
    ],
    solution: [1, 4],
    difficulty: "hard",
  },
]

export default function TrainingPhase2({ onNext, updateParticipantData }: TrainingPhase2Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ questionId: number; selected: number[]; correct: boolean; timeSpent: number }>
  >([])
  const [showInstructions, setShowInstructions] = useState(true)
  const [startTime, setStartTime] = useState<number>(0)
  const [totalTimeLeft, setTotalTimeLeft] = useState(15 * 60)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [isComplete, setIsComplete] = useState(false)
  const hasCompleted = useRef(false)

  // Total timer
  useEffect(() => {
    if (!showInstructions && totalTimeLeft > 0 && !isComplete) {
      const timer = setInterval(() => {
        setTotalTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showInstructions, totalTimeLeft, isComplete])

  const nextQuestion = () => {
    if (currentQuestion < skillsQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setQuestionStartTime(Date.now())
    } else {
      completePhase()
    }
  }

  const handleAnswer = (selectedBalls: number[], isCorrect: boolean) => {
    if (hasCompleted.current) return

    const timeSpent = Date.now() - questionStartTime
    const newAnswer = {
      questionId: skillsQuestions[currentQuestion].id,
      selected: selectedBalls,
      correct: isCorrect,
      timeSpent: Math.round(timeSpent / 1000),
    }

    setAnswers((prev) => [...prev, newAnswer])
    nextQuestion()
  }

  const skipQuestion = () => {
    if (hasCompleted.current) return

    const timeSpent = Date.now() - questionStartTime
    const newAnswer = {
      questionId: skillsQuestions[currentQuestion].id,
      selected: [],
      correct: false,
      timeSpent: Math.round(timeSpent / 1000),
    }

    setAnswers((prev) => [...prev, newAnswer])
    nextQuestion()
  }

  const handleTimeUp = () => {
    if (hasCompleted.current) return

    const remaining = skillsQuestions.slice(currentQuestion).map((q) => ({
      questionId: q.id,
      selected: [],
      correct: false,
      timeSpent: 0,
    }))
    setAnswers((prev) => [...prev, ...remaining])
    completePhase()
  }

  const completePhase = async () => {
    if (hasCompleted.current) return
    hasCompleted.current = true
    setIsComplete(true)

    const correctAnswers = answers.filter((a) => a.correct).length
    const performanceScore = correctAnswers

    const payload = {
      phase: "skill",
      participantId: localStorage.getItem("participantId"),
      data: {
        completed: true,
        correctAnswers,
        totalQuestions: skillsQuestions.length,
        accuracy: correctAnswers / skillsQuestions.length,
        timeUsed: 15 * 60 - totalTimeLeft,
        answers,
      },
    }

    try {
      const res = await fetch("http://localhost:8787/api/v1/ingest-phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to submit skill test data")
      console.log("[Skill Test] Submission successful ✅")
      updateParticipantData({ training2: payload.data, totalScore: performanceScore })
    } catch (err) {
      console.error("[Skill Test] Submission failed ❌", err)
      alert("There was an error submitting your skill test results.")
    }
  }

  const startPhase = () => {
    setShowInstructions(false)
    setStartTime(Date.now())
    setQuestionStartTime(Date.now())
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const question = skillsQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / skillsQuestions.length) * 100
  const difficultyColor = {
    easy: "bg-green-500",
    medium: "bg-yellow-500",
    hard: "bg-red-500",
  }[question.difficulty]
  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-6 w-6 mr-2 text-orange-600" />
              Test 1 - Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-orange-800 mb-6">Test 1</h3>

              <div className="space-y-6 text-orange-700">
                <p className="text-lg">
                  In this section, you will complete <strong>10 questions</strong> to assess your skills.
                  Once you start, you will have exactly <strong>15 minutes total</strong> to
                  complete all questions.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Rules
                    </h4>
                    <ul className="text-base space-y-2">
                      <li>• You have 15 minutes total for all 10 questions.</li>
                      <li>• Timer counts down continuously.</li>
                      <li>• You cannot come back to previous questions after seeing later questions, so answer questions you wish before moving on.</li>
                      <li>• Guessing is penalized! Please only answer questions you wish to answer.</li>
                      <li>• Only questions confirmed are considered answered, unconfirmed questions are considered unanswered!</li>
                      <li>• Auto-submit when time runs out.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Assessment
                    </h4>
                    <ul className="text-base space-y-2">
                      <li>
                        • <strong>Correct answers</strong>: Contribute to your assessment
                      </li>
                      <li>
                        • <strong>Incorrect answers</strong>: Do not contribute to your assessment
                      </li>
                      <li>
                        • <strong>Unanswered questions</strong>: Considered neutral
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-100 border border-red-300 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <h4 className="text-lg font-semibold text-red-800">Important Reminders</h4>
                  </div>
                  <ul className="text-base text-red-700 space-y-2">
                    <li>
                      • <strong>MUST confirm answers you wish to submit!</strong> Unconfirmed = unanswered.
                    </li>
                    <li>• You ARE expected to finish before the timing constraint.</li>
                    <li>• If you attempted a question but do not wish to answer it, no need to deselect the balls, just leave the question unconfirmed.</li>
                    <li>• Focus on accuracy over speed.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={startPhase} size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Clock className="h-5 w-5 mr-2" />
                Start Test 1
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
    const performanceScore = correctAnswers

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-green-600" />
              Test 1 Complete!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Performance Summary</h3>

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

                  <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-blue-500">
                    <div className="text-3xl font-bold text-blue-600">{performanceScore}</div>
                    <div className="text-sm text-gray-600">Performance Score</div>
                  </div>
                </div>

                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-medium">
                    You achieved a performance score of <strong>{performanceScore}</strong>!
                  </p>
                  <p className="text-blue-700 text-sm mt-1">Great job completing the assessment.</p>
                </div>

                <Button onClick={onNext} size="lg">
                  Continue to Benchmark Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

 

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Question {currentQuestion + 1} of {skillsQuestions.length}
              </span>
              <Badge className={`text-white ${difficultyColor}`}>{question.difficulty.toUpperCase()}</Badge>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${totalTimeLeft <= 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(totalTimeLeft)}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
        <p className="text-red-700 font-medium text-sm">
          🚨 Confirm answers or they will be considered unanswered!
        </p>
      </div>

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
