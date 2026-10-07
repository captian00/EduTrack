ALTER TABLE "OwnerSettings"
ALTER COLUMN "transferDescriptionTemplate"
SET DEFAULT '{STUDENT_NAME} hoc phi thang {MMYYYY}, tong so buoi hoc {LESSON_COUNT}, tong tien {TOTAL_AMOUNT}';

UPDATE "OwnerSettings"
SET "transferDescriptionTemplate" = '{STUDENT_NAME} hoc phi thang {MMYYYY}, tong so buoi hoc {LESSON_COUNT}, tong tien {TOTAL_AMOUNT}'
WHERE "transferDescriptionTemplate" = 'EDU {STUDENT_CODE} {YYYYMM}';
