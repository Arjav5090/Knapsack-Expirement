"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Gift, Star, BarChart3, Target, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface ResultsPhaseProps {
  onNext?: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

export default function ResultsPhase({ participantData }: ResultsPhaseProps) {
  const [showPrizeResult, setShowPrizeResult] = useState(false)
  const [selectedTest, setSelectedTest] = useState<"training2" | "benchmark" | "prediction">("training2")
  const [prizeWon, setPrizeWon] = useState(false)

  // Calculate total performance
  const training1 = participantData.training1 || { correctAnswers: 0, totalQuestions: 6, accuracy: 0 }
  const training2 = participantData.training2 || { correctAnswers: 0, totalQuestions: 10, totalPoints: 0 }
  const benchmark = participantData.benchmark || { correctAnswers: 0, totalQuestions: 30, totalPoints: 0 }
  const prediction = participantData.prediction || { correctAnswers: 0, totalQuestions: 30, totalPoints: 0 }

  const totalPoints = participantData.totalPoints || 0

  // Simulate prize determination
  useEffect(() => {
    // Randomly select which test counts for prize
    const tests = ["training2", "benchmark", "prediction"] as const
    const randomTest = tests[Math.floor(Math.random() * tests.length)]
    setSelectedTest(randomTest)

    // Determine if prize is won based on selected test points
    const testData = participantData[randomTest]
    if (testData && testData.totalPoints) {
      const winChance = testData.totalPoints / 100 // Convert points to percentage
      setPrizeWon(Math.random() < winChance)
    }
  }, [participantData])

  const handleRevealPrize = () => {
    setShowPrizeResult(true)
  }

  const getTestName = (test: string) => {
    switch (test) {
      case "training2":
        return "Skills Assessment"
      case "benchmark":
        return "Benchmark Test"
      case "prediction":
        return "Final Test"
      default:
        return test
    }
  }

  const selectedTestData = participantData[selectedTest] || { totalPoints: 0 }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <Card className="text-center shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Experiment Complete!</CardTitle>
          <p className="text-lg text-gray-600 mt-2">Thank you for participating in the Knapsack Challenge</p>
        </CardHeader>
      </Card>

      {/* Performance Summary */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Training Phase 1 */}
        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Practice Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Correct Answers:</span>
                <span className="font-semibold">
                  {training1.correctAnswers}/{training1.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accuracy:</span>
                <span className="font-semibold">{(training1.accuracy * 100).toFixed(0)}%</span>
              </div>
              <Progress value={training1.accuracy * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Training Phase 2 */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
              Skills Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Correct Answers:</span>
                <span className="font-semibold">
                  {training2.correctAnswers}/{training2.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Points Earned:</span>
                <span className="font-semibold text-orange-600">{training2.totalPoints}</span>
              </div>
              <Progress value={(training2.correctAnswers / training2.totalQuestions) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Benchmark Test */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Trophy className="h-5 w-5 mr-2 text-purple-600" />
              Benchmark Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Correct Answers:</span>
                <span className="font-semibold">
                  {benchmark.correctAnswers}/{benchmark.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Points Earned:</span>
                <span className="font-semibold text-purple-600">{benchmark.totalPoints}</span>
              </div>
              <Progress value={(benchmark.correctAnswers / benchmark.totalQuestions) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Final Test */}
        <Card className="border-2 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-red-600" />
              Final Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Correct Answers:</span>
                <span className="font-semibold">
                  {prediction.correctAnswers}/{prediction.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Points Earned:</span>
                <span className="font-semibold text-red-600">{prediction.totalPoints}</span>
              </div>
              <Progress value={(prediction.correctAnswers / prediction.totalQuestions) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Overall Performance */}
        <Card className="border-2 border-blue-200 bg-blue-50 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Star className="h-5 w-5 mr-2 text-blue-600" />
              Overall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Points:</span>
                <span className="font-bold text-2xl text-blue-600">{totalPoints}</span>
              </div>
              <div className="text-center">
                <Badge className="bg-blue-600 text-white">Excellent Performance!</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prize Section */}
      <Card className="shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-2xl">
            <Gift className="h-8 w-8 mr-3 text-yellow-600" />
            Prize Determination
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showPrizeResult ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-yellow-200">
                <h3 className="text-lg font-semibold mb-4">
                  Your prize chances are determined by one randomly selected test:
                </h3>

                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
                  <p className="font-medium text-yellow-800">
                    Selected Test: <strong>{getTestName(selectedTest)}</strong>
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Points from this test: <strong>{selectedTestData.totalPoints}</strong>
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Win probability: <strong>{selectedTestData.totalPoints}%</strong>
                  </p>
                </div>

                <Button
                  onClick={handleRevealPrize}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Reveal Prize Result
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div
                className={`p-8 rounded-xl border-4 ${
                  prizeWon ? "bg-green-100 border-green-500" : "bg-blue-100 border-blue-500"
                }`}
              >
                {prizeWon ? (
                  <div className="space-y-4">
                    <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
                    <h3 className="text-3xl font-bold text-green-800">🎉 Congratulations! 🎉</h3>
                    <p className="text-xl text-green-700">You won the prize!</p>
                    <p className="text-green-600">
                      Based on your {selectedTestData.totalPoints}% chance from the {getTestName(selectedTest)}, you
                      have successfully won the reward!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Gift className="h-16 w-16 text-blue-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-blue-800">Thank you for participating!</h3>
                    <p className="text-xl text-blue-700">
                      While you didn't win this time, your contribution to research is valuable.
                    </p>
                    <p className="text-blue-600">
                      Your {selectedTestData.totalPoints}% chance from the {getTestName(selectedTest)}
                      didn't result in a win this time, but you performed excellently!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Study Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-xl">About This Study</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-700">
            This experiment investigated how people approach optimization problems under different conditions. The
            knapsack problem is a classic algorithmic challenge used in computer science and operations research.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">What we studied:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Problem-solving strategies under time pressure</li>
                <li>• How question ordering affects performance</li>
                <li>• Strategic decision-making in optimization tasks</li>
                <li>• Cognitive approaches to complex problems</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Your contribution:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Provided valuable data on human problem-solving</li>
                <li>• Helped understand cognitive strategies</li>
                <li>• Contributed to algorithm design research</li>
                <li>• Advanced our knowledge of decision-making</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              All data collected is anonymized and will be used solely for research purposes. Thank you for your
              valuable participation!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
