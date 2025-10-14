import express from 'express'
import z from 'zod'
import crypto from 'crypto'
import { ParticipantModel } from '../models/Participant'

export const router = express.Router()

// Zod schemas
const TestPhase = z.enum(['practice', 'skill', 'benchmark', 'strategy', 'final'])

const ResultSchema = z.object({
  participantId: z.string().min(1),
  score: z.number(),
  passed: z.boolean(),
  feedback: z.string().optional(),
})

// REGISTER a new participant
router.post('/api/v1/register', async (req, res) => {
  const id = crypto.randomUUID()

  const newDoc = await ParticipantModel.create({
    participantId: id,
    createdAt: new Date(),
  })

  return res.status(201).json({ participantId: newDoc.participantId })
})

// CHECK if participant exists and completion status
router.get('/api/v1/check-participant/:prolificPid', async (req, res) => {
  const { prolificPid } = req.params
  
  if (!prolificPid) {
    return res.status(400).json({ error: 'Missing prolificPid parameter' })
  }

  try {
    const participant = await ParticipantModel.findOne({ 
      'prolificData.prolificPid': prolificPid 
    })
    
    if (!participant) {
      return res.status(200).json({ 
        exists: false, 
        completed: false 
      })
    }
    
    // Check if participant has completed all required phases
    const requiredPhases = ['practice', 'skill', 'benchmark', 'strategy', 'final'] as const
    const completedPhases = requiredPhases.filter(phase => 
      (participant.tests as any)?.[phase]?.completed === true
    )
    
    const isFullyCompleted = completedPhases.length === requiredPhases.length
    
    // Also check for explicit completion flag
    const isMarkedCompleted = !!participant.prolificData?.completedAt
    
    // Participant is considered completed if they've finished all phases OR been explicitly marked
    const isCompleted = isFullyCompleted || isMarkedCompleted
    
    return res.status(200).json({ 
      exists: true, 
      completed: isCompleted,
      participantId: participant.participantId,
      completedPhases: completedPhases.length,
      totalPhases: requiredPhases.length,
      allPhasesComplete: isFullyCompleted,
      markedComplete: isMarkedCompleted
    })
    
  } catch (err) {
    console.error('[CHECK PARTICIPANT ERROR]', err)
    return res.status(500).json({ error: 'Failed to check participant' })
  }
})

// MARK participant as completed
router.post('/api/v1/complete-participant', async (req, res) => {
  const { participantId, prolificPid, completedAt } = req.body
  
  if (!participantId || !prolificPid) {
    return res.status(400).json({ 
      error: 'Missing required fields: participantId, prolificPid' 
    })
  }

  try {
    const updated = await ParticipantModel.findOneAndUpdate(
      { 
        participantId,
        'prolificData.prolificPid': prolificPid 
      },
      { 
        $set: { 
          'prolificData.completedAt': completedAt || new Date().toISOString()
        } 
      },
      { new: true }
    )
    
    if (!updated) {
      return res.status(404).json({ error: 'Participant not found' })
    }
    
    console.log(`[Backend] Marked participant as completed: ${prolificPid}`)
    return res.status(200).json({ 
      success: true, 
      completedAt: updated.prolificData?.completedAt 
    })
    
  } catch (err) {
    console.error('[COMPLETE PARTICIPANT ERROR]', err)
    return res.status(500).json({ error: 'Failed to mark participant as completed' })
  }
})

// REGISTER a Prolific participant
router.post('/api/v1/register-prolific', async (req, res) => {
  const { prolificPid, studyId, sessionId } = req.body
  
  // Validate required parameters
  if (!prolificPid || !studyId || !sessionId) {
    return res.status(400).json({ 
      error: 'Missing required Prolific parameters: prolificPid, studyId, sessionId' 
    })
  }

  // Validate Prolific ID format (should be a valid UUID-like string)
  const prolificIdPattern = /^[a-zA-Z0-9]{8,}$/
  
  if (!prolificIdPattern.test(prolificPid)) {
    return res.status(400).json({ 
      error: 'Invalid Prolific participant ID format' 
    })
  }

  // Check if this Prolific participant already exists
  const existingParticipant = await ParticipantModel.findOne({ 
    'prolificData.prolificPid': prolificPid 
  })
  
  if (existingParticipant) {
    // Check if participant has already completed the study
    if (existingParticipant.prolificData?.completedAt) {
      console.log(`[Backend] Participant already completed study: ${prolificPid}`)
      return res.status(403).json({ 
        error: 'Participant has already completed the study',
        completed: true
      })
    }
    
    console.log(`[Backend] Returning existing participant for Prolific ID: ${prolificPid}`)
    return res.status(200).json({ 
      participantId: existingParticipant.participantId,
      message: 'Returning existing participant',
      isExisting: true
    })
  }

  // Create new participant with Prolific data
  const id = crypto.randomUUID()
  
  const newDoc = await ParticipantModel.create({
    participantId: id,
    prolificData: {
      prolificPid,
      studyId,
      sessionId,
      registeredAt: new Date()
    },
    createdAt: new Date(),
  })

  console.log(`[Backend] Created new participant for Prolific ID: ${prolificPid}, Participant ID: ${id}`)
  return res.status(201).json({ 
    participantId: newDoc.participantId,
    message: 'New participant created',
    isExisting: false
  })
})

// INGEST phase data (practice, skill, etc)
router.post('/api/v1/ingest-phase', async (req, res) => {
  const { participantId, phase, data } = req.body

  if (!participantId || !phase || !data) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const updateFields: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      updateFields[`tests.${phase}.${key}`] = value
    }

    const updated = await ParticipantModel.findOneAndUpdate(
        { participantId },
        {
          $set: {
            [`tests.${phase}.completed`]: data.completed,
            [`tests.${phase}.correctAnswers`]: data.correctAnswers,
            [`tests.${phase}.totalQuestions`]: data.totalQuestions,
            [`tests.${phase}.accuracy`]: data.accuracy,
            [`tests.${phase}.answers`]: data.answers,
            [`tests.${phase}.timeUsed`]: data.timeUsed,
            [`tests.${phase}.questionTimes`]: data.questionTimes || []
          }
        },
        { upsert: true, new: true }
      )
      
      if (!updated) return res.status(404).json({ error: "Participant not found" })
      
      return res.status(200).json({ success: true, updated })
      
  } catch (err) {
    console.error('[INGEST ERROR]', err)
    return res.status(500).json({ error: 'Failed to ingest phase data' })
  }
})

// SET FINAL RESULT
router.post('/api/v1/set-result', async (req, res) => {
  const parsed = ResultSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { participantId, score, passed, feedback } = parsed.data

  const doc = await ParticipantModel.findOneAndUpdate(
    { participantId },
    { $set: { result: { score, passed, feedback } } },
    { new: true }
  )

  if (!doc) return res.status(404).json({ error: 'Participant not found' })

  res.status(200).json({ ok: true, result: doc.result })
})

// EXPORT Prolific data for researchers
router.get('/api/v1/export-prolific-data', async (req, res) => {
  try {
    const participants = await ParticipantModel.find({ 
      'prolificData.prolificPid': { $exists: true } 
    })
    
    const exportData = participants.map(p => ({
      participantId: p.participantId,
      prolificPid: p.prolificData?.prolificPid,
      studyId: p.prolificData?.studyId,
      sessionId: p.prolificData?.sessionId,
      registeredAt: p.prolificData?.registeredAt,
      completedAt: p.prolificData?.completedAt,
      createdAt: p.createdAt,
      tests: p.tests,
      result: p.result
    }))
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=prolific-study-data.json')
    res.status(200).json(exportData)
    
  } catch (err) {
    console.error('[EXPORT ERROR]', err)
    return res.status(500).json({ error: 'Failed to export data' })
  }
})

// LOG time tracking data
router.post('/api/v1/log-time', async (req, res) => {
  const { participantId, sectionName, questionId, timeData, interactionType } = req.body
  
  if (!participantId || !timeData) {
    return res.status(400).json({ error: 'Missing required fields: participantId, timeData' })
  }

  try {
    const participant = await ParticipantModel.findOne({ participantId })
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' })
    }

    // Initialize timeTracking if it doesn't exist
    if (!participant.timeTracking) {
      participant.timeTracking = {
        totalStudyTime: 0,
        sections: [] as any,
        sessionStart: new Date(),
        sessionEnd: null
      }
    }

    // Handle different types of time logging
    if (sectionName && !questionId) {
      // Section-level time tracking
      const existingSection = participant.timeTracking?.sections.find((s: any) => s.sectionName === sectionName)
      
      if (existingSection) {
        if (timeData.endTime) {
          existingSection.endTime = new Date(timeData.endTime)
          existingSection.timeSpent = new Date(timeData.endTime).getTime() - new Date(existingSection.startTime).getTime()
        }
      } else {
        participant.timeTracking?.sections.push({
          sectionName,
          startTime: new Date(timeData.startTime),
          endTime: timeData.endTime ? new Date(timeData.endTime) : null,
          timeSpent: timeData.timeSpent || 0,
          questionTimes: [] as any
        } as any)
      }
    } else if (sectionName && questionId) {
      // Question-level time tracking
      let section = participant.timeTracking?.sections.find((s: any) => s.sectionName === sectionName)
      
      if (!section) {
        const newSection = {
          sectionName,
          startTime: new Date(),
          endTime: null,
          timeSpent: 0,
          questionTimes: [] as any
        }
        participant.timeTracking?.sections.push(newSection as any)
        section = participant.timeTracking?.sections[participant.timeTracking.sections.length - 1]
      }

      const existingQuestion = section?.questionTimes.find((q: any) => q.questionId === questionId)
      
      if (existingQuestion) {
        if (timeData.endTime) {
          existingQuestion.endTime = new Date(timeData.endTime)
          existingQuestion.timeSpent = new Date(timeData.endTime).getTime() - new Date(existingQuestion.startTime).getTime()
        }
        
        // Add interaction if provided
        if (interactionType) {
          existingQuestion.interactions.push({
            type: interactionType,
            timestamp: new Date(),
            data: timeData.interactionData || {}
          })
        }
      } else {
        section?.questionTimes.push({
          questionId,
          startTime: new Date(timeData.startTime),
          endTime: timeData.endTime ? new Date(timeData.endTime) : null,
          timeSpent: timeData.timeSpent || 0,
          interactions: interactionType ? [{
            type: interactionType,
            timestamp: new Date(),
            data: timeData.interactionData || {}
          }] : []
        } as any)
      }
    }

    // Update total study time
    if (timeData.totalStudyTime && participant.timeTracking) {
      participant.timeTracking.totalStudyTime = timeData.totalStudyTime
    }

    await participant.save()
    
    return res.status(200).json({ 
      success: true, 
      message: 'Time data logged successfully' 
    })
    
  } catch (err) {
    console.error('[LOG TIME ERROR]', err)
    return res.status(500).json({ error: 'Failed to log time data' })
  }
})

// GET time analytics for a participant
router.get('/api/v1/participant-analytics/:participantId', async (req, res) => {
  const { participantId } = req.params
  
  try {
    const participant = await ParticipantModel.findOne({ participantId })
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' })
    }

    // Calculate analytics
    const analytics = {
      participantId,
      prolificPid: participant.prolificData?.prolificPid,
      totalStudyTime: participant.timeTracking?.totalStudyTime || 0,
      sessionDuration: participant.timeTracking?.sessionStart && participant.timeTracking?.sessionEnd 
        ? new Date(participant.timeTracking.sessionEnd).getTime() - new Date(participant.timeTracking.sessionStart).getTime()
        : null,
      sections: participant.timeTracking?.sections?.map(section => ({
        sectionName: section.sectionName,
        timeSpent: section.timeSpent,
        questionCount: section.questionTimes.length,
        avgTimePerQuestion: section.questionTimes.length > 0 
          ? section.questionTimes.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / section.questionTimes.length
          : 0,
        questions: section.questionTimes.map(q => ({
          questionId: q.questionId,
          timeSpent: q.timeSpent,
          interactionCount: q.interactions.length,
          interactions: q.interactions
        }))
      })) || [],
      testResults: participant.tests
    }
    
    return res.status(200).json(analytics)
    
  } catch (err) {
    console.error('[PARTICIPANT ANALYTICS ERROR]', err)
    return res.status(500).json({ error: 'Failed to get participant analytics' })
  }
})

// GET study statistics
router.get('/api/v1/study-stats', async (req, res) => {
  try {
    const totalParticipants = await ParticipantModel.countDocuments({ 
      'prolificData.prolificPid': { $exists: true } 
    })
    
    const completedParticipants = await ParticipantModel.countDocuments({ 
      'prolificData.prolificPid': { $exists: true },
      'prolificData.completedAt': { $exists: true }
    })
    
    const phaseStats = await ParticipantModel.aggregate([
      { $match: { 'prolificData.prolificPid': { $exists: true } } },
      {
        $project: {
          practiceCompleted: { $ifNull: ['$tests.practice.completed', false] },
          skillCompleted: { $ifNull: ['$tests.skill.completed', false] },
          benchmarkCompleted: { $ifNull: ['$tests.benchmark.completed', false] },
          strategyCompleted: { $ifNull: ['$tests.strategy.completed', false] },
          finalCompleted: { $ifNull: ['$tests.final.completed', false] }
        }
      },
      {
        $group: {
          _id: null,
          practice: { $sum: { $cond: ['$practiceCompleted', 1, 0] } },
          skill: { $sum: { $cond: ['$skillCompleted', 1, 0] } },
          benchmark: { $sum: { $cond: ['$benchmarkCompleted', 1, 0] } },
          strategy: { $sum: { $cond: ['$strategyCompleted', 1, 0] } },
          final: { $sum: { $cond: ['$finalCompleted', 1, 0] } }
        }
      }
    ])
    
    res.status(200).json({
      totalParticipants,
      completedParticipants,
      phaseCompletionStats: phaseStats[0] || {},
      completionRate: totalParticipants > 0 ? (completedParticipants / totalParticipants * 100).toFixed(1) : 0
    })
    
  } catch (err) {
    console.error('[STATS ERROR]', err)
    return res.status(500).json({ error: 'Failed to get stats' })
  }
})

// ADMIN AUTHENTICATION MIDDLEWARE
const adminAuth = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey
  const validAdminKey = process.env.ADMIN_KEY || 'knapsack-admin-2024-secure'
  
  if (!adminKey || adminKey !== validAdminKey) {
    return res.status(401).json({ 
      error: 'Unauthorized. Admin access required.',
      hint: 'Provide valid admin key in x-admin-key header or adminKey query parameter'
    })
  }
  
  next()
}

// ADMIN ANALYTICS DASHBOARD - Protected Route
router.get('/api/v1/admin/analytics', adminAuth, async (req, res) => {
  try {
    const participants = await ParticipantModel.find({ 
      'prolificData.prolificPid': { $exists: true } 
    })
    
    // Calculate comprehensive analytics
    const analytics = {
      overview: {
        totalParticipants: participants.length,
        completedParticipants: participants.filter(p => {
          const requiredPhases = ['practice', 'skill', 'benchmark', 'strategy', 'final']
          const completedPhases = requiredPhases.filter(phase => 
            (p.tests as any)?.[phase]?.completed === true
          )
          return completedPhases.length === requiredPhases.length
        }).length,
        avgStudyTime: 0,
        totalStudyTime: 0
      },
      timeAnalytics: {
        avgTimePerSection: {},
        avgTimePerQuestion: {},
        participantTimeDistribution: [],
        sectionCompletionRates: {}
      },
      participantDetails: participants.map(p => ({
        participantId: p.participantId,
        prolificPid: p.prolificData?.prolificPid,
        registeredAt: p.prolificData?.registeredAt,
        completedAt: p.prolificData?.completedAt,
        totalStudyTime: p.timeTracking?.totalStudyTime || 0,
        sectionsCompleted: p.timeTracking?.sections?.length || 0,
                testResults: {
                  practice: p.tests?.practice ? {
                    completed: p.tests.practice.completed,
                    accuracy: p.tests.practice.accuracy,
                    correctAnswers: p.tests.practice.correctAnswers,
                    totalQuestions: p.tests.practice.totalQuestions
                  } : null,
                  skill: p.tests?.skill ? {
                    completed: p.tests.skill.completed,
                    accuracy: p.tests.skill.accuracy,
                    correctAnswers: p.tests.skill.correctAnswers,
                    totalQuestions: p.tests.skill.totalQuestions
                  } : null,
                  benchmark: p.tests?.benchmark ? {
                    completed: p.tests.benchmark.completed,
                    accuracy: p.tests.benchmark.accuracy,
                    correctAnswers: p.tests.benchmark.correctAnswers,
                    totalQuestions: p.tests.benchmark.totalQuestions
                  } : null,
                  strategy: p.tests?.strategy ? {
                    completed: p.tests.strategy.completed,
                    answers: p.tests.strategy.answers,
                    questionsAnswered: (p.tests.strategy as any).questionsAnswered,
                    totalQuestions: (p.tests.strategy as any).totalQuestions,
                    timeUsed: (p.tests.strategy as any).timeUsed,
                    questionTimes: (p.tests.strategy as any).questionTimes
                  } : null,
                  final: p.tests?.final ? {
                    completed: p.tests.final.completed,
                    accuracy: p.tests.final.accuracy,
                    correctAnswers: p.tests.final.correctAnswers,
                    totalQuestions: p.tests.final.totalQuestions
                  } : null
                },
        timeBreakdown: p.timeTracking?.sections?.filter(section => (section.timeSpent || 0) > 0).map(section => ({
          sectionName: section.sectionName,
          timeSpent: section.timeSpent || 0,
          questionCount: section.questionTimes?.length || 0,
          avgTimePerQuestion: section.questionTimes?.length > 0 
            ? section.questionTimes.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / section.questionTimes.length
            : 0
        })) || []
      }))
    }
    
    // Calculate aggregate time analytics
    const validTimeData = participants.filter(p => p.timeTracking?.totalStudyTime)
    if (validTimeData.length > 0) {
      analytics.overview.totalStudyTime = validTimeData.reduce((sum, p) => sum + (p.timeTracking?.totalStudyTime || 0), 0)
      analytics.overview.avgStudyTime = analytics.overview.totalStudyTime / validTimeData.length
    }
    
    // Section time analytics
    const sectionTimes: { [key: string]: number[] } = {}
    participants.forEach(p => {
      p.timeTracking?.sections?.forEach(section => {
        if (!sectionTimes[section.sectionName]) {
          sectionTimes[section.sectionName] = []
        }
        if (section.timeSpent) {
          sectionTimes[section.sectionName].push(section.timeSpent)
        }
      })
    })
    
    Object.keys(sectionTimes).forEach(sectionName => {
      const times = sectionTimes[sectionName]
      ;(analytics.timeAnalytics.avgTimePerSection as any)[sectionName] = times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0
    })
    
    return res.status(200).json(analytics)
    
  } catch (err) {
    console.error('[ADMIN ANALYTICS ERROR]', err)
    return res.status(500).json({ error: 'Failed to get admin analytics' })
  }
})

// ADMIN PARTICIPANT DETAIL - Protected Route
router.get('/api/v1/admin/participant/:participantId', adminAuth, async (req, res) => {
  const { participantId } = req.params
  
  try {
    const participant = await ParticipantModel.findOne({ participantId })
    
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' })
    }

    const detailedAnalytics = {
      participantInfo: {
        participantId: participant.participantId,
        prolificPid: participant.prolificData?.prolificPid,
        studyId: participant.prolificData?.studyId,
        sessionId: participant.prolificData?.sessionId,
        registeredAt: participant.prolificData?.registeredAt,
        completedAt: participant.prolificData?.completedAt,
        createdAt: participant.createdAt
      },
      timeTracking: participant.timeTracking,
      testResults: participant.tests,
      result: participant.result,
      detailedTimeAnalysis: {
        totalTimeSpent: participant.timeTracking?.totalStudyTime || 0,
        sessionDuration: participant.timeTracking?.sessionStart && participant.timeTracking?.sessionEnd 
          ? new Date(participant.timeTracking.sessionEnd).getTime() - new Date(participant.timeTracking.sessionStart).getTime()
          : null,
        sectionBreakdown: participant.timeTracking?.sections?.map((section: any) => ({
          sectionName: section.sectionName,
          startTime: section.startTime,
          endTime: section.endTime,
          timeSpent: section.timeSpent,
          questionAnalysis: section.questionTimes?.map((q: any) => ({
            questionId: q.questionId,
            timeSpent: q.timeSpent,
            startTime: q.startTime,
            endTime: q.endTime,
            interactionCount: q.interactions?.length || 0,
            interactions: q.interactions?.map((interaction: any) => ({
              type: interaction.type,
              timestamp: interaction.timestamp,
              data: interaction.data
            })) || []
          })) || []
        })) || []
      }
    }
    
    return res.status(200).json(detailedAnalytics)
    
  } catch (err) {
    console.error('[ADMIN PARTICIPANT DETAIL ERROR]', err)
    return res.status(500).json({ error: 'Failed to get participant details' })
  }
})
