"use client"

import { useEffect, useState } from "react"
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

// Removed registerParticipant function - only Prolific participants allowed

async function checkParticipantExists(prolificPid: string): Promise<{exists: boolean, completed: boolean, participantId?: string}> {
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? "https://knapsack-expirement.onrender.com"
    : "http://localhost:8787"
    
  try {
    const res = await fetch(`${API_BASE}/api/v1/check-participant/${prolificPid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!res.ok) {
      return { exists: false, completed: false }
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error("[Check Participant] API error:", error)
    return { exists: false, completed: false }
  }
}

async function registerParticipantWithProlific(
  prolificPid: string, 
  studyId: string, 
  sessionId: string
): Promise<string> {
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? "https://knapsack-expirement.onrender.com"
    : "http://localhost:8787"
    
  const res = await fetch(`${API_BASE}/api/v1/register-prolific`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prolificPid,
      studyId,
      sessionId
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    
    if (res.status === 403 && errorData.completed) {
      throw new Error("Participant has already completed the study")
    }
    
    throw new Error("Failed to register Prolific participant")
  }

  const data = await res.json()
  return data.participantId
}

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
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [participantData, setParticipantData] = useState({
    totalScore: 0,
    completedPhases: [],
    performance: {},
    benchmark: null,
  })
  const [prolificParams, setProlificParams] = useState<{
    prolificPid: string | null;
    studyId: string | null;
    sessionId: string | null;
  }>({
    prolificPid: null,
    studyId: null,
    sessionId: null,
  })
  const [accessAllowed, setAccessAllowed] = useState(false)
  const [showCompletedMessage, setShowCompletedMessage] = useState(false)

  useEffect(() => {
    // Check for Prolific parameters - REQUIRED for access
    const urlParams = new URLSearchParams(window.location.search)
    const prolificPid = urlParams.get('PROLIFIC_PID')
    const studyId = urlParams.get('STUDY_ID') 
    const sessionId = urlParams.get('SESSION_ID')
 
    // Set Prolific parameters
    setProlificParams({
      prolificPid,
      studyId, 
      sessionId,
    })

    // SECURITY: Only allow access with valid Prolific parameters
    if (!prolificPid || !studyId || !sessionId) {
      console.error("[Security] Access denied: Missing required Prolific parameters")
      setAccessAllowed(false)
      return
    }

    // Check if participant has already completed the study
    console.log("[Registration] Checking if participant already exists:", prolificPid)
    checkParticipantExists(prolificPid!)
      .then((participantStatus) => {
        if (participantStatus.exists && participantStatus.completed) {
          console.log("[Registration] Participant has already completed the study")
          setAccessAllowed(false)
          setShowCompletedMessage(true)
          return
        }

        if (participantStatus.exists && !participantStatus.completed && participantStatus.participantId) {
          console.log("[Registration] Found existing participant, allowing continuation")
          setParticipantId(participantStatus.participantId)
          localStorage.setItem('participantId', participantStatus.participantId)
          localStorage.setItem('prolificPid', prolificPid!)
          setAccessAllowed(true)
          return
        }

        // Check local storage as fallback
        const existingParticipantId = localStorage.getItem('participantId')
        const storedProlificPid = localStorage.getItem('prolificPid')
        
        if (existingParticipantId && storedProlificPid === prolificPid) {
          console.log("[Registration] Found existing participant ID in localStorage:", prolificPid)
          setParticipantId(existingParticipantId)
          setAccessAllowed(true)
          return
        }

        // Register new participant
        console.log("[Registration] Registering new participant:", prolificPid)
        return registerParticipantWithProlific(prolificPid!, studyId!, sessionId!)
      })
      .then((id) => {
        if (id) {
          console.log("[Registration] Setting participant ID:", id)
          setParticipantId(id)
          localStorage.setItem('participantId', id)
          localStorage.setItem('prolificPid', prolificPid!)
          console.log("[Registration] Saved participant ID to localStorage")
          setAccessAllowed(true)
        }
      })
      .catch((error) => {
        console.error("[Registration] Failed to register participant:", error)
        
        // Check if error is due to participant already completing the study
        if (error.message.includes('already completed')) {
          setShowCompletedMessage(true)
        } else {
          setAccessAllowed(false)
        }
        // No fallback - access denied if registration fails
      })
  }, [])
  

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase)
  const progress = ((currentPhaseIndex + 1) / phases.length) * 100

  const nextPhase = () => {
    const nextIndex = currentPhaseIndex + 1
    if (nextIndex < phases.length) {
      setCurrentPhase(phases[nextIndex].id)
    } else {
      // Experiment completed - redirect to Prolific
      completeProlificStudy()
    }
  }

  const completeProlificStudy = async () => {
    if (prolificParams.prolificPid && participantId) {
      // Mark participant as completed in the backend
      try {
        const API_BASE = process.env.NODE_ENV === 'production' 
          ? "https://knapsack-expirement.onrender.com"
          : "http://localhost:8787"
          
        await fetch(`${API_BASE}/api/v1/complete-participant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            participantId,
            prolificPid: prolificParams.prolificPid,
            completedAt: new Date().toISOString()
          })
        })
        
        console.log("[Completion] Marked participant as completed")
      } catch (error) {
        console.error("[Completion] Failed to mark participant as completed:", error)
      }
      
      // Redirect to Prolific completion page with actual completion code
      const completionUrl = `https://app.prolific.co/submissions/complete?cc=KNAPSACK2024` // Use your actual completion code from Prolific dashboard
      window.location.href = completionUrl
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

  // Show completed message if participant already finished
  if (showCompletedMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Study Already Completed</h1>
            <p className="text-lg text-gray-600 mb-6">
              You have already completed this study. Each participant can only take the study once.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium">
                ✓ Your previous submission has been recorded and you should have received completion confirmation.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Thank you for your participation! If you have any questions, please contact the researcher.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Access restriction check
  if (!accessAllowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-lg text-gray-600 mb-6">
              This study can only be accessed through Prolific. Please use the link provided in your Prolific study invitation.
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact the researcher.
            </p>
          </div>
        </div>
      </div>
    )
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
              {participantId && (
                <Badge variant="outline" className="text-sm bg-blue-50 border-blue-200 text-blue-700">
                  Participant ID: {participantId}
                </Badge>
              )}
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