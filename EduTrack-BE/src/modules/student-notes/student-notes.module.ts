import { Module } from '@nestjs/common';
import { StudentNotesController } from './student-notes.controller.js';
import { StudentNotesCronController } from './student-notes-cron.controller.js';
import { StudentNotesService } from './student-notes.service.js';
@Module({
  controllers: [StudentNotesController, StudentNotesCronController],
  providers: [StudentNotesService],
  exports: [StudentNotesService],
})
export class StudentNotesModule {}
