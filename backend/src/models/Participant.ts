// models/Participant.ts
import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({
  type: String,
  payload: mongoose.Schema.Types.Mixed,
  ts: String,
}, { _id: false })

const testPhaseSchema = new mongoose.Schema({
  completed: Boolean,
  correctAnswers: Number,
  totalQuestions: Number,
  accuracy: Number,
  answers: [mongoose.Schema.Types.Mixed],
  events: [eventSchema],
}, { _id: false })

const participantSchema = new mongoose.Schema({
  participantId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  tests: {
    practice: testPhaseSchema,
    skill: testPhaseSchema,
    benchmark: testPhaseSchema,
    strategy: testPhaseSchema,
    final: testPhaseSchema,
  },
  result: {
    score: Number,
    passed: Boolean,
    feedback: String,
  }
})

export const ParticipantModel = mongoose.model("Participant", participantSchema)
