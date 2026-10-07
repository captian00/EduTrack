import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { TuitionService } from './tuition.service.js';
import { QueryTuitionSummaryDto } from './dto/query-tuition-summary.dto.js';
@ApiTags('tuition')
@ApiBearerAuth()
@Controller('tuition')
export class TuitionController {
  constructor(private readonly tuition: TuitionService) {}
  @Get('summary') summary(
    @CurrentUser() user: User,
    @Query() query: QueryTuitionSummaryDto,
  ) {
    return this.tuition.summary(user.id, query);
  }
  @Get('students/:studentId') detail(
    @CurrentUser() user: User,
    @Param('studentId') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tuition.studentDetail(user.id, id, from, to);
  }
}
