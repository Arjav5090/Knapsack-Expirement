"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Package, Coins, Weight, HelpCircle } from "lucide-react"
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

export default function TutorialPhase({ onNext }: TutorialPhaseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showSamples, setShowSamples] = useState(false)
  const [currentSample, setCurrentSample] = useState(0)

  const steps = [
    {
      title: "Understanding the Knapsack Problem",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Package className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4">In every question, you will see:</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />A Knapsack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Has a <strong>capacity (C)</strong> - the maximum weight it can hold
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Example: Capacity = 10</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Coins className="h-5 w-5 mr-2 text-green-600" />
                  Colored Balls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Each ball has two properties:</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Weight className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm">
                      <strong>Weight (W):</strong> How heavy it is
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="text-sm">
                      <strong>Reward (R):</strong> Points you earn
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "Your Goal",
      content: (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-xl border-2 border-yellow-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Maximize Your Reward Points!</h3>
            <p className="text-lg text-gray-700 mb-6">
              Select balls to collect the most reward points possible without exceeding the knapsack's capacity.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-green-700 mb-2">✓ Rules</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click balls to select/deselect them</li>
                  <li>• Each ball can only be used once</li>
                  <li>• Total weight must not exceed capacity</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-blue-700 mb-2">🎯 Scoring</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All-or-nothing scoring</li>
                  <li>• Must find the optimal solution</li>
                  <li>• Partial credit not awarded</li>
                </ul>
              </div>
            </div>
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
