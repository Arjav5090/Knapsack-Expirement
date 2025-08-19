"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Package, Coins, Weight, HelpCircle, Target, DollarSign, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import KnapsackQuestion from "@/components/knapsack-question"

interface TutorialPhaseProps {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

const sampleQuestions = [
  {
    id: 1,
    capacity: 10,
    balls: [
      { id: 1, weight: 6, reward: 30, color: "bg-red-500" },
      { id: 2, weight: 3, reward: 14, color: "bg-blue-500" },
      { id: 3, weight: 4, reward: 16, color: "bg-green-500" },
      { id: 4, weight: 2, reward: 9, color: "bg-yellow-500" },
    ],
    solution: [2, 3, 4],
    explanation: "Select balls 2, 3, and 4 for a total weight of 9 (≤10) and reward of 39 points.",
  },
  {
    id: 2,
    capacity: 15,
    balls: [
      { id: 1, weight: 10, reward: 60, color: "bg-purple-500" },
      { id: 2, weight: 20, reward: 100, color: "bg-pink-500" },
      { id: 3, weight: 15, reward: 120, color: "bg-indigo-500" },
    ],
    solution: [3],
    explanation: "Select ball 3 for maximum reward of 120 points with weight exactly 15.",
  },
]

// Interactive example questions for tutorial
const exampleQuestions = [
  {
    id: "tutorial1",
    capacity: 8,
    balls: [
      { id: 1, weight: 5, reward: 20, color: "bg-red-500" },
      { id: 2, weight: 3, reward: 18, color: "bg-blue-500" },
      { id: 3, weight: 4, reward: 22, color: "bg-green-500" },
      { id: 4, weight: 2, reward: 8, color: "bg-yellow-500" },
    ],
    solution: [2, 3], // Optimal solution: balls 2 and 3 for weight=7, reward=40
    title: "Example 1"
  },
  {
    id: "tutorial2",
    capacity: 12,
    balls: [
      { id: 1, weight: 6, reward: 25, color: "bg-purple-500" },
      { id: 2, weight: 4, reward: 20, color: "bg-pink-500" },
      { id: 3, weight: 8, reward: 35, color: "bg-indigo-500" },
      { id: 4, weight: 3, reward: 12, color: "bg-cyan-500" },
    ],
    solution: [2, 3], // Optimal solution: balls 2 and 3 for weight=12, reward=55
    title: "Example 2"
  }
]

function DynamicExample() {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [selectedBalls, setSelectedBalls] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{
    type: "none" | "success" | "too_heavy" | "suboptimal"
    message: string
  }>({ type: "none", message: "" })

  const currentExample = exampleQuestions[currentExampleIndex]

  const currentWeight = selectedBalls.reduce(
    (sum, ballId) => sum + currentExample.balls.find(b => b.id === ballId)!.weight,
    0
  )
  const currentReward = selectedBalls.reduce(
    (sum, ballId) => sum + currentExample.balls.find(b => b.id === ballId)!.reward,
    0
  )

  const resetExample = () => {
    setSelectedBalls([])
    setFeedback({ type: "none", message: "" })
  }

  const nextExample = () => {
    if (currentExampleIndex < exampleQuestions.length - 1) {
      setCurrentExampleIndex(currentExampleIndex + 1)
      resetExample()
    }
  }

  const prevExample = () => {
    if (currentExampleIndex > 0) {
      setCurrentExampleIndex(currentExampleIndex - 1)
      resetExample()
    }
  }

  const toggleBall = (ballId: number) => {
    const newSelection = selectedBalls.includes(ballId)
      ? selectedBalls.filter(id => id !== ballId)
      : [...selectedBalls, ballId]
    
    setSelectedBalls(newSelection)
    
    // Calculate feedback
    const newWeight = newSelection.reduce(
      (sum, id) => sum + currentExample.balls.find(b => b.id === id)!.weight,
      0
    )
    const newReward = newSelection.reduce(
      (sum, id) => sum + currentExample.balls.find(b => b.id === id)!.reward,
      0
    )

    // Check if weight exceeds capacity
    if (newWeight > currentExample.capacity) {
      setFeedback({
        type: "too_heavy",
        message: "Oops, the balls are too heavy! Try a different combination."
      })
      return
    }

    // Check if this is the optimal solution
    const isOptimal = newSelection.length === currentExample.solution.length &&
      currentExample.solution.every(id => newSelection.includes(id))
    
    if (isOptimal) {
      setFeedback({
        type: "success",
        message: "Nice! This is just right! You found the optimal solution."
      })
    } else if (newSelection.length > 0) {
      // Check if there's a better combination possible
      const optimalReward = currentExample.solution.reduce(
        (sum, id) => sum + currentExample.balls.find(b => b.id === id)!.reward,
        0
      )
      if (newReward < optimalReward) {
        setFeedback({
          type: "suboptimal",
          message: "Oops, some other combination will give you more reward!"
        })
      } else {
        setFeedback({ type: "none", message: "" })
      }
    } else {
      setFeedback({ type: "none", message: "" })
    }
  }

  return (
    <div className="space-y-4">
      {/* Example navigation */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">{currentExample.title}</h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevExample}
            disabled={currentExampleIndex === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            {currentExampleIndex + 1} of {exampleQuestions.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={nextExample}
            disabled={currentExampleIndex === exampleQuestions.length - 1}
          >
            Next
          </Button>
        </div>
      </div>

      <Card className="border-2 border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Capacity: {currentExample.capacity}
            </span>
            <Badge variant="secondary">
              Weight: {currentWeight}/{currentExample.capacity}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balls display */}
          <div className="grid grid-cols-2 gap-3">
            {currentExample.balls.map((ball) => (
              <motion.div
                key={ball.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleBall(ball.id)}
                className={`
                  relative cursor-pointer rounded-lg p-3 border-2 transition-all
                  ${selectedBalls.includes(ball.id)
                    ? "border-gray-800 shadow-lg ring-2 ring-blue-500"
                    : "border-gray-300 hover:border-gray-400"
                  }
                `}
              >
                <div
                  className={`w-8 h-8 rounded-full ${ball.color} mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs`}
                >
                  {ball.id}
                </div>
                <div className="text-center">
                  <div className="font-bold text-sm">W: {ball.weight}</div>
                  <div className="text-yellow-600 font-bold text-sm">R: {ball.reward}</div>
                </div>
                {selectedBalls.includes(ball.id) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Current selection summary */}
          <div className="bg-gray-100 p-3 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">Selected:</span>
              <span className="text-gray-600">
                {selectedBalls.length > 0 ? selectedBalls.join(", ") : "None"}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-medium">Reward:</span>
              <span className="text-yellow-600 font-bold">{currentReward} points</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetExample}
              disabled={selectedBalls.length === 0}
            >
              Reset
            </Button>
          </div>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback.type !== "none" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border-2 text-sm ${
                  feedback.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : feedback.type === "too_heavy"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-orange-50 border-orange-200 text-orange-800"
                }`}
              >
                <div className="flex items-center">
                  {feedback.type === "success" && (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  )}
                  {feedback.type === "too_heavy" && (
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  )}
                  {feedback.type === "suboptimal" && (
                    <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                  )}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TutorialPhase({ onNext }: TutorialPhaseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showSamples, setShowSamples] = useState(false)
  const [currentSample, setCurrentSample] = useState(0)

  const steps = [
    {
      title: "How to do the Knapsack Problem",
      content: (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Static Instructions */}
          <div className="space-y-6">
            {/* General introduction */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border-2 border-blue-200">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Package className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">The Knapsack Problem</h4>
                    <p className="text-gray-700">
                      You will be answering a series of questions, each presenting what's called a "knapsack problem." 
                      These are classic optimization puzzles where you need to make strategic choices to maximize your score.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Monetary Rewards</h4>
                    <p className="text-gray-700">
                      <strong>The more questions you answer correctly, the higher monetary reward you will receive.</strong> 
                      Your performance directly impacts your compensation, so it pays to think carefully about each decision!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How the problem works */}
            <div>
              <h3 className="text-lg font-semibold mb-4">In every question, you will see:</h3>
              <div className="space-y-4">
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-base">
                      <Package className="h-4 w-4 mr-2 text-blue-600" />A Knapsack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm">
                      Has a <strong>capacity (C)</strong> - the maximum weight it can hold
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <span className="text-xs font-medium">Example: Capacity = 10</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-base">
                      <Coins className="h-4 w-4 mr-2 text-green-600" />
                      Colored Balls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 mb-2 text-sm">Each ball has two properties:</p>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Weight className="h-3 w-3 mr-2 text-gray-500" />
                        <span className="text-xs">
                          <strong>Weight (W):</strong> How heavy it is
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Coins className="h-3 w-3 mr-2 text-yellow-500" />
                        <span className="text-xs">
                          <strong>Reward (R):</strong> Points you earn
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Your Goal */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Maximize Your Reward Points!</h3>
              <p className="text-sm text-gray-700 mb-4">
                Select balls to collect the most reward points possible without exceeding the knapsack's capacity.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-green-700 mb-2 text-sm">✓ Rules</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Click balls to select/deselect them</li>
                    <li>• Each ball can only be used once</li>
                    <li>• Total weight must not exceed capacity</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-700 mb-2 text-sm">🎯 Scoring</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• All-or-nothing scoring</li>
                    <li>• Must find the optimal solution</li>
                    <li>• Partial credit not awarded</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Dynamic Interactive Example */}
          <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Try it yourself!</h3>
            <p className="text-center text-gray-700 mb-6">
              Here's what a question will look like. Click on the balls to select them and see what happens:
            </p>
            <DynamicExample />
          </div>
        </div>
      ),
    },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setShowSamples(true)
    }
  }

  const nextSample = () => {
    if (currentSample < sampleQuestions.length - 1) {
      setCurrentSample(currentSample + 1)
    } else {
      onNext()
    }
  }

  if (showSamples) {
    const question = sampleQuestions[currentSample]

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <HelpCircle className="h-6 w-6 mr-2 text-blue-600" />
                Sample Question {currentSample + 1} of {sampleQuestions.length}
              </CardTitle>
              <Badge variant="outline">Tutorial</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <KnapsackQuestion question={question} showSolution={true} isInteractive={false} />

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Solution Explanation:</h4>
              <p className="text-green-700">{question.explanation}</p>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentSample(Math.max(0, currentSample - 1))}
                disabled={currentSample === 0}
              >
                Previous Example
              </Button>

              <Button onClick={nextSample}>
                {currentSample === sampleQuestions.length - 1 ? "Start Practice" : "Next Example"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? "See Examples" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
