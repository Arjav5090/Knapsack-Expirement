"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, ArrowRight, Trophy, Target } from "lucide-react"
import { motion } from "framer-motion"

interface IntroPhaseProps {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

export default function IntroPhase({ onNext }: IntroPhaseProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="text-center shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Welcome to the Knapsack Challenge!</CardTitle>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Thank you for participating in our experiment. You'll complete a series of algorithm puzzles for chances
              to win exciting prizes!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Win Prizes</h3>
                <p className="text-sm text-gray-600">
                  Your performance determines your chances of winning real rewards
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Algorithm Puzzles</h3>
                <p className="text-sm text-gray-600">Solve engaging knapsack optimization problems</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <Gift className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Fair & Fun</h3>
                <p className="text-sm text-gray-600">
                  Practice rounds and clear instructions ensure everyone can participate
                </p>
              </motion.div>
            </div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button
                onClick={onNext}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
              >
                Begin Experiment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <p className="text-xs text-gray-500 mt-4">
              Estimated time: 45-60 minutes • All data is anonymized and secure
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
