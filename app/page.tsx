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
import StrategyPhase from "@/components/phases/strategy-phase"
import PredictionPhase from "@/components/phases/prediction-phase"
import ResultsPhase from "@/components/phases/results-phase"

const phases = [
  { id: "intro", name: "Welcome", icon: Gift, color: "bg-blue-500" },
  { id: "tutorial", name: "Tutorial", icon: Brain, color: "bg-green-500" },
  { id: "training1", name: "Practice", icon: Target, color: "bg-yellow-500" },
  { id: "training2", name: "Skills Test", icon: Clock, color: "bg-orange-500" },
  { id: "benchmark", name: "Benchmark", icon: Trophy, color: "bg-purple-500" },
  { id: "strategy", name: "Strategy", icon: Brain, color: "bg-indigo-500" },
  { id: "prediction", name: "Final Test", icon: Target, color: "bg-red-500" },
  { id: "results", name: "Results", icon: Gift, color: "bg-emerald-500" },
]

export default function KnapsackExperiment() {
  const [currentPhase, setCurrentPhase] = useState("intro")
  const [participantData, setParticipantData] = useState({
    totalScore: 0,
    completedPhases: [],
    performance: {},
    benchmark: null,
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
      case "strategy":
        return <StrategyPhase {...phaseProps} benchmarkData={participantData.benchmark || {}} />
      case "prediction":
        return <PredictionPhase {...phaseProps} />
      case "results":
        return <ResultsPhase {...phaseProps} />
      default:
        return <IntroPhase {...phaseProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Knapsack Study</h1>
                  <p className="text-sm text-gray-600">Interactive Problem Solving</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm bg-blue-50 border-blue-200 text-blue-700">
                Study ID: KS-2025-001
              </Badge>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-lg font-bold text-gray-900">
                  {currentPhaseIndex + 1} / {phases.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Score</div>
                <div className="text-lg font-bold text-blue-600">{participantData.totalScore}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Section */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-gray-900">{phases[currentPhaseIndex]?.name}</span>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3 bg-gray-200" />
          </div>

          {/* Phase indicators */}
          <div className="flex justify-between mt-6">
            {phases.map((phase, index) => {
              const Icon = phase.icon
              const isActive = index === currentPhaseIndex
              const isCompleted = index < currentPhaseIndex

              return (
                <motion.div 
                  key={phase.id} 
                  className="flex flex-col items-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300
                    ${isActive 
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-blue-200" 
                      : isCompleted 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                        : "bg-gray-300"
                    }
                  `}
                  >
                    {isCompleted ? <Trophy className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span
                    className={`
                    text-xs mt-2 text-center font-medium px-2 py-1 rounded-full
                    ${isActive 
                      ? "text-blue-900 bg-blue-100" 
                      : isCompleted 
                        ? "text-green-900 bg-green-100"
                        : "text-gray-600"
                    }
                  `}
                  >
                    {phase.name}
                  </span>
                </motion.div>
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
