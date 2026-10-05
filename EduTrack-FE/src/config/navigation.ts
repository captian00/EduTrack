import { Banknote, BookOpen, CalendarDays, CreditCard, LayoutDashboard, Settings, UserRoundCheck, Users } from 'lucide-react';

export const navigation = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/students', label: 'Học sinh', icon: Users },
  { href: '/classes', label: 'Lớp học', icon: BookOpen },
  { href: '/lessons', label: 'Buổi học', icon: CalendarDays },
  { href: '/attendance', label: 'Điểm danh', icon: UserRoundCheck },
  { href: '/tuition', label: 'Học phí', icon: Banknote },
  { href: '/payments', label: 'Thanh toán', icon: CreditCard },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
] as const;
