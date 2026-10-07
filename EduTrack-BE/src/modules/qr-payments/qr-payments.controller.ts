import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { GenerateQrDto } from './dto/generate-qr.dto.js';
import { QrPaymentsService } from './qr-payments.service.js';
@ApiTags('qr-payments')
@ApiBearerAuth()
@Controller('qr-payments')
export class QrPaymentsController {
  constructor(private readonly qr: QrPaymentsService) {}
  @Post('generate') generate(
    @CurrentUser() user: User,
    @Body() input: GenerateQrDto,
  ) {
    return this.qr.generate(user.id, input);
  }
}
