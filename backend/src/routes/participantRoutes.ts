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
    const requiredPhases = ['practice', 'benchmark', 'strategy', 'final'] as const
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
            [`tests.${phase}.answers`]: data.answers
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
