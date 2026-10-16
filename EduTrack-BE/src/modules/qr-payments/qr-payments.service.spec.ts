import { compactVietQrDescription } from './qr-payments.service.js';

describe('compactVietQrDescription', () => {
  it('creates a short transfer description with month and student name', () => {
    const result = compactVietQrDescription({
      studentName: 'Vũ Thị Minh Vân',
      monthLabel: 'T10/2026',
      lessonCount: 1,
      amount: 500000,
    });

    expect(result).toBe('HP T10/2026 Vu Thi Minh Van');
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it('truncates the student name to the VietQR limit', () => {
    const result = compactVietQrDescription({
      studentName: 'Nguyễn Thị Minh Anh Phương',
      monthLabel: 'T9/2026,10/2026',
      lessonCount: 12,
      amount: 1500000,
    });

    expect(result.startsWith('HP T9/2026,10/2026 ')).toBe(true);
    expect(result).toContain('Nguyen Thi Minh');
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it('truncates a long multi-month prefix to the VietQR limit', () => {
    const result = compactVietQrDescription({
      studentName: 'Nguyễn Văn An',
      monthLabel: 'T1/2026,2/2026,3/2026,4/2026,5/2026,6/2026',
      lessonCount: 20,
      amount: 5_000_000,
    });

    expect(result.length).toBeLessThanOrEqual(40);
  });
});
