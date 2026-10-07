import { Module } from '@nestjs/common';
import { TuitionController } from './tuition.controller.js';
import { TuitionService } from './tuition.service.js';
@Module({
  controllers: [TuitionController],
  providers: [TuitionService],
  exports: [TuitionService],
})
export class TuitionModule {}
