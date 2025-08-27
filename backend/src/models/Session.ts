import mongoose, { Schema, InferSchemaType } from 'mongoose';

const EventSchema = new Schema(
  {
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    ts: { type: Date, default: () => new Date() }
  },
  { _id: false }
);

const MetadataSchema = new Schema(
  {
    durationMs: Number,
    userAgent: String,
    ip: String,
    browser: String,
    os: String,
    device: String
  },
  { _id: false }
);

const SessionSchema = new Schema(
  {
    participantId: { type: String, required: true, index: true },
    testId: { type: String, required: true },
    events: { type: [EventSchema], default: [] },
    metadata: { type: MetadataSchema, default: {} },
    createdAt: { type: Date, default: () => new Date() }
  },
  { versionKey: false }
);

export type SessionDoc = InferSchemaType<typeof SessionSchema>;
export const SessionModel = mongoose.models.Session || mongoose.model('Session', SessionSchema);
