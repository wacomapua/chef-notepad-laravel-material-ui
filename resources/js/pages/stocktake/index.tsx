import React from 'react'
import { Head } from '@inertiajs/react'
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout'

export default function StocktakeIndex() {
  return (
    <AppSidebarLayout>
      <Head title="Stocktake" />
      <div className="p-4">
        <div className="rounded-lg border bg-white p-6">
          <h1 className="text-xl font-semibold text-[color:var(--color-brand-dark)]">Stocktake</h1>
          <p className="mt-2 text-sm text-neutral-600">This section will mirror the legacy Stocktake module. Coming soon.</p>
        </div>
      </div>
    </AppSidebarLayout>
  )
}

