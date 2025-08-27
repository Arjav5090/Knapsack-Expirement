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
