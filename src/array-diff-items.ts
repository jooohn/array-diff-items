import { DiffItem, Added, Removed, Changed, Unchanged } from './diff-item';

type Compare<T> = (left: T, right: T) => number;
type Position = {
  left: number
  right: number
}

type Path = {
  totalCost: number
  parent: {
    node: Node
    operation: 'Added' | 'Removed' | 'Changed' | 'Unchanged'
  } | undefined
}

class Node {

  readonly position: Position;
  readonly distance: number;
  readonly costToChange: number | undefined;

  path: Path | undefined;


  constructor(params: { position: Position, costToChange: number | undefined }) {
    this.position = params.position;
    this.costToChange = params.costToChange;
    this.path = undefined;
    this.distance = this.position.left + this.position.right;
  }

  tryUpdate(path: Path) {
    if (typeof this.path === 'undefined' || path.totalCost < this.path.totalCost) {
      this.path = path;
    }
  }

}

type NodeKey = string
const keyOf = (leftIndex: number, rightIndex: number): NodeKey => `${leftIndex}__${rightIndex}`;

class ArrayDiffItems<T> {

  private readonly left: T[];
  private readonly right: T[];
  private readonly nodeByPosition: Map<NodeKey, Node>;

  private readonly costToRemove: number;
  private readonly costToAdd: number;

  constructor(params: { left: T[], right: T[], compare: Compare<T>, costToAdd: number, costToRemove: number }) {
    const { compare } = params;
    this.left = params.left;
    this.right = params.right;
    this.costToAdd = params.costToAdd;
    this.costToRemove = params.costToRemove;

    const nodesByPosition = new Map<NodeKey, Node>();
    for (let leftIndex = 0; leftIndex <= this.left.length; leftIndex++) {
      for (let rightIndex = 0; rightIndex <= this.right.length; rightIndex++) {
        const leftItem = this.left[leftIndex - 1];
        const rightItem = this.right[rightIndex - 1];
        const costToChange = (typeof leftItem !== 'undefined' && typeof rightItem !== 'undefined')
          ? compare(leftItem, rightItem)
          : undefined;
        nodesByPosition.set(keyOf(leftIndex, rightIndex), new Node({
          position: { left: leftIndex, right: rightIndex },
          costToChange,
        }));
      }
    }
    this.nodeByPosition = nodesByPosition;
  }

  resolve = (): DiffItem<T>[] => {
    const sortedNodes = this.getSortedNodes();

    sortedNodes[0].path = { totalCost: 0, parent: undefined };
    sortedNodes.forEach(this.updateTotalCostsNextTo);

    const lastNode = sortedNodes[sortedNodes.length - 1];
    const diffItems = this.reproduceDiffFrom(lastNode);
    return this.finalize(diffItems);
  };

  private getSortedNodes = (): Node[] =>
    Array.from(this.nodeByPosition.values()).sort((a, b) => a.distance - b.distance);

  private reproduceDiffFrom = (node: Node): DiffItem<T>[] => {
    const go = (n: Node, diffItems: DiffItem<T>[]): DiffItem<T>[] => {
      const path = n.path;
      if (typeof path === 'undefined' || typeof path.parent === 'undefined') {
        return diffItems;
      } else {
        const parent = path.parent;
        switch (parent.operation) {
          case 'Added':
            const added: Added<T> = { type: 'Added', item: this.right[parent.node.position.right] };
            return go(parent.node, [added, ...diffItems]);
          case 'Removed':
            const removed: Removed<T> = { type: 'Removed', item: this.left[parent.node.position.left] };
            return go(parent.node, [removed, ...diffItems]);
          case 'Changed':
            const changed: Changed<T> = { type: 'Changed', left: this.left[parent.node.position.left], right: this.right[parent.node.position.right] };
            return go(parent.node, [changed, ...diffItems]);
          default:
            const unchanged: Unchanged<T> = { type: 'Unchanged', item: this.right[parent.node.position.right] };
            return go(parent.node, [unchanged, ...diffItems]);
        }
      }
    };
    return go(node, []);
  };

  /**
   * Collect continuous Remove / Add operations like:
   * e.g. [Changed, Added, Removed, Added, Unchanged, Removed, Added, Removed]
   *   => [Changed, Removed, Added, Added, Unchanged, Removed, Removed, Added]
   * @param diffItems
   */
  private finalize = (diffItems: DiffItem<T>[]): DiffItem<T>[] => {
    type Acc = { acc: DiffItem<T>[], currentAdded: Added<T>[], currentRemoved: Removed<T>[] }
    const merge = (acc: Acc): DiffItem<T>[] => [...acc.acc, ...acc.currentRemoved, ...acc.currentAdded];

    return merge(diffItems.reduce(({ acc, currentAdded, currentRemoved }: Acc, diffItem): Acc => {
      switch (diffItem.type) {
        case 'Changed':
        case 'Unchanged':
          return { acc: [...merge({ acc, currentAdded, currentRemoved }), diffItem], currentAdded: [], currentRemoved: [] };
        case 'Added':
          return { acc, currentRemoved, currentAdded: [...currentAdded, diffItem] };
        case 'Removed':
          return { acc, currentAdded, currentRemoved: [...currentRemoved, diffItem] };
      }
    }, { acc: [], currentAdded: [], currentRemoved: [] }));
  };

  private updateTotalCostsNextTo = (node: Node): void => {
    const { left, right } = node.position;
    const removed = this.nodeOf(left + 1, right);
    if (typeof removed !== 'undefined') {
      removed.tryUpdate({
        totalCost: node.path.totalCost + this.costToRemove,
        parent: { node, operation: 'Removed' },
      });
    }

    const added = this.nodeOf(left, right + 1);
    if (typeof added !== 'undefined') {
      added.tryUpdate({
        totalCost: node.path.totalCost + this.costToAdd,
        parent: { node, operation: 'Added' },
      })
    }

    const changed = this.nodeOf(left + 1, right + 1);
    if (typeof changed !== 'undefined' && typeof changed.costToChange !== 'undefined') {
      changed.tryUpdate({
        totalCost: node.path.totalCost + changed.costToChange,
        parent: { node, operation: changed.costToChange === 0 ? 'Unchanged' : 'Changed' }
      });
    }
  };

  private nodeOf = (left: number, right: number): Node | undefined => {
    return this.nodeByPosition.get(keyOf(left, right));
  };
}

export const arrayDiffItems = <T>(left: T[], right: T[]) => (compare: Compare<T>): DiffItem<T>[] =>
  new ArrayDiffItems({ left, right, compare, costToAdd: 0.5, costToRemove: 0.5 }).resolve();
