export interface FilterNode {
  displayName: string
  count: number
  children?: FilterNode[]
  checked?: boolean
  isDisabled?: boolean
}

export interface FlatFilterNode {
  expandable: boolean
  displayName: string
  count: number
  level: number
  checked: boolean
  isDisabled: boolean
}