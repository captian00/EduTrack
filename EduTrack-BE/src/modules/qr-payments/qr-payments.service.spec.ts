import { compactVietQrDescription } from './qr-payments.service.js';

describe('compactVietQrDescription', () => {
  it('creates a short transfer description with month and student name', () => {
    const result = compactVietQrDescription({
      studentName: 'Vũ Thị Minh Vân',
      monthYear: '10/2026',
      lessonCount: 1,
      amount: 500000,
    });

    expect(result).toBe('HP T10/2026 Vu Thi Minh Van');
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it('truncates the student name to the VietQR limit', () => {
    const result = compactVietQrDescription({
      studentName: 'Nguyễn Thị Minh Anh Phương',
      monthYear: '10/2026',
      lessonCount: 12,
      amount: 1500000,
    });

    expect(result.startsWith('HP T10/2026 ')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(40);
  });
});
