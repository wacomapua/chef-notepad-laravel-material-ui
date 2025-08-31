import React from 'react'
import { Head, usePage } from '@inertiajs/react'
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout'

interface Ingredient {
  id: number
  name: string
  unit?: string | null
  cost_per_unit?: string | null
  notes?: string | null
}

interface PageProps { ingredient: Ingredient }

export default function Show() {
  const { props } = usePage<PageProps>()
  const ing = props.ingredient

  const breadcrumbs = [
    { title: 'Ingredients', href: '/ingredients' },
    { title: ing.name, href: `/ingredients/${ing.id}` },
  ]

  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs}>
      <Head title={ing.name} />

      <div className="p-4 space-y-6">
        {/* Details */}
        <div className="mx-auto max-w-5xl rounded-lg border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-[color:var(--color-brand-dark)]">Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-xs text-neutral-500">Ingredient Name</div>
              <div className="mt-1 font-medium">{ing.name}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Unit</div>
              <div className="mt-1">{ing.unit ?? '-'}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Cost</div>
              <div className="mt-1">{ing.cost_per_unit ?? '-'}</div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="text-xs text-neutral-500">Notes</div>
              <div className="mt-1 whitespace-pre-line">{ing.notes ?? 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Measurements (placeholder to mirror original layout) */}
        <div className="mx-auto max-w-5xl rounded-lg border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--color-brand-dark)]">Measurements</h2>
          <div className="text-sm text-neutral-500">No measurements recorded.</div>
        </div>

        {/* Wastages (placeholder to mirror original layout) */}
        <div className="mx-auto max-w-5xl rounded-lg border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--color-brand-dark)]">Wastages</h2>
          <div className="text-sm text-neutral-500">No wastages recorded.</div>
        </div>
      </div>
    </AppSidebarLayout>
  )
}

