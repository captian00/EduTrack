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
import { ClassesService } from './classes.service.js';
import {
  CreateClassDto,
  CreateEnrollmentDto,
  EndEnrollmentDto,
  QueryClassesDto,
  UpdateClassDto,
} from './dto/class.dto.js';
@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}
  @Get() list(@CurrentUser() user: User, @Query() query: QueryClassesDto) {
    return this.classes.list(user.id, query);
  }
  @Post() create(@CurrentUser() user: User, @Body() input: CreateClassDto) {
    return this.classes.create(user.id, input);
  }
  @Get(':id') get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.classes.get(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() input: UpdateClassDto,
  ) {
    return this.classes.update(user.id, id, input);
  }
  @Post(':id/enrollments') enroll(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() input: CreateEnrollmentDto,
  ) {
    return this.classes.enroll(user.id, id, input);
  }
  @Patch(':id/enrollments/:enrollmentId/end') end(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('enrollmentId') enrollmentId: string,
    @Body() input: EndEnrollmentDto,
  ) {
    return this.classes.endEnrollment(user.id, id, enrollmentId, input);
  }
}
