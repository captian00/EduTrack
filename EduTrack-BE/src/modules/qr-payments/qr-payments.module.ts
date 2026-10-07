import { Module } from '@nestjs/common';
import { TuitionModule } from '../tuition/tuition.module.js';
import { QrPaymentsController } from './qr-payments.controller.js';
import { QrPaymentsService } from './qr-payments.service.js';
@Module({
  imports: [TuitionModule],
  controllers: [QrPaymentsController],
  providers: [QrPaymentsService],
})
export class QrPaymentsModule {}
