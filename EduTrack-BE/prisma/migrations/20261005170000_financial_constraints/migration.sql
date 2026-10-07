CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Class"
ADD CONSTRAINT "Class_defaultFee_nonnegative" CHECK ("defaultFee" >= 0);

ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_feePerSession_nonnegative" CHECK ("feePerSession" >= 0),
ADD CONSTRAINT "Enrollment_date_range_valid" CHECK ("endDate" IS NULL OR "endDate" >= "startDate"),
ADD CONSTRAINT "Enrollment_no_active_overlap" EXCLUDE USING gist (
  "ownerId" WITH =,
  "studentId" WITH =,
  "classId" WITH =,
  daterange("startDate", COALESCE("endDate", 'infinity'::date), '[]') WITH &&
) WHERE ("isActive" = true);

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_feeAmount_nonnegative" CHECK ("feeAmount" >= 0);

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_amount_positive" CHECK ("amount" > 0);
