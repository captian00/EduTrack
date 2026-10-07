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
  CreateStudentDto,
  QueryStudentsDto,
  UpdateStudentDto,
} from './dto/student.dto.js';
import { StudentsService } from './students.service.js';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}
  @Get() list(@CurrentUser() user: User, @Query() query: QueryStudentsDto) {
    return this.students.list(user.id, query);
  }
  @Post() create(@CurrentUser() user: User, @Body() input: CreateStudentDto) {
    return this.students.create(user.id, input);
  }
  @Get(':id') get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.students.get(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() input: UpdateStudentDto,
  ) {
    return this.students.update(user.id, id, input);
  }
}
