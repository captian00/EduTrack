import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateStudentNoteDto, QueryStudentNotesDto, UpdateStudentNoteDto } from './dto/student-note.dto.js';
import { StudentNotesService } from './student-notes.service.js';

@ApiTags('student-notes') @ApiBearerAuth() @Controller()
export class StudentNotesController {
  constructor(private readonly notes: StudentNotesService) {}
  @Get('students/:studentId/notes') list(@CurrentUser() user: User, @Param('studentId') studentId: string, @Query() query: QueryStudentNotesDto) { return this.notes.list(user.id, studentId, query); }
  @Post('students/:studentId/notes') create(@CurrentUser() user: User, @Param('studentId') studentId: string, @Body() input: CreateStudentNoteDto) { return this.notes.create(user.id, studentId, input); }
  @Patch('student-notes/:id') update(@CurrentUser() user: User, @Param('id') id: string, @Body() input: UpdateStudentNoteDto) { return this.notes.update(user.id, id, input); }
  @Delete('student-notes/:id') remove(@CurrentUser() user: User, @Param('id') id: string) { return this.notes.remove(user.id, id); }
}
