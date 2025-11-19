-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prolificPid" TEXT,
    "studyId" TEXT,
    "sessionId" TEXT,
    "registeredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "testPractice" JSONB,
    "testSkill" JSONB,
    "testBenchmark" JSONB,
    "testStrategy" JSONB,
    "testFinal" JSONB,
    "resultScore" DOUBLE PRECISION,
    "resultPassed" BOOLEAN,
    "resultFeedback" TEXT,
    "timeTracking" JSONB,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionSet" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "generationConfig" JSONB NOT NULL,
    "analysisStats" JSONB NOT NULL,
    "seed" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "QuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_participantId_key" ON "Participant"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_prolificPid_key" ON "Participant"("prolificPid");

-- CreateIndex
CREATE INDEX "Participant_prolificPid_idx" ON "Participant"("prolificPid");

-- CreateIndex
CREATE INDEX "Participant_participantId_idx" ON "Participant"("participantId");

-- CreateIndex
CREATE INDEX "Session_participantId_idx" ON "Session"("participantId");

-- CreateIndex
CREATE INDEX "Session_testId_idx" ON "Session"("testId");

-- CreateIndex
CREATE INDEX "QuestionSet_participantId_idx" ON "QuestionSet"("participantId");

-- CreateIndex
CREATE INDEX "QuestionSet_phase_idx" ON "QuestionSet"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSet_participantId_phase_key" ON "QuestionSet"("participantId", "phase");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("participantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("participantId") ON DELETE CASCADE ON UPDATE CASCADE;
