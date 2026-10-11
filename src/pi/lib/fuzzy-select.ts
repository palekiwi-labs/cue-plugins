import type { ExtensionUIContext } from "@earendil-works/pi-coding-agent"
import { DynamicBorder } from "@earendil-works/pi-coding-agent"
import {
  Container,
  fuzzyFilter,
  Input,
  type SelectItem,
  SelectList,
  Text,
} from "@earendil-works/pi-tui"

const MAX_VISIBLE = 12

/**
 * Narrow items by a fuzzy query, preserving the input order when the
 * query is empty (callers pass items pre-sorted, e.g. by recency).
 */
export function fuzzyNarrow(items: string[], query: string): string[] {
  return fuzzyFilter(items, query, (s) => s)
}

/**
 * A picker item. `value` is what the picker resolves; `text` is what
 * the query fuzzy-matches and what a filtered list shows (default:
 * value). `label` (e.g. a tree-indented slug) is shown only while the
 * query is empty, since a filtered list breaks the structure it draws.
 */
export interface PickItem {
  value: string
  text?: string
  label?: string
}

/**
 * Like `ui.select`, with a type-to-filter fuzzy query line. Arrow keys
 * and enter/escape drive the list; every other key edits the query.
 * Resolves the chosen item, or undefined on cancel.
 */
export async function fuzzySelect(
  ui: ExtensionUIContext,
  title: string,
  items: readonly (string | PickItem)[],
): Promise<string | undefined> {
  const picks: PickItem[] = items.map((i) =>
    typeof i === "string" ? { value: i } : i,
  )

  const picked = await ui.custom<string | null>((tui, theme, kb, done) => {
    const listTheme = {
      selectedPrefix: (t: string) => theme.fg("accent", t),
      selectedText: (t: string) => theme.fg("accent", t),
      description: (t: string) => theme.fg("muted", t),
      scrollInfo: (t: string) => theme.fg("dim", t),
      noMatch: (t: string) => theme.fg("warning", t),
    }
    const input = new Input()
    input.focused = true
    const holder = new Container()
    let list!: SelectList

    const rebuild = () => {
      const query = input.getValue()
      const textOf = (p: PickItem) => p.text ?? p.value
      const shown = fuzzyFilter(picks, query, textOf)
      const entries: SelectItem[] = shown.map((p) => ({
        value: p.value,
        label: query.trim() === "" ? (p.label ?? textOf(p)) : textOf(p),
      }))
      list = new SelectList(entries, MAX_VISIBLE, listTheme)
      list.onSelect = (item) => done(item.value)
      list.onCancel = () => done(null)
      holder.clear()
      holder.addChild(list)
    }
    rebuild()

    const container = new Container()
    const border = () => new DynamicBorder((s: string) => theme.fg("accent", s))
    container.addChild(border())
    container.addChild(new Text(theme.fg("accent", theme.bold(title))))
    container.addChild(input)
    container.addChild(holder)
    container.addChild(
      new Text(theme.fg("dim", "type to filter • ↑↓ navigate • enter select • esc cancel")),
    )
    container.addChild(border())

    const listKeys = [
      "tui.select.up",
      "tui.select.down",
      "tui.select.pageUp",
      "tui.select.pageDown",
      "tui.select.confirm",
      "tui.select.cancel",
    ] as const

    return {
      render: (width: number) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput(data: string) {
        if (listKeys.some((k) => kb.matches(data, k))) {
          list.handleInput(data)
        } else {
          const before = input.getValue()
          input.handleInput(data)
          if (input.getValue() !== before) rebuild()
        }
        tui.requestRender()
      },
    }
  })
  return picked ?? undefined
}
