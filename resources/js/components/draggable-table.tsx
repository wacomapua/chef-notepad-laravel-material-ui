import React from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, MoreHorizontal } from 'lucide-react'

export type Column<T> = {
  id: string
  header: React.ReactNode
  render: (row: T) => React.ReactNode
  className?: string
  // Optional sorting support. If provided, the column becomes sortable.
  getSortValue?: (row: T) => string | number | Date
  sortFn?: (a: T, b: T) => number
  sortable?: boolean
  // Behaviour flags for UX control
  draggable?: boolean // default true
  resizable?: boolean // default true
  hideable?: boolean // default true (if false, omit from column menu and always show)
  headerAlign?: 'left' | 'center' | 'right'
}

export function useColumnOrder(defaultOrder: string[], storageKey: string) {
  const reconcile = React.useCallback((saved: string[] | null, current: string[]) => {
    if (!saved || saved.length === 0) return current
    // Drop ids that no longer exist, keep existing order, append any new ids
    const filtered = saved.filter((id) => current.includes(id))
    const missing = current.filter((id) => !filtered.includes(id))
    return [...filtered, ...missing]
  }, [])

  const [order, setOrder] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      const saved = raw ? (JSON.parse(raw) as string[]) : null
      return reconcile(saved, defaultOrder)
    } catch {}
    return defaultOrder
  })

  // Persist order
  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(order))
    } catch {}
  }, [order, storageKey])

  // If columns change (e.g. new column added), merge it into the saved order
  React.useEffect(() => {
    setOrder((prev) => reconcile(prev, defaultOrder))
  }, [defaultOrder, reconcile])

  const onDrop = React.useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return
    setOrder((prev) => {
      const next = [...prev]
      const fromIndex = next.indexOf(fromId)
      const toIndex = next.indexOf(toId)
      if (fromIndex === -1 || toIndex === -1) return prev
      next.splice(fromIndex, 1)
      next.splice(toIndex, 0, fromId)
      return next
    })
  }, [])

  return { order, setOrder, onDrop }
}

export function DraggableTable<T extends { id: number | string }>({
  columns,
  data,
  storageKey,
  rowClassName,
  enableSelection = true,
}: {
  columns: Column<T>[]
  data: T[]
  storageKey: string
  rowClassName?: string
  enableSelection?: boolean
}) {
  const defaultOrder = React.useMemo(() => columns.map((c) => c.id), [columns])
  const { order, onDrop } = useColumnOrder(defaultOrder, storageKey)

  const colMap = React.useMemo(() => {
    const m = new Map(columns.map((c) => [c.id, c]))
    return m
  }, [columns])

  const orderedColumns = order.map((id) => colMap.get(id)!).filter(Boolean)
  const orderedIdsKey = React.useMemo(() => order.join('|'), [order])

  // Column visibility state
  const visibilityKey = `${storageKey}.visibility`
  const [visible, setVisible] = React.useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(visibilityKey)
      if (raw) return JSON.parse(raw)
    } catch {}
    const all: Record<string, boolean> = {}
    for (const c of orderedColumns) all[c.id] = true
    return all
  })
  React.useEffect(() => {
    // reconcile visibility with any new/removed columns
    setVisible((prev) => {
      const next: Record<string, boolean> = {}
      for (const c of orderedColumns) next[c.id] = prev[c.id] ?? true
      // If no change, return prev to avoid re-renders
      const same = Object.keys(next).length === Object.keys(prev).length && Object.keys(next).every((k) => prev[k] === next[k])
      return same ? prev : next
    })
  }, [orderedIdsKey])
  React.useEffect(() => {
    try { localStorage.setItem(visibilityKey, JSON.stringify(visible)) } catch {}
  }, [visible, visibilityKey])

  const displayedColumns = orderedColumns.filter((c) => (c.hideable === false ? true : visible[c.id] !== false))

  // Column width state (px) persisted to localStorage
  const widthKey = `${storageKey}.widths`
  const [widths, setWidths] = React.useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(widthKey)
      if (raw) return JSON.parse(raw)
    } catch {}
    return {}
  })

  // Reconcile widths with current columns
  React.useEffect(() => {
    setWidths((prev) => {
      const next: Record<string, number> = {}
      for (const c of orderedColumns) {
        next[c.id] = prev[c.id] ?? 0 // 0 indicates "needs measuring/default"
      }
      // Only update when something changed
      const keys = Object.keys(next)
      const same = keys.length === Object.keys(prev).length && keys.every((k) => prev[k] === next[k])
      return same ? prev : next
    })
  }, [orderedIdsKey])

  // Persist widths
  React.useEffect(() => {
    try { localStorage.setItem(widthKey, JSON.stringify(widths)) } catch {}
  }, [widths, widthKey])

  // Measure header cell widths for any columns lacking width
  const headerRefs = React.useRef(new Map<string, HTMLTableCellElement>())
  const setHeaderRef = (id: string) => (el: HTMLTableCellElement | null) => {
    const m = headerRefs.current
    if (el) m.set(id, el)
    else m.delete(id)
  }

  React.useEffect(() => {
    setWidths((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [id, el] of headerRefs.current.entries()) {
        if (!next[id] || next[id] <= 0) {
          const measured = el.clientWidth || 160
          next[id] = Math.max(120, measured)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [orderedColumns.length])

  // Resizing logic
  const resizing = React.useRef<{ id: string; startX: number; startW: number } | null>(null)

  // Row selection state
  const [selected, setSelected] = React.useState<Set<string | number>>(new Set())
  const allIds = React.useMemo(() => data.map((r) => r.id), [data])
  const visibleRowIds = allIds // data already filtered by parent; selection applies to current view
  const allSelected = enableSelection && visibleRowIds.length > 0 && visibleRowIds.every((id) => selected.has(id))
  const someSelected = enableSelection && !allSelected && visibleRowIds.some((id) => selected.has(id))
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      const every = visibleRowIds.every((id) => next.has(id))
      if (every) {
        visibleRowIds.forEach((id) => next.delete(id))
      } else {
        visibleRowIds.forEach((id) => next.add(id))
      }
      return next
    })
  }
  const toggleOne = (id: string | number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Sorting state
  type SortState = { id: string; dir: 'asc' | 'desc' } | null
  const [sort, setSort] = React.useState<SortState>(null)
  const sortedData = React.useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.id === sort.id)
    if (!col) return data
    const cmp = col.sortFn
      ? (a: T, b: T) => col.sortFn!(a, b)
      : (a: T, b: T) => {
          const av = col.getSortValue ? col.getSortValue(a) : String(col.render(a) ?? '')
          const bv = col.getSortValue ? col.getSortValue(b) : String(col.render(b) ?? '')
          const an = av instanceof Date ? av.getTime() : (typeof av === 'number' ? av : String(av).toLowerCase())
          const bn = bv instanceof Date ? bv.getTime() : (typeof bv === 'number' ? bv : String(bv).toLowerCase())
          if (an < bn) return -1
          if (an > bn) return 1
          return 0
        }
    const out = [...data].sort((a, b) => (sort.dir === 'asc' ? cmp(a, b) : -cmp(a, b)))
    return out
  }, [data, columns, sort])

  const onResizeMouseDown = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startW = widths[id] || headerRefs.current.get(id)?.clientWidth || 160
    resizing.current = { id, startX: (e as React.MouseEvent).clientX, startW }
    window.addEventListener('mousemove', onMouseMove as any)
    window.addEventListener('mouseup', onMouseUp as any)
  }

  const onMouseMove = (e: MouseEvent) => {
    const r = resizing.current
    if (!r) return
    const dx = e.clientX - r.startX
    const newW = Math.max(120, r.startW + dx)
    setWidths((prev) => ({ ...prev, [r.id]: newW }))
  }

  const onMouseUp = () => {
    resizing.current = null
    window.removeEventListener('mousemove', onMouseMove as any)
    window.removeEventListener('mouseup', onMouseUp as any)
  }

  React.useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove as any)
      window.removeEventListener('mouseup', onMouseUp as any)
    }
  }, [])

  const handleDragStart = (id: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDrop = (toId: string) => (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault()
    const fromId = e.dataTransfer.getData('text/plain')
    if (fromId) onDrop(fromId, toId)
  }

  // Columns action menu (visibility toggles)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const cycleSort = (id: string, enabled: boolean) => () => {
    if (!enabled) return
    setSort((prev) => {
      if (!prev || prev.id !== id) return { id, dir: 'asc' }
      if (prev.dir === 'asc') return { id, dir: 'desc' }
      return null // off
    })
  }

  const sortIcon = (id: string, enabled: boolean) => {
    if (!enabled) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
    if (!sort || sort.id !== id) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
    return sort.dir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-end gap-2 border-b bg-white px-2 py-2">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-[color:var(--color-brand-dark)] hover:bg-[color:var(--color-brand-light-3)]/50"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Table actions"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            Columns
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-1 w-44 rounded-md border bg-white p-2 shadow-md"
            >
              <div className="mb-1 px-1 text-[11px] uppercase tracking-wide text-neutral-500">Toggle columns</div>
              <div className="max-h-60 space-y-1 overflow-auto pr-1">
                {orderedColumns.filter((c) => c.hideable !== false).map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={visible[c.id] !== false}
                      onChange={(e) => setVisible((prev) => ({ ...prev, [c.id]: e.target.checked }))}
                    />
                    <span className="text-sm text-neutral-800">{typeof c.header === 'string' ? c.header : c.id}</span>
                  </label>
                ))}
                {orderedColumns.every((c) => c.hideable === false) && (
                  <div className="px-1 text-xs text-neutral-500">No hideable columns</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <table className="min-w-full table-fixed divide-y divide-[color:var(--color-brand-light-3)]">
        <thead className="bg-[color:var(--color-brand-secondary)]">
          <tr>
            {enableSelection && (
              <th className="w-10 select-none px-2 py-2 text-left text-xs font-semibold text-[color:var(--color-brand-dark)]">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = Boolean(someSelected)
                  }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5"
                />
              </th>
            )}
            {displayedColumns.map((c) => {
              const sortable = Boolean(c.sortable || c.getSortValue || c.sortFn)
              const isDraggable = c.draggable !== false
              const isResizable = c.resizable !== false
              const alignCls = c.headerAlign === 'right' ? 'text-right' : c.headerAlign === 'center' ? 'text-center' : 'text-left'
              const justifyCls = c.headerAlign === 'right' ? 'justify-end' : c.headerAlign === 'center' ? 'justify-center' : ''
              return (
                <th
                  key={c.id}
                  ref={setHeaderRef(c.id)}
                  draggable={isDraggable}
                  onDragStart={isDraggable ? handleDragStart(c.id) : undefined}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(c.id)}
                  className={`relative ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} select-none px-4 py-2 ${alignCls} text-xs font-semibold text-[color:var(--color-brand-dark)] ${c.className ?? ''}`}
                  style={{ width: widths[c.id] ? `${widths[c.id]}px` : undefined }}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 ${justifyCls} ${justifyCls ? 'w-full' : ''} hover:opacity-90`}
                      onClick={cycleSort(c.id, sortable)}
                      aria-label="Sort column"
                    >
                      <span className={`${justifyCls ? 'ml-auto' : ''}`}>{c.header}</span>
                      {sortIcon(c.id, sortable)}
                    </button>
                  ) : (
                    <div className={`flex items-center gap-1.5 ${justifyCls} ${justifyCls ? 'w-full' : ''}`}>
                      <span>{c.header}</span>
                    </div>
                  )}
                  {isResizable && (
                    <span
                      aria-label={`Resize column ${String(c.header)}`}
                      onMouseDown={onResizeMouseDown(c.id)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none rounded-sm hover:bg-black/10"
                      role="separator"
                    />
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--color-brand-light-3)]">
          {sortedData.map((row) => (
            <tr key={String(row.id)} className={rowClassName}>
              {enableSelection && (
                <td className="w-10 px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select row ${String(row.id)}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    className="h-3.5 w-3.5"
                  />
                </td>
              )}
              {displayedColumns.map((c) => (
                <td
                  key={c.id}
                  className={`px-4 py-2 ${c.className ?? ''}`}
                  style={{ width: widths[c.id] ? `${widths[c.id]}px` : undefined }}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

