"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye, 
  Lock, 
  Unlock,
  RefreshCw,
  Download
} from 'lucide-react'

interface AdminDashboardProps {
  onClose?: () => void
}

interface AnalyticsData {
  overview: {
    totalParticipants: number
    completedParticipants: number
    avgStudyTime: number
    totalStudyTime: number
  }
  timeAnalytics: {
    avgTimePerSection: { [key: string]: number }
    avgTimePerQuestion: { [key: string]: number }
    participantTimeDistribution: number[]
    sectionCompletionRates: { [key: string]: number }
  }
  participantDetails: Array<{
    participantId: string
    prolificPid: string
    registeredAt: string
    completedAt?: string
    totalStudyTime: number
    sectionsCompleted: number
    testResults: any
    timeBreakdown: Array<{
      sectionName: string
      timeSpent: number
      questionCount: number
      avgTimePerQuestion: number
    }>
  }>
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [participantDetails, setParticipantDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? "https://knapsack-expirement.onrender.com"
    : "http://localhost:8787"

  const authenticate = async () => {
    if (!adminKey.trim()) {
      setError('Please enter admin key')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/analytics?adminKey=${encodeURIComponent(adminKey)}`)
      
      if (response.status === 401) {
        setError('Invalid admin key')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to authenticate')
      }

      const data = await response.json()
      setAnalytics(data)
      setIsAuthenticated(true)
    } catch (err) {
      setError('Authentication failed')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (!isAuthenticated) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/analytics?adminKey=${encodeURIComponent(adminKey)}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/export-prolific-data?adminKey=${encodeURIComponent(adminKey)}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `knapsack-study-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const viewParticipantDetails = async (participantId: string) => {
    setLoadingDetails(true)
    setSelectedParticipant(participantId)
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/participant/${participantId}?adminKey=${encodeURIComponent(adminKey)}`)
      if (response.ok) {
        const data = await response.json()
        setParticipantDetails(data)
      } else {
        console.error('Failed to fetch participant details')
      }
    } catch (err) {
      console.error('Error fetching participant details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Access</CardTitle>
            <p className="text-gray-600">Enter admin key to access analytics dashboard</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Admin Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                className="text-center"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <Button 
              onClick={authenticate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Access Dashboard
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancel
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knapsack Study Analytics</h1>
            <p className="text-gray-600">Real-time participant performance and time tracking</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={refreshData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>
        </div>

        {analytics && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Participants</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalParticipants}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.overview.completedParticipants}</p>
                      <p className="text-xs text-gray-500">
                        {((analytics.overview.completedParticipants / analytics.overview.totalParticipants) * 100).toFixed(1)}% completion rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Study Time</p>
                      <p className="text-2xl font-bold text-gray-900">{formatTime(analytics.overview.avgStudyTime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                      <p className="text-2xl font-bold text-gray-900">{formatTime(analytics.overview.totalStudyTime)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Time Analytics */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Average Time Per Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.timeAnalytics.avgTimePerSection).map(([section, time]) => (
                    <div key={section} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-3">{section}</Badge>
                        <span className="text-sm text-gray-600">{formatTime(time)}</span>
                      </div>
                      <Progress 
                        value={(time / Math.max(...Object.values(analytics.timeAnalytics.avgTimePerSection))) * 100} 
                        className="w-32"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Participant Details */}
            <Card>
              <CardHeader>
                <CardTitle>Participant Details</CardTitle>
                <p className="text-sm text-gray-600">Click on a participant to view detailed analytics</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Prolific ID</th>
                        <th className="text-left p-2">Registered</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Study Time</th>
                        <th className="text-left p-2">Sections</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.participantDetails.map((participant) => (
                        <tr key={participant.participantId} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">{participant.prolificPid}</td>
                          <td className="p-2">{formatDate(participant.registeredAt)}</td>
                          <td className="p-2">
                            <Badge variant={participant.completedAt ? "default" : "secondary"}>
                              {participant.completedAt ? "Completed" : "In Progress"}
                            </Badge>
                          </td>
                          <td className="p-2">{formatTime(participant.totalStudyTime)}</td>
                          <td className="p-2">{participant.sectionsCompleted}</td>
                          <td className="p-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewParticipantDetails(participant.participantId)}
                              disabled={loadingDetails}
                            >
                              {loadingDetails && selectedParticipant === participant.participantId ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Eye className="h-3 w-3 mr-1" />
                              )}
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Participant View */}
            {participantDetails && (
              <Card className="mt-8">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Detailed Participant Analysis</CardTitle>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setParticipantDetails(null)
                        setSelectedParticipant(null)
                      }}
                    >
                      Close Details
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Prolific ID: <code className="bg-gray-100 px-1 rounded">{participantDetails.participantInfo?.prolificPid}</code>
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    
                    {/* Participant Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Participant Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Participant ID:</span>
                          <p className="font-mono text-xs">{participantDetails.participantInfo?.participantId}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Study ID:</span>
                          <p className="font-mono text-xs">{participantDetails.participantInfo?.studyId}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Registered:</span>
                          <p>{formatDate(participantDetails.participantInfo?.registeredAt)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Completed:</span>
                          <p>{participantDetails.participantInfo?.completedAt ? formatDate(participantDetails.participantInfo.completedAt) : 'In Progress'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Time Analysis */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Time Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Total Time</p>
                              <p className="text-xl font-bold">{formatTime(participantDetails.detailedTimeAnalysis?.totalTimeSpent || 0)}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Session Duration</p>
                              <p className="text-xl font-bold">
                                {participantDetails.detailedTimeAnalysis?.sessionDuration 
                                  ? formatTime(participantDetails.detailedTimeAnalysis.sessionDuration)
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Sections Completed</p>
                              <p className="text-xl font-bold">{participantDetails.detailedTimeAnalysis?.sectionBreakdown?.length || 0}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Test Results */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Test Results & Answers</h3>
                      <div className="space-y-4">
                        {Object.entries(participantDetails.testResults || {}).map(([testName, testData]: [string, any]) => (
                          testData && (
                            <Card key={testName}>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base capitalize">{testName} Test</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <Badge variant={testData.completed ? "default" : "secondary"} className="ml-2">
                                      {testData.completed ? "Completed" : "Incomplete"}
                                    </Badge>
                                  </div>
                                  {testData.correctAnswers !== undefined && (
                                    <div>
                                      <span className="font-medium text-gray-600">Correct:</span>
                                      <p className="font-semibold">{testData.correctAnswers}/{testData.totalQuestions}</p>
                                    </div>
                                  )}
                                  {testData.accuracy !== undefined && (
                                    <div>
                                      <span className="font-medium text-gray-600">Accuracy:</span>
                                      <p className="font-semibold">{(testData.accuracy * 100).toFixed(1)}%</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Individual Answers */}
                                {testData.answers && testData.answers.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Individual Answers:</h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b">
                                            <th className="text-left p-1">Q#</th>
                                            <th className="text-left p-1">Selected</th>
                                            <th className="text-left p-1">Correct</th>
                                            <th className="text-left p-1">Confirmed</th>
                                            <th className="text-left p-1">Time Spent</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {testData.answers.map((answer: any, idx: number) => (
                                            <tr key={idx} className="border-b">
                                              <td className="p-1">{answer.questionId || idx + 1}</td>
                                              <td className="p-1">
                                                {Array.isArray(answer.selected) 
                                                  ? `[${answer.selected.join(', ')}]`
                                                  : answer.selected || 'N/A'
                                                }
                                              </td>
                                              <td className="p-1">
                                                <Badge variant={answer.correct ? "default" : "destructive"} className="text-xs">
                                                  {answer.correct ? "✓" : "✗"}
                                                </Badge>
                                              </td>
                                              <td className="p-1">
                                                <Badge variant={answer.confirmed ? "default" : "secondary"} className="text-xs">
                                                  {answer.confirmed ? "Yes" : "No"}
                                                </Badge>
                                              </td>
                                              <td className="p-1">
                                                {answer.timeSpent ? formatTime(answer.timeSpent) : 'N/A'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}

                                {/* Question Times Breakdown */}
                                {testData.questionTimes && testData.questionTimes.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium mb-2">Question Time Breakdown:</h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b">
                                            <th className="text-left p-1">Question</th>
                                            <th className="text-left p-1">Time Spent</th>
                                            <th className="text-left p-1">Start Time</th>
                                            <th className="text-left p-1">End Time</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {testData.questionTimes.map((qTime: any, idx: number) => (
                                            <tr key={idx} className="border-b">
                                              <td className="p-1">Q{qTime.questionId}</td>
                                              <td className="p-1">{formatTime(qTime.timeSpent || 0)}</td>
                                              <td className="p-1">{qTime.startTime ? new Date(qTime.startTime).toLocaleTimeString() : 'N/A'}</td>
                                              <td className="p-1">{qTime.endTime ? new Date(qTime.endTime).toLocaleTimeString() : 'N/A'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        ))}
                      </div>
                    </div>

                    {/* Section Time Breakdown */}
                    {participantDetails.detailedTimeAnalysis?.sectionBreakdown && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Section Time Breakdown</h3>
                        <div className="space-y-4">
                          {participantDetails.detailedTimeAnalysis.sectionBreakdown.map((section: any, idx: number) => (
                            <Card key={idx}>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base capitalize">{section.sectionName}</CardTitle>
                                <p className="text-sm text-gray-600">
                                  Time Spent: <strong>{formatTime(section.timeSpent || 0)}</strong>
                                </p>
                              </CardHeader>
                              <CardContent>
                                {section.questionAnalysis && section.questionAnalysis.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Question-Level Timing:</h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b">
                                            <th className="text-left p-1">Question</th>
                                            <th className="text-left p-1">Time Spent</th>
                                            <th className="text-left p-1">Interactions</th>
                                            <th className="text-left p-1">Start Time</th>
                                            <th className="text-left p-1">End Time</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {section.questionAnalysis.map((question: any, qIdx: number) => (
                                            <tr key={qIdx} className="border-b">
                                              <td className="p-1">Q{question.questionId}</td>
                                              <td className="p-1">{formatTime(question.timeSpent || 0)}</td>
                                              <td className="p-1">{question.interactionCount}</td>
                                              <td className="p-1">{question.startTime ? formatDate(question.startTime) : 'N/A'}</td>
                                              <td className="p-1">{question.endTime ? formatDate(question.endTime) : 'N/A'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
