import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Head, usePage } from '@inertiajs/react';
import { Paper } from '@mui/material';

interface Ingredient {
    id: number;
    name: string;
    unit?: string | null;
    cost_per_unit?: string | null;
    notes?: string | null;
}

interface PageProps {
    ingredient: Ingredient;
}

export default function Show() {
    const { props } = usePage<PageProps>();
    const ing = props.ingredient;

    const breadcrumbs = [
        { title: 'Ingredients', href: '/ingredients' },
        { title: ing.name, href: `/ingredients/${ing.id}` },
    ];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title={ing.name} />

            <div className="space-y-6 p-4">
                {/* Details */}
                <Paper variant="elevation" elevation={3} className="mx-auto max-w-5xl p-4">
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
                </Paper>

                {/* Measurements (placeholder to mirror original layout) */}
                <Paper variant="elevation" elevation={2} className="mx-auto max-w-5xl p-4">
                    <h2 className="mb-2 text-lg font-semibold text-[color:var(--color-brand-dark)]">Measurements</h2>
                    <div className="text-sm text-neutral-500">No measurements recorded.</div>
                </Paper>

                {/* Wastages (placeholder to mirror original layout) */}
                <Paper variant="elevation" elevation={1} className="mx-auto max-w-5xl p-4">
                    <h2 className="mb-2 text-lg font-semibold text-[color:var(--color-brand-dark)]">Wastages</h2>
                    <div className="text-sm text-neutral-500">No wastages recorded.</div>
                </Paper>
            </div>
        </AppSidebarLayout>
    );
}
