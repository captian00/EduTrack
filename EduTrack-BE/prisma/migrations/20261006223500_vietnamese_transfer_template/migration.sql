ALTER TABLE "OwnerSettings"
ALTER COLUMN "transferDescriptionTemplate"
SET DEFAULT '{STUDENT_NAME} học phí tháng {MMYYYY}, tổng số buổi học {LESSON_COUNT}, tổng tiền {TOTAL_AMOUNT}';

UPDATE "OwnerSettings"
SET "transferDescriptionTemplate" = '{STUDENT_NAME} học phí tháng {MMYYYY}, tổng số buổi học {LESSON_COUNT}, tổng tiền {TOTAL_AMOUNT}'
WHERE "transferDescriptionTemplate" = '{STUDENT_NAME} hoc phi thang {MMYYYY}, tong so buoi hoc {LESSON_COUNT}, tong tien {TOTAL_AMOUNT}';
