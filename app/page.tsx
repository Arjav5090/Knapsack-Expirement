"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Gift, Trophy, Clock, Target, Brain } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Phase components
import IntroPhase from "@/components/phases/intro-phase"
import TutorialPhase from "@/components/phases/tutorial-phase"
import TrainingPhase1 from "@/components/phases/training-phase-1"
import TrainingPhase2 from "@/components/phases/training-phase-2"
import BenchmarkPhase from "@/components/phases/benchmark-phase"
import PredictionPhase from "@/components/phases/prediction-phase"
import ResultsPhase from "@/components/phases/results-phase"

const phases = [
  { id: "intro", name: "Welcome", icon: Gift, color: "bg-blue-500" },
  { id: "tutorial", name: "Tutorial", icon: Brain, color: "bg-green-500" },
  { id: "training1", name: "Practice", icon: Target, color: "bg-yellow-500" },
  { id: "training2", name: "Skills Test", icon: Clock, color: "bg-orange-500" },
  { id: "benchmark", name: "Benchmark", icon: Trophy, color: "bg-purple-500" },
  { id: "prediction", name: "Final Test", icon: Target, color: "bg-red-500" },
  { id: "results", name: "Results", icon: Gift, color: "bg-emerald-500" },
]

export default function KnapsackExperiment() {
  const [currentPhase, setCurrentPhase] = useState("intro")
  const [participantData, setParticipantData] = useState({
    totalPoints: 0,
    completedPhases: [],
    performance: {},
  })

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase)
  const progress = ((currentPhaseIndex + 1) / phases.length) * 100

  const nextPhase = () => {
    const nextIndex = currentPhaseIndex + 1
    if (nextIndex < phases.length) {
      setCurrentPhase(phases[nextIndex].id)
    }
  }

  const updateParticipantData = (data: any) => {
    setParticipantData((prev) => ({
      ...prev,
      ...data,
    }))
  }

  const renderPhase = () => {
    const phaseProps = {
      onNext: nextPhase,
      participantData,
      updateParticipantData,
    }

    switch (currentPhase) {
      case "intro":
        return <IntroPhase {...phaseProps} />
      case "tutorial":
        return <TutorialPhase {...phaseProps} />
      case "training1":
        return <TrainingPhase1 {...phaseProps} />
      case "training2":
        return <TrainingPhase2 {...phaseProps} />
      case "benchmark":
        return <BenchmarkPhase {...phaseProps} />
      case "prediction":
        return <PredictionPhase {...phaseProps} />
      case "results":
        return <ResultsPhase {...phaseProps} />
      default:
        return <IntroPhase {...phaseProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Knapsack Challenge</h1>
              </div>
              <Badge variant="outline" className="text-sm">
                Experiment ID: KS-2025-001
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Phase {currentPhaseIndex + 1} of {phases.length}
              </div>
              <div className="text-sm font-medium text-blue-600">{participantData.totalPoints} points</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{phases[currentPhaseIndex]?.name}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Phase indicators */}
          <div className="flex justify-between mt-4">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              const isActive = index === currentPhaseIndex
              const isCompleted = index < currentPhaseIndex

              return (
                <div key={phase.id} className="flex flex-col items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium
                    ${isActive ? phase.color : isCompleted ? "bg-green-500" : "bg-gray-300"}
                    transition-colors duration-200
                  `}
                  >
                    {isCompleted ? <Trophy className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`
                    text-xs mt-1 text-center
                    ${isActive ? "text-gray-900 font-medium" : "text-gray-500"}
                  `}
                  >
                    {phase.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
