import { Module } from '@nestjs/common';
import { StudentNotesController } from './student-notes.controller.js';
import { StudentNotesService } from './student-notes.service.js';
@Module({ controllers: [StudentNotesController], providers: [StudentNotesService], exports: [StudentNotesService] })
export class StudentNotesModule {}
