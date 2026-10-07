CREATE TYPE "PaymentStatus" AS ENUM ('CONFIRMED', 'VOIDED');

ALTER TABLE "Attendance"
ADD COLUMN "makeupForAttendanceId" UUID;

ALTER TABLE "Payment"
ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
ADD COLUMN "voidedAt" TIMESTAMP(3),
ADD COLUMN "voidReason" TEXT;

ALTER TABLE "OwnerSettings"
ADD COLUMN "nextStudentNumber" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "Attendance_makeupForAttendanceId_key"
ON "Attendance"("makeupForAttendanceId");

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_makeupForAttendanceId_fkey"
FOREIGN KEY ("makeupForAttendanceId") REFERENCES "Attendance"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
