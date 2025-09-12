"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantModel = void 0;
// models/Participant.ts
const mongoose_1 = __importDefault(require("mongoose"));
const eventSchema = new mongoose_1.default.Schema({
    type: String,
    payload: mongoose_1.default.Schema.Types.Mixed,
    ts: String,
}, { _id: false });
const testPhaseSchema = new mongoose_1.default.Schema({
    completed: Boolean,
    correctAnswers: Number,
    totalQuestions: Number,
    accuracy: Number,
    answers: [mongoose_1.default.Schema.Types.Mixed],
    events: [eventSchema],
}, { _id: false });
const participantSchema = new mongoose_1.default.Schema({
    participantId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    prolificData: {
        prolificPid: String,
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
    }
});
exports.ParticipantModel = mongoose_1.default.model("Participant", participantSchema);
