import { describe, expect, it } from 'vitest';
import {
  billingClasses,
  billingMonths,
  outstandingTuitionItems,
  selectedPeriodItems,
  type TuitionItem,
} from './payment-periods';

const items: TuitionItem[] = [
  {
    feeAmount: 250_000,
    outstanding: 250_000,
    lesson: {
      lessonDate: '2026-09-03T00:00:00.000Z',
      class: { id: 'class-a', name: '2E3' },
    },
  },
  {
    feeAmount: 250_000,
    outstanding: 0,
    lesson: {
      lessonDate: '2026-09-08T00:00:00.000Z',
      class: { id: 'class-a', name: '2E3' },
    },
  },
  {
    feeAmount: 300_000,
    outstanding: 300_000,
    lesson: {
      lessonDate: '2026-10-02T00:00:00.000Z',
      class: { id: 'class-b', name: '3A1' },
    },
  },
];

describe('payment periods', () => {
  it('derives selectable months and classes from outstanding tuition only', () => {
    const outstanding = outstandingTuitionItems(items);

    expect(billingMonths(outstanding)).toEqual(['2026-09', '2026-10']);
    expect(billingClasses(outstanding, '2026-09')).toEqual([
      { id: 'class-a', name: '2E3' },
    ]);
  });

  it('selects only charges in the requested month and class', () => {
    const selected = selectedPeriodItems(items, '2026-09', 'class-a');

    expect(selected).toHaveLength(1);
    expect(selected.reduce((sum, item) => sum + item.outstanding, 0)).toBe(
      250_000,
    );
  });
});
