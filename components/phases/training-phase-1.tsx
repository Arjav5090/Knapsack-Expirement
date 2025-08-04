"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import KnapsackQuestion from "@/components/knapsack-question"

interface TrainingPhase1Props {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

const practiceQuestions = [
  {
    id: 1,
    capacity: 8,
    balls: [
      { id: 1, weight: 4, reward: 12, color: "bg-red-500" },
      { id: 2, weight: 3, reward: 10, color: "bg-blue-500" },
      { id: 3, weight: 5, reward: 15, color: "bg-green-500" },
    ],
    solution: [2, 3],
    explanation: "Select balls 2 and 3 for total weight 8 and reward 25.",
  },
  {
    id: 2,
    capacity: 12,
    balls: [
      { id: 1, weight: 6, reward: 18, color: "bg-purple-500" },
      { id: 2, weight: 4, reward: 12, color: "bg-yellow-500" },
      { id: 3, weight: 3, reward: 8, color: "bg-pink-500" },
      { id: 4, weight: 5, reward: 16, color: "bg-indigo-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 10 and reward 30.",
  },
  {
    id: 3,
    capacity: 15,
    balls: [
      { id: 1, weight: 8, reward: 24, color: "bg-red-500" },
      { id: 2, weight: 6, reward: 18, color: "bg-blue-500" },
      { id: 3, weight: 4, reward: 12, color: "bg-green-500" },
      { id: 4, weight: 3, reward: 9, color: "bg-yellow-500" },
      { id: 5, weight: 2, reward: 6, color: "bg-purple-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 14 and reward 42.",
  },
  {
    id: 4,
    capacity: 10,
    balls: [
      { id: 1, weight: 5, reward: 20, color: "bg-orange-500" },
      { id: 2, weight: 4, reward: 15, color: "bg-teal-500" },
      { id: 3, weight: 6, reward: 22, color: "bg-rose-500" },
      { id: 4, weight: 3, reward: 12, color: "bg-cyan-500" },
    ],
    solution: [1, 2],
    explanation: "Select balls 1 and 2 for total weight 9 and reward 35.",
  },
  {
    id: 5,
    capacity: 20,
    balls: [
      { id: 1, weight: 10, reward: 30, color: "bg-red-500" },
      { id: 2, weight: 8, reward: 24, color: "bg-blue-500" },
      { id: 3, weight: 6, reward: 18, color: "bg-green-500" },
      { id: 4, weight: 4, reward: 12, color: "bg-yellow-500" },
      { id: 5, weight: 12, reward: 36, color: "bg-purple-500" },
    ],
    solution: [2, 3, 4],
    explanation: "Select balls 2, 3, and 4 for total weight 18 and reward 54.",
  },
  {
    id: 6,
    capacity: 25,
    balls: [
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

export default function TrainingPhase1({ onNext, updateParticipantData }: TrainingPhase1Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Array<{ questionId: number; selected: number[]; correct: boolean }>>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<{ selected: number[]; correct: boolean } | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [wantMorePractice, setWantMorePractice] = useState<boolean | null>(null)

  const handleAnswer = (selectedBalls: number[], isCorrect: boolean) => {
    const newAnswer = {
      questionId: practiceQuestions[currentQuestion].id,
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

    if (currentQuestion < practiceQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Show completion screen
      setWantMorePractice(false)
    }
  }

  const handleComplete = () => {
    const correctAnswers = answers.filter((a) => a.correct).length
    updateParticipantData({
      training1: {
        completed: true,
        correctAnswers,
        totalQuestions: answers.length,
        accuracy: correctAnswers / answers.length,
      },
    })
    onNext()
  }

  if (showInstructions) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-6 w-6 mr-2 text-green-600" />
              Practice Round - Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Welcome to the Practice Section!</h3>

              <div className="space-y-4 text-green-700">
                <p>
                  In this section, you can practice with sample questions. You will see a total of
                  <strong> 6 questions</strong> to help you get familiar with the knapsack puzzle.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">📚 Learning Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Immediate feedback after each answer</li>
                      <li>• See the correct solution and explanation</li>
                      <li>• No time pressure - take your time</li>
                      <li>• Questions ordered from easy to hard</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🎯 Your Goal</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Click balls to select/deselect them</li>
                      <li>• Maximize reward without exceeding capacity</li>
                      <li>• Click "Confirm Answer" when ready</li>
                      <li>• Learn from the explanations provided</li>
                    </ul>
                  </div>
                </div>

                <p className="text-center font-medium">
                  After completing all questions, you can request additional practice if needed.
                </p>
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
    const accuracy = (correctAnswers / answers.length) * 100

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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Great job on completing the practice!</h3>

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

                <p className="text-gray-700 mb-6">
                  You've completed all practice questions. Would you like additional practice before moving to the next
                  phase?
                </p>

                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset for more practice
                      setCurrentQuestion(0)
                      setAnswers([])
                      setWantMorePractice(null)
                      setShowFeedback(false)
                      setLastAnswer(null)
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    More Practice
                  </Button>

                  <Button onClick={handleComplete}>Continue to Skills Test</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = practiceQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / practiceQuestions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Practice Question {currentQuestion + 1} of {practiceQuestions.length}
            </span>
            <Badge variant="outline">No Time Limit</Badge>
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
                {currentQuestion === practiceQuestions.length - 1 ? "Complete Practice" : "Next Question"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
