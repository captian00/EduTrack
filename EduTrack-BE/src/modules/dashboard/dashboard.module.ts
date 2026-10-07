import { Module } from '@nestjs/common';
import { TuitionModule } from '../tuition/tuition.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
@Module({
  imports: [TuitionModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
