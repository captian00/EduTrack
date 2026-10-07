import { compactVietQrDescription } from './qr-payments.service.js';

describe('compactVietQrDescription', () => {
  it('keeps all reconciliation fields within the VietQR limit', () => {
    const result = compactVietQrDescription({
      studentName: 'Vũ Thị Minh Vân',
      monthYear: '10/2026',
      lessonCount: 1,
      amount: 500000,
    });

    expect(result).toBe('Vu Thi Minh Van HP 10/2026 1B 500000');
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it('truncates only the student name when the name is long', () => {
    const result = compactVietQrDescription({
      studentName: 'Nguyễn Thị Minh Anh Phương',
      monthYear: '10/2026',
      lessonCount: 12,
      amount: 1500000,
    });

    expect(result).toContain('HP 10/2026 12B 1500000');
    expect(result.length).toBeLessThanOrEqual(40);
  });
});
