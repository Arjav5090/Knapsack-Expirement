// models/Participant.ts
import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({
  type: String,
  payload: mongoose.Schema.Types.Mixed,
  ts: String,
}, { _id: false })

// Time tracking schema for individual questions
const questionTimeSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: Date,
  timeSpent: Number, // in milliseconds
  interactions: [{
    type: { type: String }, // 'focus', 'blur', 'answer_change', etc.
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }]
}, { _id: false })

// Section time tracking schema
const sectionTimeSchema = new mongoose.Schema({
  sectionName: { type: String, required: true }, // 'intro', 'tutorial', 'practice', etc.
  startTime: { type: Date, required: true },
  endTime: Date,
  timeSpent: Number, // in milliseconds
  questionTimes: [questionTimeSchema]
}, { _id: false })

const testPhaseSchema = new mongoose.Schema({
  completed: Boolean,
  correctAnswers: Number,
  totalQuestions: Number,
  accuracy: Number,
  answers: [mongoose.Schema.Types.Mixed],
  events: [eventSchema],
  timeUsed: Number, // Total time used for the phase
  questionTimes: [{ // Individual question timing
    questionId: Number,
    startTime: Number,
    endTime: Number,
    timeSpent: Number
  }]
}, { _id: false })

const participantSchema = new mongoose.Schema({
  participantId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  prolificData: {
    prolificPid: { type: String, unique: true, sparse: true }, // Unique index, sparse allows nulls
    studyId: String, 
    sessionId: String,
    registeredAt: Date,
    completedAt: Date,
  },
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
  },
  // Time tracking data
  timeTracking: {
    totalStudyTime: Number, // total time spent in study (milliseconds)
    sections: [sectionTimeSchema],
    sessionStart: Date,
    sessionEnd: Date,
  }
})

export const ParticipantModel = mongoose.model("Participant", participantSchema)
