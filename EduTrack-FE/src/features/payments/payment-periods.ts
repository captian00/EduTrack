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

export function billingClasses(items: TuitionItem[], billingMonths: string[]) {
  const values = new Map<string, string>();
  items
    .filter((item) =>
      billingMonths.includes(item.lesson.lessonDate.slice(0, 7)),
    )
    .forEach((item) =>
      values.set(item.lesson.class.id, item.lesson.class.name),
    );
  return [...values].map(([id, name]) => ({ id, name }));
}

export function selectedPeriodItems(
  items: TuitionItem[],
  billingMonths: string[],
  classIds: string[],
) {
  return items.filter(
    (item) =>
      item.outstanding > 0 &&
      billingMonths.includes(item.lesson.lessonDate.slice(0, 7)) &&
      classIds.includes(item.lesson.class.id),
  );
}

export function lessonDateLabels(dates: string[]) {
  return [...new Set(dates.map((date) => date.slice(0, 10)))]
    .sort()
    .map((date) => {
      const [, month, day] = date.split('-');
      return `${day}/${month}`;
    });
}
