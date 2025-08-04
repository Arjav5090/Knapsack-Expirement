"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Coins, Weight, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Ball {
  id: number
  weight: number
  reward: number
  color: string
}

interface Question {
  id: number
  capacity: number
  balls: Ball[]
  solution?: number[]
  explanation?: string
}

interface KnapsackQuestionProps {
  question: Question
  onAnswer?: (selectedBalls: number[], isCorrect: boolean) => void
  showSolution?: boolean
  isInteractive?: boolean
  timeLimit?: number
  onTimeUp?: () => void
  initialSelection?: number[]
  isConfirmed?: boolean
}

export default function KnapsackQuestion({
  question,
  onAnswer,
  showSolution = false,
  isInteractive = true,
  timeLimit,
  onTimeUp,
  initialSelection = [],
  isConfirmed = false,
}: KnapsackQuestionProps) {
  const [selectedBalls, setSelectedBalls] = useState<number[]>(initialSelection)
  const [submitted, setSubmitted] = useState(isConfirmed)
  const [timeLeft, setTimeLeft] = useState(timeLimit || 0)
  const [showWarning, setShowWarning] = useState(false)

  // Reset selection when question changes
  useEffect(() => {
    setSelectedBalls(initialSelection)
    setSubmitted(isConfirmed)
  }, [question.id]) // Only depend on question.id, not the arrays

  // Update the timer useEffect to be more stable
  useEffect(() => {
    if (timeLimit && timeLeft > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 16 && prev > 15) {
            setShowWarning(true)
          }
          if (prev <= 1) {
            onTimeUp?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeLimit, submitted]) // Remove timeLeft from dependencies to prevent loops

  // Add a separate useEffect to initialize timer
  useEffect(() => {
    if (timeLimit) {
      setTimeLeft(timeLimit)
    }
  }, [timeLimit])

  const toggleBall = (ballId: number) => {
    if (!isInteractive || submitted) {
      console.log("Cannot toggle - not interactive or already submitted")
      return
    }

    console.log("Toggling ball:", ballId)
    setSelectedBalls((prev) => {
      const newSelection = prev.includes(ballId) ? prev.filter((id) => id !== ballId) : [...prev, ballId]
      console.log("New selection:", newSelection)
      return newSelection
    })
  }

  const calculateTotals = (ballIds: number[]) => {
    return ballIds.reduce(
      (acc, id) => {
        const ball = question.balls.find((b) => b.id === id)
        if (ball) {
          acc.weight += ball.weight
          acc.reward += ball.reward
        }
        return acc
      },
      { weight: 0, reward: 0 },
    )
  }

  const currentTotals = calculateTotals(selectedBalls)
  const solutionTotals = question.solution ? calculateTotals(question.solution) : null
  const isOverCapacity = currentTotals.weight > question.capacity

  const handleSubmit = () => {
    if (isOverCapacity) return

    setSubmitted(true)
    const isCorrect = question.solution
      ? JSON.stringify([...selectedBalls].sort()) === JSON.stringify([...question.solution].sort())
      : false

    onAnswer?.(selectedBalls, isCorrect)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Timer */}
      {timeLimit && (
        <div className="flex justify-center">
          <Card className={`${timeLeft <= 15 ? "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50"}`}>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${timeLeft <= 15 ? "bg-red-500 animate-pulse" : "bg-blue-500"}`}
                />
                <span className={`font-mono text-lg font-bold ${timeLeft <= 15 ? "text-red-700" : "text-blue-700"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center"
          >
            ⚠️ 15 seconds remaining! Remember to confirm your answer!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Display */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6">
          {/* Knapsack */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-3 bg-gray-100 rounded-lg p-4">
              <Package className="h-8 w-8 text-gray-600" />
              <div>
                <div className="text-sm text-gray-600">Knapsack Capacity</div>
                <div className="text-2xl font-bold text-gray-900">{question.capacity}</div>
              </div>
            </div>
          </div>

          {/* Current Selection Stats */}
          <div className="flex justify-center space-x-6 mb-6">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isOverCapacity ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              <Weight className="h-5 w-5" />
              <span className="font-semibold">
                Weight: {currentTotals.weight}/{question.capacity}
              </span>
            </div>

            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-100 text-green-700">
              <Coins className="h-5 w-5" />
              <span className="font-semibold">Reward: {currentTotals.reward}</span>
            </div>
          </div>

          {/* Balls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {question.balls.map((ball) => {
              const isSelected = selectedBalls.includes(ball.id)
              const isSolution = showSolution && question.solution?.includes(ball.id)

              return (
                <motion.div
                  key={ball.id}
                  whileHover={isInteractive && !submitted ? { scale: 1.05 } : {}}
                  whileTap={isInteractive && !submitted ? { scale: 0.95 } : {}}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "ring-4 ring-blue-500 shadow-lg"
                        : isSolution
                          ? "ring-4 ring-green-500 shadow-lg"
                          : "hover:shadow-md"
                    } ${!isInteractive || submitted ? "cursor-default" : ""}`}
                    onClick={() => toggleBall(ball.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div
                        className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${ball.color}`}
                      >
                        <span className="text-white font-bold text-lg">{ball.id}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-1 text-sm">
                          <Weight className="h-4 w-4 text-gray-500" />
                          <span>W: {ball.weight}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1 text-sm">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span>R: {ball.reward}</span>
                        </div>
                      </div>

                      {isSelected && <CheckCircle className="h-5 w-5 text-blue-500 mx-auto mt-2" />}

                      {isSolution && !isSelected && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Solution
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Submit Button */}
          {isInteractive && !submitted && (
            <div className="text-center mt-6">
              <Button
                onClick={handleSubmit}
                disabled={selectedBalls.length === 0 || isOverCapacity}
                size="lg"
                className={isOverCapacity ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {isOverCapacity ? "Over Capacity!" : "Confirm Answer"}
              </Button>
            </div>
          )}

          {/* Confirmed Status */}
          {submitted && (
            <div className="text-center mt-6">
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-4 w-4 mr-1" />
                Answer Confirmed
              </Badge>
            </div>
          )}

          {/* Solution Display */}
          {showSolution && question.solution && solutionTotals && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Optimal Solution
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-green-700">Balls: {question.solution.join(", ")}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-700">
                    Weight: {solutionTotals.weight}/{question.capacity}
                  </span>
                  <span className="text-green-700 font-semibold">Reward: {solutionTotals.reward}</span>
                </div>
              </div>
              {question.explanation && <p className="text-green-700 mt-2 text-sm">{question.explanation}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
