import { Column } from '@/components/draggable-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import DragIndicator from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { MoreVertical } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface Ingredient {
    id: number;
    name: string;
    unit?: string | null;
    cost_per_unit?: string | null;
}
interface PageProps {
    ingredients: Ingredient[] | { data: Ingredient[] };
}

type Metric = { label: string; value: string; delta: string };

export default function Dashboard() {
    const metrics: Metric[] = [
        { label: 'Average Wastage', value: '2.8%', delta: '-0.4% this week' },
        { label: 'Avg Ingredient Cost', value: '$3.27', delta: '+$0.12 MoM' },
        { label: 'Price Changes (7d)', value: '14', delta: '6 ↑ 8 ↓' },
    ];

    const ChangePill: React.FC<{ value: number }> = ({ value }) => {
        const pos = value > 0;
        const neg = value < 0;
        const zero = value === 0;
        const color: 'default' | 'success' | 'error' = pos ? 'error' : neg ? 'success' : 'default';
        const arrow = pos ? '▲' : neg ? '▼' : '—';
        return (
            <Chip size="small" color={color} variant={zero ? 'outlined' : 'filled'} label={`${arrow} ${zero ? '0.0%' : value.toFixed(1) + '%'}`} />
        );
    };

    const { props } = usePage<PageProps>();
    const base: Ingredient[] = Array.isArray(props.ingredients) ? props.ingredients : (props.ingredients?.data ?? []);

    const changeFor = (id: number): number => {
        const r = id % 4;
        if (r === 0) return 0;
        if (r === 1) return 5.6;
        if (r === 2) return -3.2;
        return 1.2;
    };

    const fmtPrice = (v: number): string => `$${v.toFixed(2)}`;

    type PriceRow = { id: number; name: string; old: string; new: string; change: number };
    const priceChanges: PriceRow[] = base.map((i) => {
        const change = changeFor(i.id);
        const newVal = Number(i.cost_per_unit ?? 0);
        const oldVal = change === 0 ? newVal : newVal / (1 + change / 100);
        const unit = i.unit ? `/${i.unit}` : '';
        return {
            id: i.id,
            name: i.name,
            old: newVal ? `${fmtPrice(oldVal)}${unit}` : 'N/A',
            new: newVal ? `${fmtPrice(newVal)}${unit}` : 'N/A',
            change,
        };
    });

    const [openRow, setOpenRow] = React.useState<number | null>(null);
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    const dgStorageKey = 'dashboard.priceChanges.dg.columnOrder';
    const [orderedFields, setOrderedFields] = React.useState<string[]>(() => {
        try {
            const v = localStorage.getItem(dgStorageKey);
            return v ? JSON.parse(v) : [];
        } catch {
            return [];
        }
    });
    const visibilityKey = 'dashboard.priceChanges.dg.visibility';
    const [visibility, setVisibility] = React.useState<Record<string, boolean>>(() => {
        try {
            const raw = localStorage.getItem(visibilityKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    React.useEffect(() => {
        try {
            localStorage.setItem(visibilityKey, JSON.stringify(visibility));
        } catch {}
    }, [visibility]);
    const move = (arr: string[], from: number, to: number) => {
        const a = arr.slice();
        const [item] = a.splice(from, 1);
        a.splice(to, 0, item);
        return a;
    };
    const handleColumnOrderChange = React.useCallback((params: any) => {
        const field = params?.column?.field ?? params?.field ?? params?.colId;
        const targetIndex: number | null = typeof params?.targetIndex === 'number' ? params.targetIndex : (params?.targetIndex?.index ?? null);
        if (!field || targetIndex == null) return;
        setOrderedFields((prev) => {
            const current = prev.length ? prev.slice() : ['name', 'old', 'new', 'change', 'actions'];
            const from = current.indexOf(field);
            if (from === -1) return current;
            const next = move(current, from, Math.max(0, Math.min(targetIndex, current.length - 1)));
            try {
                localStorage.setItem(dgStorageKey, JSON.stringify(next));
            } catch {}
            return next;
        });
    }, []);
    React.useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (openRow == null) return;
            const target = e.target as Node;
            const container = document.querySelector(`[data-row-actions][data-id="${openRow}"]`);
            if (container && container.contains(target)) return;
            setOpenRow(null);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [openRow]);

    const columns: Column<PriceRow>[] = [
        { id: 'name', header: 'Ingredient', render: (r) => r.name, getSortValue: (r) => r.name.toLowerCase(), sortable: true, className: 'w-[36%]' },
        { id: 'old', header: 'Old', render: (r) => r.old, getSortValue: (r) => r.old.toLowerCase(), sortable: true, className: 'w-[18%]' },
        { id: 'new', header: 'New', render: (r) => r.new, getSortValue: (r) => r.new.toLowerCase(), sortable: true, className: 'w-[18%]' },
        {
            id: 'change',
            header: 'Change',
            render: (r) => <ChangePill value={r.change} />,
            getSortValue: (r) => r.change,
            sortable: true,
            className: 'w-[18%]',
        },
        {
            id: 'actions',
            header: <span className="sr-only">Actions</span>,
            headerAlign: 'right',
            draggable: false,
            resizable: false,
            hideable: false,
            render: (r) => (
                <div className="relative flex items-center justify-end" data-row-actions data-id={r.id}>
                    <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openRow === r.id}
                        onClick={() => setOpenRow((v) => (v === r.id ? null : r.id))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                        title="Row actions"
                    >
                        <MoreVertical className="h-4 w-4 text-neutral-600" />
                    </button>
                    {openRow === r.id && (
                        <div role="menu" className="absolute top-8 right-0 z-30 w-44 overflow-hidden rounded-md border bg-white py-1 shadow-md">
                            <Link
                                role="menuitem"
                                href={`/ingredients/${r.id}`}
                                className="block cursor-pointer px-3 py-2 text-sm hover:bg-neutral-50"
                            >
                                View
                            </Link>
                            <div className="px-3 py-2 text-sm text-neutral-400">Edit</div>
                            <div className="px-3 py-2 text-sm text-neutral-400">Duplicate</div>
                            <div className="px-3 py-2 text-sm text-neutral-400">Remove</div>
                        </div>
                    )}
                </div>
            ),
            className: 'w-[10%]',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                    {metrics.map((m) => (
                        <Grid item xs={12} md={4} key={m.label}>
                            <Card variant="elevation" elevation={3} sx={{ height: '100%' }}>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        {m.label}
                                    </Typography>
                                    <Typography variant="h5" sx={{ mt: 0.5 }}>
                                        {m.value}
                                    </Typography>
                                    <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                        {m.delta}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/*
        <Paper variant="outlined">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Recent Price Changes</Typography>
            <Link href="/ingredients" className="text-sm text-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary-hover)]">View ingredients →</Link>
          </Box>
          <Box sx={{ p: 1 }}>
            <DraggableTable columns={columns} data={priceChanges} storageKey="dashboard.priceChanges.columnOrder" />
          </Box>
        </Paper>
        */}

                {/* MUI DataGrid version for comparison */}
                <Paper variant="elevation" elevation={3}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Recent Price Changes
                        </Typography>
                        <ManageColumns
                            orderedFields={orderedFields}
                            setOrderedFields={setOrderedFields}
                            visibility={visibility}
                            setVisibility={setVisibility}
                            allFields={['name', 'old', 'new', 'change', 'actions']}
                        />
                    </Box>
                    <Box sx={{ p: 1 }}>
                        {(() => {
                            const baseColumns: GridColDef[] = [
                                { field: 'name', headerName: 'Ingredient', flex: 1.2, sortable: true },
                                { field: 'old', headerName: 'Old', flex: 0.8, sortable: true },
                                { field: 'new', headerName: 'New', flex: 0.8, sortable: true },
                                {
                                    field: 'change',
                                    headerName: 'Change',
                                    flex: 0.7,
                                    sortable: true,
                                    renderCell: (params) => <ChangePill value={params.value as number} />,
                                },
                                {
                                    field: 'actions',
                                    headerName: '',
                                    sortable: false,
                                    filterable: false,
                                    width: 60,
                                    renderCell: (params) => (
                                        <>
                                            <IconButton
                                                size="small"
                                                aria-label="Row actions"
                                                onClick={(e) => {
                                                    setOpenRow(params.row.id as number);
                                                    setMenuAnchor(e.currentTarget);
                                                }}
                                            >
                                                <MoreVertical className="h-4 w-4 text-neutral-600" />
                                            </IconButton>
                                            <Menu
                                                anchorEl={menuAnchor}
                                                open={openRow === params.row.id && Boolean(menuAnchor)}
                                                onClose={() => {
                                                    setOpenRow(null);
                                                    setMenuAnchor(null);
                                                }}
                                            >
                                                <MenuItem component="a" href={`/ingredients/${params.row.id}`}>
                                                    View
                                                </MenuItem>
                                                <MenuItem disabled>Edit</MenuItem>
                                                <MenuItem disabled>Duplicate</MenuItem>
                                                <MenuItem disabled>Remove</MenuItem>
                                            </Menu>
                                        </>
                                    ),
                                },
                            ];
                            const map = new Map(baseColumns.map((c) => [c.field, c]));
                            const defaultOrder = baseColumns.map((c) => c.field);
                            const order = orderedFields.length ? orderedFields : defaultOrder;
                            const missing = defaultOrder.filter((f) => !order.includes(f));
                            const finalOrder = [...order, ...missing];
                            const cols = finalOrder
                                .filter((f) => visibility[f] !== false)
                                .map((f) => map.get(f)!)
                                .filter(Boolean);

                            const extraProps: any = { onColumnOrderChange: handleColumnOrderChange };

                            return (
                                <div style={{ width: '100%' }}>
                                    <DataGrid
                                        rows={priceChanges}
                                        columns={cols}
                                        columnVisibilityModel={visibility}
                                        onColumnVisibilityModelChange={(m) => setVisibility(m as any)}
                                        disableRowSelectionOnClick
                                        disableColumnReorder={false}
                                        autoHeight
                                        initialState={{
                                            pagination: { paginationModel: { pageSize: 5, page: 0 } },
                                        }}
                                        pageSizeOptions={[5, 10, 25]}
                                        {...extraProps}
                                    />
                                </div>
                            );
                        })()}
                    </Box>
                </Paper>
            </Box>
        </AppLayout>
    );
}

// Manage Columns popover with drag to reorder and visibility toggles
function ManageColumns({
    orderedFields,
    setOrderedFields,
    visibility,
    setVisibility,
    allFields,
}: {
    orderedFields: string[];
    setOrderedFields: (updater: (prev: string[]) => string[] | string[]) => void;
    visibility: Record<string, boolean>;
    setVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    allFields: string[];
}) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);
    const onOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
    const onClose = () => setAnchorEl(null);

    const order = orderedFields.length ? orderedFields : allFields;
    const [dragField, setDragField] = React.useState<string | null>(null);

    const onDragStart = (field: string) => (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', field);
        setDragField(field);
    };
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    const onDrop = (target: string) => (e: React.DragEvent) => {
        e.preventDefault();
        const from = e.dataTransfer.getData('text/plain') || dragField;
        if (!from) return;
        setOrderedFields((prev) => {
            const base = prev.length ? prev.slice() : allFields.slice();
            const fromIdx = base.indexOf(from);
            const toIdx = base.indexOf(target);
            if (fromIdx === -1 || toIdx === -1) return base;
            const next = base.slice();
            next.splice(fromIdx, 1);
            next.splice(toIdx, 0, from);
            try {
                localStorage.setItem('dashboard.priceChanges.dg.columnOrder', JSON.stringify(next));
            } catch {}
            return next;
        });
        setDragField(null);
    };

    return (
        <>
            <Button variant="outlined" size="small" onClick={onOpen} sx={{ textTransform: 'none', borderRadius: 9999 }}>
                Columns
            </Button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ p: 1, width: 260 }}>
                    <Typography variant="caption" sx={{ px: 1, color: 'text.secondary' }}>
                        Drag to reorder, toggle visibility
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <List dense>
                        {order.map((f) => (
                            <ListItem
                                key={f}
                                secondaryAction={
                                    <Checkbox
                                        edge="end"
                                        checked={visibility[f] !== false}
                                        onChange={(e) => setVisibility((prev) => ({ ...prev, [f]: e.target.checked }))}
                                    />
                                }
                                draggable
                                onDragStart={onDragStart(f)}
                                onDragOver={onDragOver}
                                onDrop={onDrop(f)}
                                sx={{ cursor: 'grab' }}
                            >
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <DragIndicator fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={labelForField(f)} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </>
    );
}

function labelForField(f: string) {
    switch (f) {
        case 'name':
            return 'Ingredient';
        case 'old':
            return 'Old';
        case 'new':
            return 'New';
        case 'change':
            return 'Change';
        case 'actions':
            return 'Actions';
        default:
            return f;
    }
}
