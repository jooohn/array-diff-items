import arrayDiffItems, { DiffItem } from './index';

const testArrayDiff = <T>(conditions: { left: T[], right: T[], compare: (left: T, right: T) => number, expectedDiffTypes: string[] }) => (): void => {
  const { left, right, compare, expectedDiffTypes } = conditions;
  const diffItems = arrayDiffItems(left, right)(compare);
  expect(applyDiff(left, diffItems)).toEqual(right);
  expect(diffItems.map(item => item.type)).toEqual(expectedDiffTypes);
};

const applyDiff = <T>(left: T[], diffItems: DiffItem<T>[]): T[] => {
  type Acc = { leftRemaining: T[], acc: T[] };
  return diffItems.reduce(({ leftRemaining, acc }: Acc, diffItem): Acc => {
    switch (diffItem.type) {
      case 'Added': return { leftRemaining, acc: [...acc, diffItem.item] };
      case 'Removed': {
        const [, ...tail] = leftRemaining;
        return {leftRemaining: tail, acc};
      }
      case 'Unchanged': {
        const [, ...tail] = leftRemaining;
        return { leftRemaining: tail, acc: [...acc, diffItem.item] };
      }
      case 'Changed': {
        const [, ...tail] = leftRemaining;
        return { leftRemaining: tail, acc: [...acc, diffItem.right] };
      }
    }
  }, { leftRemaining: left, acc: [] }).acc;
};

test('simple case', testArrayDiff({
  left:  [1, 2, 3, 4, 22, 6],
  right: [   2, 3, 4, 10, 6, 7],
  compare: (a, b) => a === b ? 0 : 0.9,
  expectedDiffTypes: [
    'Removed',
    'Unchanged',
    'Unchanged',
    'Unchanged',
    'Changed',
    'Unchanged',
    'Added',
  ]
}));

test('ordered Remove/Add rather than change', testArrayDiff({
  left:  [10, 11, 12, 13, 14],
  right: [20, 21, 22, 23, 24],
  compare: (a, b) => a === b ? 0 : 1.1,
  expectedDiffTypes: [
    'Removed',
    'Removed',
    'Removed',
    'Removed',
    'Removed',
    'Added',
    'Added',
    'Added',
    'Added',
    'Added',
  ]
}));

test('both lists are empty', testArrayDiff({
  left: [],
  right: [],
  compare: (a, b) => a == b ? 0 : 2,
  expectedDiffTypes: [],
}));

const makeRandomArray = (num: number) => Array.apply(null, Array(num)).map(() => Math.random());
const longArray1: number[] = makeRandomArray(300);
const longArray2: number[] = makeRandomArray(300);

test('rough performance check', (done) => {
  const start = new Date();
  arrayDiffItems(longArray1, longArray2)((a, b) => Math.abs(a - b) * 2);
  setTimeout(() => {
    const end = new Date();
    expect(end.getTime() - start.getTime()).toBeLessThanOrEqual(1000);
    done();
  }, 0);
});
