import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import {
  CreatePaymentDto,
  QueryPaymentsDto,
  VoidPaymentDto,
} from './dto/payment.dto.js';
import { PaymentsService } from './payments.service.js';
@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get() list(@CurrentUser() user: User, @Query() query: QueryPaymentsDto) {
    return this.payments.list(user.id, query);
  }
  @Get(':id') get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.payments.get(user.id, id);
  }
  @Post('preview') preview(
    @CurrentUser() user: User,
    @Body() input: CreatePaymentDto,
  ) {
    return this.payments.preview(user.id, input);
  }
  @Post() create(@CurrentUser() user: User, @Body() input: CreatePaymentDto) {
    return this.payments.create(user.id, input);
  }
  @Post(':id/void') void(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() input: VoidPaymentDto,
  ) {
    return this.payments.void(user.id, id, input);
  }
}
