import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import {
  CreateLessonDto,
  QueryLessonsDto,
  UpdateLessonDto,
} from './dto/lesson.dto.js';
import { LessonsService } from './lessons.service.js';
@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}
  @Get() list(@CurrentUser() user: User, @Query() query: QueryLessonsDto) {
    return this.lessons.list(user.id, query);
  }
  @Post() create(@CurrentUser() user: User, @Body() input: CreateLessonDto) {
    return this.lessons.create(user.id, input);
  }
  @Get(':id') get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.lessons.get(user.id, id);
  }
  @Get(':id/students') students(@CurrentUser() user: User, @Param('id') id: string) {
    return this.lessons.students(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() input: UpdateLessonDto,
  ) {
    return this.lessons.update(user.id, id, input);
  }
  @Post(':id/cancel') cancel(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.lessons.cancel(user.id, id);
  }
}
