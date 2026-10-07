import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';

import { Public } from '../auth/public.decorator.js';
import { StudentNotesService } from './student-notes.service.js';

@Public()
@ApiExcludeController()
@Controller('cron/student-notes')
export class StudentNotesCronController {
  constructor(
    private readonly studentNotes: StudentNotesService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async cleanup(@Headers('authorization') authorization?: string) {
    const secret = this.config.getOrThrow<string>('CRON_SECRET');
    if (authorization !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid cron authorization');
    }

    const result = await this.studentNotes.cleanupExpired();
    return { success: true, deletedCount: result.count };
  }
}
