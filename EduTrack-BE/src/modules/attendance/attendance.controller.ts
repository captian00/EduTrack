import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AttendanceService } from './attendance.service.js';
import { SaveAttendanceDto } from './dto/save-attendance.dto.js';
@ApiTags('attendance')
@ApiBearerAuth()
@Controller('lessons/:lessonId/attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}
  @Get() roster(@CurrentUser() user: User, @Param('lessonId') id: string) {
    return this.attendance.roster(user.id, id);
  }
  @Put() save(
    @CurrentUser() user: User,
    @Param('lessonId') id: string,
    @Body() input: SaveAttendanceDto,
  ) {
    return this.attendance.save(user.id, id, input);
  }
}
