CREATE TABLE "StudentNote" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "lessonId" UUID,
  "noteDate" DATE NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentNote_ownerId_studentId_noteDate_idx" ON "StudentNote"("ownerId", "studentId", "noteDate");
CREATE INDEX "StudentNote_ownerId_lessonId_noteDate_idx" ON "StudentNote"("ownerId", "lessonId", "noteDate");
ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentNote" ADD CONSTRAINT "StudentNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
