"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import KnapsackQuestion from "@/components/knapsack-question"
import { getOrGenerateQuestions } from "@/lib/api"
import { createPhaseQuestions } from "@/lib/question-utils"
import { generateQuestionSet } from "@/lib/knapsack-generator"
import type { Question } from "@/lib/knapsack-generator"

interface TrainingPhase1Props {
  onNext: () => void
  participantData: any
  updateParticipantData: (data: any) => void
}

// Questions will be loaded dynamically from the backend/generator

export default function TrainingPhase1({ onNext, updateParticipantData }: TrainingPhase1Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Array<{ questionId: number; selected: number[]; correct: boolean }>>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<{ selected: number[]; correct: boolean } | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [wantMorePractice, setWantMorePractice] = useState<boolean | null>(null)
  const [isExtraPractice, setIsExtraPractice] = useState(false)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [questionLoadError, setQuestionLoadError] = useState<string | null>(null)

  // 🔑 Load participantId from localStorage once
  const [pid, setPid] = useState<string | null>(null)
  useEffect(() => {
    console.log("[Practice] Loading participant ID from localStorage")
    try {
      const stored = localStorage.getItem("participantId")
      console.log("[Practice] Stored participant ID:", stored)
      setPid(stored)
      if (!stored) {
        console.warn("[Practice] No participantId in localStorage. Did registration run on page load?")
      } else {
        console.log("[Practice] Set participant ID to:", stored)
      }
    } catch (e) {
      console.error("[Practice] Failed to read participantId from localStorage", e)
    }
  }, [])

  // 🔄 Load questions dynamically when participant ID is available
  useEffect(() => {
    console.log("[Practice] useEffect triggered, pid:", pid)
    if (!pid) {
      console.log("[Practice] No participant ID available, skipping question loading")
      return
    }

    const loadQuestions = async () => {
      console.log("[Practice] loadQuestions function called")
      
      // Set a timeout to force local generation if loading takes too long
      const timeoutId = setTimeout(() => {
        console.log("[Practice] Question loading timeout - trying local generation")
        try {
          const localQuestions = createPhaseQuestions('training', 6)
          console.log("[Practice] Timeout fallback - generated local questions:", localQuestions)
          if (localQuestions && localQuestions.length > 0) {
            setAllQuestions(localQuestions)
            setIsLoadingQuestions(false)
            setQuestionLoadError(null)
          } else {
            throw new Error("Timeout fallback returned empty questions")
          }
        } catch (error) {
          console.error("[Practice] Timeout fallback also failed:", error)
          // Try simple generation as last resort
          try {
            const simpleQuestions = generateQuestionSet(6, {
              numItems: 3,
              minWeight: 2,
              maxWeight: 8,
              minReward: 6,
              maxReward: 24,
              difficultyLevel: 'easy',
              ensureUniqueSolution: false
            })
            if (simpleQuestions && simpleQuestions.length > 0) {
              setAllQuestions(simpleQuestions)
              setIsLoadingQuestions(false)
              setQuestionLoadError(null)
            } else {
              throw new Error("Simple timeout fallback also failed")
            }
          } catch (simpleError) {
            console.error("[Practice] Simple timeout fallback also failed:", simpleError)
            setQuestionLoadError("Question generation timed out. Please refresh the page to try again.")
            setIsLoadingQuestions(false)
          }
        }
      }, 10000) // 10 second timeout
      
      try {
        console.log("[Practice] Setting isLoadingQuestions to true")
        setIsLoadingQuestions(true)
        setQuestionLoadError(null)
        
        console.log("[Practice] Loading dynamic questions for participant:", pid)
        
        // Load initial training questions (6 questions, easy difficulty)
        const questions = await getOrGenerateQuestions({
          participantId: pid,
          phase: 'practice', // Use 'practice' phase for training-phase-1
          count: 6
        })
        
        clearTimeout(timeoutId) // Clear timeout if successful
        
        console.log("[Practice] Loaded questions:", questions)
        setAllQuestions(questions)
        
      } catch (error) {
        clearTimeout(timeoutId) // Clear timeout on error
        console.error("[Practice] Failed to load questions from backend:", error)
        setQuestionLoadError(error instanceof Error ? error.message : 'Failed to load questions from backend')
        
        // Fallback to local question generation
        console.log("[Practice] Falling back to local question generation")
        try {
          console.log("[Practice] Calling createPhaseQuestions('training', 6)")
          const localQuestions = createPhaseQuestions('training', 6)
          console.log("[Practice] Generated local questions:", localQuestions)
          console.log("[Practice] Number of questions generated:", localQuestions.length)
          
          if (localQuestions && localQuestions.length > 0) {
            setAllQuestions(localQuestions)
            setQuestionLoadError(null) // Clear error since we have fallback questions
            console.log("[Practice] Successfully set local questions")
          } else {
            throw new Error("Local generation returned empty questions array")
          }
        } catch (localError) {
          console.error("[Practice] Local question generation also failed:", localError)
          console.error("[Practice] Local error details:", localError)
          // Try a simpler approach with direct question generation
          try {
            console.log("[Practice] Trying simpler question generation approach")
            const simpleQuestions = generateQuestionSet(6, {
              numItems: 3,
              minWeight: 2,
              maxWeight: 8,
              minReward: 6,
              maxReward: 24,
              difficultyLevel: 'easy',
              ensureUniqueSolution: false
            })
            console.log("[Practice] Simple questions generated:", simpleQuestions)
            if (simpleQuestions && simpleQuestions.length > 0) {
              setAllQuestions(simpleQuestions)
              setQuestionLoadError(null)
              console.log("[Practice] Successfully set simple questions")
            } else {
              throw new Error("Simple generation also returned empty array")
            }
          } catch (simpleError) {
            console.error("[Practice] Simple generation also failed:", simpleError)
            setQuestionLoadError("Failed to generate questions. Please refresh the page to try again.")
          }
        }
        
      } finally {
        clearTimeout(timeoutId) // Clear timeout in finally block
        console.log("[Practice] Finally block executed - setting isLoadingQuestions to false")
        setIsLoadingQuestions(false)
      }
    }

    loadQuestions()
  }, [pid])

  // API base (configure in .env.local as NEXT_PUBLIC_API_BASE=http://localhost:8787)
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_BASE || "https://knapsack-expirement.onrender.com", [])

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

  const startExtraPractice = async () => {
    if (!pid) return
    
    try {
      setIsLoadingQuestions(true)
      setWantMorePractice(true)
      setIsExtraPractice(true)
      
      // Generate additional questions for extra practice
      const extraQuestions = await getOrGenerateQuestions({
        participantId: pid,
        phase: 'practice-extra', // Different phase for extra practice
        count: 4 // 4 additional questions
      })
      
      // Combine original questions with extra ones
      const combinedQuestions = [...allQuestions, ...extraQuestions]
      setAllQuestions(combinedQuestions)
      setCurrentQuestion(allQuestions.length) // Start from first extra question
      setWantMorePractice(null) // Back to questions
      
    } catch (error) {
      console.error("[Practice] Failed to load extra questions:", error)
      // If extra question generation fails, just continue with existing questions
      setWantMorePractice(null)
    } finally {
      setIsLoadingQuestions(false)
    }
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
      // If backend is not available, still proceed to next phase with local data
      console.log("[Practice] Backend unavailable, proceeding with local data only")
      updateParticipantData({ training1: payload.data })
      onNext()
    }
  }

  // UI

  // Loading state while questions are being generated/loaded
  if (isLoadingQuestions) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Zap className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Generating Dynamic Questions</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Creating personalized knapsack problems using our sophisticated academic algorithm...
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>This may take a few moments</span>
              </div>
              {questionLoadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  Error: {questionLoadError}
                  <br />
                  <span className="text-xs">Falling back to backup questions...</span>
                </div>
              )}
              <div className="mt-4">
                <Button 
                  onClick={() => {
                    console.log("[Practice] Manual test - generating local questions")
                    try {
                      const testQuestions = createPhaseQuestions('training', 6)
                      console.log("[Practice] Test questions generated:", testQuestions)
                      if (testQuestions && testQuestions.length > 0) {
                        setAllQuestions(testQuestions)
                        setIsLoadingQuestions(false)
                        setQuestionLoadError(null)
                        console.log("[Practice] Test questions set successfully")
                      } else {
                        throw new Error("Test generation returned empty array")
                      }
                    } catch (error) {
                      console.error("[Practice] Test generation failed:", error)
                      // Try simple generation
                      try {
                        const simpleQuestions = generateQuestionSet(6, {
                          numItems: 3,
                          minWeight: 2,
                          maxWeight: 8,
                          minReward: 6,
                          maxReward: 24,
                          difficultyLevel: 'easy',
                          ensureUniqueSolution: false
                        })
                        if (simpleQuestions && simpleQuestions.length > 0) {
                          setAllQuestions(simpleQuestions)
                          setIsLoadingQuestions(false)
                          setQuestionLoadError(null)
                          console.log("[Practice] Simple test questions set successfully")
                        } else {
                          setQuestionLoadError("Test generation failed - no questions generated")
                        }
                      } catch (simpleError) {
                        console.error("[Practice] Simple test generation also failed:", simpleError)
                        setQuestionLoadError("Test generation failed - please check console for details")
                      }
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test Local Generation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showInstructions) {
    return (
      <div className="max-w-7xl mx-auto">
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
                  In this section, you can practice with dynamically generated questions. You will see a total of
                  <strong> {allQuestions.length} questions</strong> to help you get familiar with the knapsack puzzle.
                </p>

                {questionLoadError && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> We encountered an issue generating questions dynamically, so we're using backup questions for this session.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">🧠 Dynamic Generation</h4>
                    <ul className="text-base space-y-2">
                      <li>• Questions are generated using academic algorithms</li>
                      <li>• Difficulty controlled by dominance relationships</li>
                      <li>• Each question has a unique optimal solution</li>
                      <li>• No time constraint - take your time to learn!</li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">🎯 How to Play</h4>
                    <ul className="text-base space-y-2">
                      <li>• Click once to select a ball, click again to deselect</li>
                      <li>• Maximize reward while staying within capacity</li>
                      <li>• Click "confirm answer" to lock in your selection</li>
                      <li>• See solutions and explanations after each answer</li>
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
      <div className="max-w-7xl mx-auto">
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

  // Guard: Don't render if no questions loaded
  if (!allQuestions.length) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">No questions available</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = allQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / allQuestions.length) * 100

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Practice Question {currentQuestion + 1} of {allQuestions.length}
              {isExtraPractice && currentQuestion >= 6 && " (Extra Practice)"}
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

            <div className="text-center space-y-3">
              <Button onClick={nextQuestion} size="lg">
                {currentQuestion === allQuestions.length - 1 ? "Complete Practice" : "Next Question"}
              </Button>
              
              {isExtraPractice && currentQuestion >= 6 && (
                <div>
                  <Button onClick={handleComplete} variant="outline" size="lg" className="ml-4">
                    End Extra Practice & Continue to Test 1
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
