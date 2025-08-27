"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import KnapsackQuestion from "@/components/knapsack-question"

interface TrainingPhase1Props {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

const practiceQuestions = [
  { id: 1, capacity: 8, balls: [
      { id: 1, weight: 4, reward: 12, color: "bg-red-500" },
      { id: 2, weight: 3, reward: 10, color: "bg-blue-500" },
      { id: 3, weight: 5, reward: 15, color: "bg-green-500" },
    ],
    solution: [2, 3],
    explanation: "Select balls 2 and 3 for total weight 8 and reward 25.",
  },
  { id: 2, capacity: 12, balls: [
      { id: 1, weight: 6, reward: 18, color: "bg-purple-500" },
      { id: 2, weight: 4, reward: 12, color: "bg-yellow-500" },
      { id: 3, weight: 3, reward: 8, color: "bg-pink-500" },
      { id: 4, weight: 5, reward: 16, color: "bg-indigo-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 10 and reward 30.",
  },
  { id: 3, capacity: 15, balls: [
      { id: 1, weight: 8, reward: 24, color: "bg-red-500" },
      { id: 2, weight: 6, reward: 18, color: "bg-blue-500" },
      { id: 3, weight: 4, reward: 12, color: "bg-green-500" },
      { id: 4, weight: 3, reward: 9, color: "bg-yellow-500" },
      { id: 5, weight: 2, reward: 6, color: "bg-purple-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 14 and reward 42.",
  },
  { id: 4, capacity: 10, balls: [
      { id: 1, weight: 5, reward: 20, color: "bg-orange-500" },
      { id: 2, weight: 4, reward: 15, color: "bg-teal-500" },
      { id: 3, weight: 6, reward: 22, color: "bg-rose-500" },
      { id: 4, weight: 3, reward: 12, color: "bg-cyan-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 9 and reward 35.",
  },
  { id: 5, capacity: 20, balls: [
      { id: 1, weight: 10, reward: 30, color: "bg-red-500" },
      { id: 2, weight: 8, reward: 24, color: "bg-blue-500" },
      { id: 3, weight: 6, reward: 18, color: "bg-green-500" },
      { id: 4, weight: 4, reward: 12, color: "bg-yellow-500" },
      { id: 5, weight: 12, reward: 36, color: "bg-purple-500" },
    ],
    solution: [2, 5],
    explanation: "Select balls 2 and 5 for total weight 20 and reward 60.",
  },
  { id: 6, capacity: 25, balls: [
      { id: 1, weight: 15, reward: 45, color: "bg-indigo-500" },
      { id: 2, weight: 10, reward: 30, color: "bg-pink-500" },
      { id: 3, weight: 8, reward: 24, color: "bg-orange-500" },
      { id: 4, weight: 6, reward: 18, color: "bg-teal-500" },
      { id: 5, weight: 12, reward: 36, color: "bg-rose-500" },
      { id: 6, weight: 5, reward: 15, color: "bg-cyan-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 25 and reward 75.",
  },
]

const extraPracticeQuestions = [
  {
    id: 6,
    capacity: 18,
    balls: [
      { id: 1, weight: 10, reward: 32, color: "bg-violet-500" },
      { id: 2, weight: 7, reward: 21, color: "bg-emerald-500" },
      { id: 3, weight: 8, reward: 25, color: "bg-amber-500" },
      { id: 4, weight: 5, reward: 15, color: "bg-sky-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 17 and reward 53.",
  },
  {
    id: 7,
    capacity: 25,
    balls: [
      { id: 1, weight: 15, reward: 45, color: "bg-lime-500" },
      { id: 2, weight: 12, reward: 36, color: "bg-rose-500" },
      { id: 3, weight: 8, reward: 24, color: "bg-cyan-500" },
      { id: 4, weight: 6, reward: 18, color: "bg-fuchsia-500" },
      { id: 5, weight: 4, reward: 12, color: "bg-slate-500" },
    ],
    solution: [1, 3, 5],
    explanation:
      "Select balls 1, 3, and 5 for total weight 27 and reward 81. Wait, that exceeds capacity! The correct solution is balls 1 and 3 for weight 23 and reward 69.",
  },
]

export default function TrainingPhase1({ onNext, updateParticipantData }: TrainingPhase1Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Array<{ questionId: number; selected: number[]; correct: boolean }>>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<{ selected: number[]; correct: boolean } | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [wantMorePractice, setWantMorePractice] = useState<boolean | null>(null)
  const [isExtraPractice, setIsExtraPractice] = useState(false)
  const [allQuestions, setAllQuestions] = useState(practiceQuestions)

  // 🔑 Load participantId from localStorage once
  const [pid, setPid] = useState<string | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("participantId")
      setPid(stored)
      if (!stored) {
        console.warn("[Practice] No participantId in localStorage. Did registration run on page load?")
      }
    } catch (e) {
      console.error("[Practice] Failed to read participantId from localStorage", e)
    }
  }, [])

  // API base (configure in .env.local as NEXT_PUBLIC_API_BASE=http://localhost:8787)
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787", [])

  const handleAnswer = (selectedBalls: number[], isCorrect: boolean) => {
    const newAnswer = {
      questionId: allQuestions[currentQuestion].id,
      selected: selectedBalls,
      correct: isCorrect,
    }
    setAnswers((prev) => [...prev, newAnswer])
    setLastAnswer({ selected: selectedBalls, correct: isCorrect })
    setShowFeedback(true)
  }

  const nextQuestion = () => {
    setShowFeedback(false)
    setLastAnswer(null)

    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // End of the current set => show completion screen
      setWantMorePractice(false)
    }
  }

  const startExtraPractice = () => {
    setWantMorePractice(true)
    setIsExtraPractice(true)
    setAllQuestions([...practiceQuestions, ...extraPracticeQuestions])
    setCurrentQuestion(practiceQuestions.length) // Start from first extra question
    setWantMorePractice(null) // Back to questions
  }

  const handleComplete = async () => {
    if (!pid) {
      alert("Participant not registered yet. Please refresh the page so we can register your session.")
      console.error("[Practice] handleComplete aborted: no participantId")
      return
    }

    const correctAnswers = answers.filter((a) => a.correct).length
    const payload = {
      phase: "practice",
      participantId: pid,
      data: {
        completed: true,
        correctAnswers,
        totalQuestions: answers.length,
        accuracy: answers.length ? correctAnswers / answers.length : 0,
        answers,
      },
    }

    console.log("[Practice] Submitting payload →", payload)

    try {
      const res = await fetch(`${API_BASE}/api/v1/ingest-phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let json: any = null
      try { json = JSON.parse(text) } catch { /* server might not return JSON on errors */ }

      console.log("[Practice] ingest-phase status:", res.status, "body:", text)

      if (!res.ok) {
        throw new Error(json?.error || `Failed to submit practice data (status ${res.status})`)
      }

      updateParticipantData({ training1: payload.data })
      onNext()
    } catch (err) {
      console.error("[Practice] ingest-phase error:", err)
      alert("There was an error submitting your practice data. See console for details.")
    }
  }

  // UI

  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto">
        {!pid && (
          <div className="mb-4 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            <AlertTriangle className="h-4 w-4" />
            <span>No participant ID yet. Make sure the page registered a participant on load.</span>
          </div>
        )}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 mr-2 text-green-600" />
              Practice Round - Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-green-800 mb-6">Welcome to the Practice Section!</h3>

              <div className="space-y-6 text-green-700">
                <p className="text-lg">
                  In this section, you can practice with sample questions. You will see a total of
                  <strong> 6 questions</strong> to help you get familiar with the knapsack puzzle.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">📚 Learning Features</h4>
                    <ul className="text-base space-y-2">
                      <li>• When you answer a question, you will see the solution and an explanation.</li>
                      <li>• No time constraint for you to finish questions, so take your time!</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">🎯 For Every Question</h4>
                    <ul className="text-base space-y-2">
                      <li>• Click once to select a ball, click on a selected ball again to deselect.</li>
                      <li>• Find the combination of selected balls that maximizes the reward while keeping combined weights below capacity.</li>
                      <li>• Once you think you have the right selection, click "confirm answer" to lock in your selection.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => setShowInstructions(false)} size="lg" className="bg-green-600 hover:bg-green-700">
                Start Practice Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (wantMorePractice !== null) {
    const correctAnswers = answers.filter((a) => a.correct).length
    const accuracy = (answers.length ? (correctAnswers / answers.length) : 0) * 100

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Practice Complete!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Congratulations! You have completed the training.</h3>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">{correctAnswers}</div>
                    <div className="text-sm text-gray-600">Correct Answers</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-green-600">{answers.length}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-purple-600">{accuracy.toFixed(0)}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mb-6">
                  <p className="text-lg text-gray-800 mb-4">
                    You should now know how to complete knapsack problems effectively.
                  </p>
                  <p className="text-base text-gray-700">
                    From this point on, you will be faced with different tests that are all on completing knapsack problems.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-yellow-900 mb-2">Would you like more practice?</h4>
                  <p className="text-yellow-800 text-sm mb-4">
                    If you wish to see additional problems, you can press "More Practice" which will allow you to see more knapsack practice questions.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button onClick={handleComplete} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      Continue to Test 1
                    </Button>
                    <Button onClick={startExtraPractice} variant="outline" size="lg">
                      More Practice
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = allQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Practice Question {currentQuestion + 1} of {allQuestions.length}
              {isExtraPractice && currentQuestion >= practiceQuestions.length && " (Extra Practice)"}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">No Time Limit</Badge>
              {pid && <Badge variant="outline">PID: {pid.slice(0, 8)}…</Badge>}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <AnimatePresence mode="wait">
        {!showFeedback ? (
          <motion.div
            key={`question-${currentQuestion}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <KnapsackQuestion question={question} onAnswer={handleAnswer} isInteractive={true} />
          </motion.div>
        ) : (
          <motion.div
            key={`feedback-${currentQuestion}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Feedback */}
            <Card
              className={`border-2 ${lastAnswer?.correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
            >
              <CardContent className="p-6 text-center">
                {lastAnswer?.correct ? (
                  <div className="space-y-3">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="text-xl font-bold text-green-800">Correct!</h3>
                    <p className="text-green-700">You found the optimal solution. Great job!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                    <h3 className="text-xl font-bold text-red-800">Not Quite Right</h3>
                    <p className="text-red-700">Don't worry! Let's see the optimal solution below.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Solution */}
            <KnapsackQuestion question={question} showSolution={true} isInteractive={false} />

            <div className="text-center">
              <Button onClick={nextQuestion} size="lg">
                {currentQuestion === allQuestions.length - 1 ? "Complete Practice" : "Next Question"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
