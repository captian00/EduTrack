-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED', 'MAKEUP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'OTHER');

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "studentCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "defaultFee" INTEGER NOT NULL,
    "scheduleNote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "feePerSession" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "lessonDate" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    "topic" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "feeAmount" INTEGER NOT NULL,
    "isBillable" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "attendanceId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerSettings" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "displayName" TEXT,
    "bankCode" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountName" TEXT,
    "billExcusedAbsence" BOOLEAN NOT NULL DEFAULT false,
    "billUnexcusedAbsence" BOOLEAN NOT NULL DEFAULT true,
    "transferDescriptionTemplate" TEXT NOT NULL DEFAULT 'EDU {STUDENT_CODE} {YYYYMM}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Student_ownerId_isActive_idx" ON "Student"("ownerId", "isActive");

-- CreateIndex
CREATE INDEX "Student_ownerId_fullName_idx" ON "Student"("ownerId", "fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_ownerId_studentCode_key" ON "Student"("ownerId", "studentCode");

-- CreateIndex
CREATE INDEX "Class_ownerId_isActive_idx" ON "Class"("ownerId", "isActive");

-- CreateIndex
CREATE INDEX "Enrollment_ownerId_studentId_idx" ON "Enrollment"("ownerId", "studentId");

-- CreateIndex
CREATE INDEX "Enrollment_ownerId_classId_idx" ON "Enrollment"("ownerId", "classId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_startDate_endDate_idx" ON "Enrollment"("classId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Lesson_ownerId_lessonDate_idx" ON "Lesson"("ownerId", "lessonDate");

-- CreateIndex
CREATE INDEX "Lesson_ownerId_classId_idx" ON "Lesson"("ownerId", "classId");

-- CreateIndex
CREATE INDEX "Attendance_ownerId_studentId_idx" ON "Attendance"("ownerId", "studentId");

-- CreateIndex
CREATE INDEX "Attendance_ownerId_isBillable_idx" ON "Attendance"("ownerId", "isBillable");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_lessonId_studentId_key" ON "Attendance"("lessonId", "studentId");

-- CreateIndex
CREATE INDEX "Payment_ownerId_studentId_idx" ON "Payment"("ownerId", "studentId");

-- CreateIndex
CREATE INDEX "Payment_ownerId_paidAt_idx" ON "Payment"("ownerId", "paidAt");

-- CreateIndex
CREATE INDEX "PaymentAllocation_ownerId_attendanceId_idx" ON "PaymentAllocation"("ownerId", "attendanceId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_attendanceId_key" ON "PaymentAllocation"("paymentId", "attendanceId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerSettings_ownerId_key" ON "OwnerSettings"("ownerId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
