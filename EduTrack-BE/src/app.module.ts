import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { SupabaseAuthGuard } from './modules/auth/supabase-auth.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { ClassesModule } from './modules/classes/classes.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { LessonsModule } from './modules/lessons/lessons.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { QrPaymentsModule } from './modules/qr-payments/qr-payments.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { TuitionModule } from './modules/tuition/tuition.module.js';
import { validateEnvironment } from './config/env.validation.js';
import { PrismaModule } from './database/prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { StudentNotesModule } from './modules/student-notes/student-notes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    StudentsModule,
    StudentNotesModule,
    ClassesModule,
    LessonsModule,
    AttendanceModule,
    TuitionModule,
    PaymentsModule,
    SettingsModule,
    QrPaymentsModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: SupabaseAuthGuard }],
})
export class AppModule {}
