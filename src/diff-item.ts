export type DiffItem<T> = Added<T> | Removed<T> | Unchanged<T> | Changed<T>

export type Added<T> = {
  type: 'Added'
  item: T
}

export type Removed<T> = {
  type: 'Removed'
  item: T
}

export type Unchanged<T> = {
  type: 'Unchanged'
  item: T
}

export type Changed<T> = {
  type: 'Changed'
  left: T
  right: T
}
