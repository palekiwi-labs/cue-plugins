/**
 * Order context rows as a parent-child forest, flattened depth-first,
 * with box-drawing connectors. Port of cue.nvim's lua/cue/tree.lua
 * (`order` with `bump = true`, and `prefix`).
 *
 * The parent edge comes from the data (`parent` canonical address).
 * Rows whose parent is absent, self-referential or outside the row set
 * (e.g. an unpinned parent) render as roots. Every sibling group is
 * ranked by the newest `lastLoggedAt` in its subtree, so a hot child
 * floats its cluster up; input (CLI recency) order breaks ties. Cycles
 * are guarded: every row renders exactly once.
 */

export interface TreeRow {
  address: string
  parent?: string
  lastLoggedAt: number
}

export interface TreeEntry<T extends TreeRow> {
  row: T
  depth: number
  /** One flag per ancestor level below the root: does it have more siblings. */
  connectors: boolean[]
  isLast: boolean
}

export function orderTree<T extends TreeRow>(rows: readonly T[]): TreeEntry<T>[] {
  const byAddress = new Map<string, T>()
  for (const r of rows) byAddress.set(r.address, r)

  const children = new Map<string, T[]>()
  const roots: T[] = []
  for (const r of rows) {
    const p = r.parent
    if (p && p !== r.address && byAddress.has(p)) {
      const kids = children.get(p) ?? []
      kids.push(r)
      children.set(p, kids)
    } else {
      roots.push(r)
    }
  }

  const index = new Map<T, number>()
  rows.forEach((r, i) => index.set(r, i))
  const best = new Map<T, number>()
  const computing = new Set<T>()
  const subtreeMax = (r: T): number => {
    const known = best.get(r)
    if (known !== undefined) return known
    if (computing.has(r)) return r.lastLoggedAt
    computing.add(r)
    let max = r.lastLoggedAt
    for (const k of children.get(r.address) ?? []) max = Math.max(max, subtreeMax(k))
    computing.delete(r)
    best.set(r, max)
    return max
  }
  const bySubtree = (a: T, b: T) =>
    subtreeMax(b) - subtreeMax(a) || index.get(a)! - index.get(b)!
  roots.sort(bySubtree)
  for (const kids of children.values()) kids.sort(bySubtree)

  const flat: TreeEntry<T>[] = []
  const visited = new Set<T>()
  const visit = (row: T, depth: number, connectors: boolean[], isLast: boolean) => {
    visited.add(row)
    flat.push({ row, depth, connectors, isLast })
    const kids = children.get(row.address) ?? []
    kids.forEach((kid, i) => {
      if (visited.has(kid)) return
      // Roots render flush left: their siblings are other trees, not a rail.
      const next = depth > 0 ? [...connectors, !isLast] : [...connectors]
      visit(kid, depth + 1, next, i === kids.length - 1)
    })
  }
  roots.forEach((r, i) => {
    if (!visited.has(r)) visit(r, 0, [], i === roots.length - 1)
  })
  for (const r of rows) if (!visited.has(r)) visit(r, 0, [], true)
  return flat
}

/** Connector cell: "│ "/"  " per ancestor level, then "├─"/"└─"; "" for roots. */
export function treePrefix(entry: TreeEntry<TreeRow>): string {
  if (entry.depth === 0) return ""
  let out = ""
  for (let i = 0; i < entry.depth - 1; i++) out += entry.connectors[i] ? "│ " : "  "
  return out + (entry.isLast ? "└─" : "├─")
}
