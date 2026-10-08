export type TuitionItem = {
  feeAmount: number;
  outstanding: number;
  lesson: {
    lessonDate: string;
    class: { id: string; name: string };
  };
};

export function outstandingTuitionItems(items: TuitionItem[]) {
  return items.filter((item) => item.outstanding > 0);
}

export function billingMonths(items: TuitionItem[]) {
  return [
    ...new Set(items.map((item) => item.lesson.lessonDate.slice(0, 7))),
  ].sort();
}

export function billingClasses(items: TuitionItem[], billingMonth: string) {
  const values = new Map<string, string>();
  items
    .filter((item) => item.lesson.lessonDate.startsWith(billingMonth))
    .forEach((item) =>
      values.set(item.lesson.class.id, item.lesson.class.name),
    );
  return [...values].map(([id, name]) => ({ id, name }));
}

export function selectedPeriodItems(
  items: TuitionItem[],
  billingMonth: string,
  classId: string,
) {
  return items.filter(
    (item) =>
      item.outstanding > 0 &&
      item.lesson.lessonDate.startsWith(billingMonth) &&
      item.lesson.class.id === classId,
  );
}
