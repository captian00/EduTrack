import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { TuitionService } from '../tuition/tuition.service.js';
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tuition: TuitionService,
  ) {}
  async summary(ownerId: string) {
    const now = new Date();
    const vietnamDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(now);
    const day = new Date(vietnamDate);
    const [activeStudents, activeClasses, todayLessons, attendance, tuition] =
      await Promise.all([
        this.prisma.student.count({ where: { ownerId, isActive: true } }),
        this.prisma.class.count({ where: { ownerId, isActive: true } }),
        this.prisma.lesson.count({ where: { ownerId, lessonDate: day } }),
        this.prisma.attendance.groupBy({
          by: ['status'],
          where: { ownerId, lesson: { lessonDate: day } },
          _count: true,
        }),
        this.tuition.summary(ownerId),
      ]);
    return {
      activeStudents,
      activeClasses,
      todayLessons,
      attendance,
      tuition: tuition.totals,
    };
  }
}
