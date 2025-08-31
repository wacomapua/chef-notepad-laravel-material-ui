import { Column, DraggableTable } from '@/components/draggable-table';
import { Badge } from '@/components/ui/badge';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { getCsrfTokenFromCookie } from '@/lib/csrf';
import { Head, Link, usePage } from '@inertiajs/react';
import AddRounded from '@mui/icons-material/AddRounded';
import DragIndicator from '@mui/icons-material/DragIndicator';
import { Paper } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { MoreVertical } from 'lucide-react';
import React from 'react';

interface ServerTag {
    id: number;
    name: string;
    colour?: string | null;
}

interface Ingredient {
    id: number;
    name: string;
    unit?: string | null;
    cost_per_unit?: string | null;
    tags?: ServerTag[];
}

// Manage Columns popover for Ingredients DataGrid
function ManageColumns({
    orderedFields,
    setOrderedFields,
    visibility,
    setVisibility,
    allFields,
    storageKeyPrefix,
    renderTrigger,
}: {
    orderedFields: string[];
    setOrderedFields: (updater: (prev: string[]) => string[] | string[]) => void;
    visibility: Record<string, boolean>;
    setVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    allFields: string[];
    storageKeyPrefix: string;
    renderTrigger?: (onOpen: (e: React.MouseEvent<HTMLButtonElement>) => void) => React.ReactNode;
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
                localStorage.setItem(`${storageKeyPrefix}.columnOrder`, JSON.stringify(next));
            } catch {}
            return next;
        });
        setDragField(null);
    };

    return (
        <>
            {renderTrigger ? (
                renderTrigger(onOpen)
            ) : (
                <Button variant="outlined" size="small" onClick={onOpen} sx={{ textTransform: 'none', borderRadius: 9999 }}>
                    Columns
                </Button>
            )}
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
                                <ListItemText primary={ingredientLabelForField(f)} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </>
    );
}

function ingredientLabelForField(f: string) {
    switch (f) {
        case 'name':
            return 'Name';
        case 'tags':
            return 'Tags';
        case 'price':
            return 'Price';
        case 'price_change':
            return 'Price Change';
        case 'last_updated':
            return 'Price Last Updated';
        case 'actions':
            return 'Actions';
        default:
            return f;
    }
}
// Enriched row type for UI-only demo fields
interface IngredientRow extends Ingredient {
    // current price being edited/displayed (number for easier maths)
    price: number | null;
    // original price baseline used to compute % change
    original_price: number | null;
    tags: string[];
    price_change: number; // percentage change, can be negative/zero/positive
    last_updated: string; // ISO date string for demo
}

interface PageProps {
    ingredients: {
        data: Ingredient[];
    };
}

export default function Index() {
    const { props } = usePage<PageProps>();
    const baseItems = props.ingredients.data;

    // Build UI rows with baseline price for computing deltas and server-provided tags
    const initialRows = React.useMemo<IngredientRow[]>(() => {
        const lastUpdatedFor = (id: number): string => {
            const r = id % 3;
            const now = Date.now();
            const days = r === 0 ? 3 : r === 1 ? 10 : 21;
            return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
        };
        return baseItems.map((i) => {
            const priceNum = i.cost_per_unit != null ? Number(i.cost_per_unit) : null;
            const tagNames = Array.isArray(i.tags) ? i.tags.map((t) => String(t?.name ?? '').trim()).filter((t) => t.length > 0) : [];
            return {
                ...i,
                price: priceNum,
                original_price: priceNum,
                tags: tagNames,
                price_change: 0,
                last_updated: lastUpdatedFor(i.id),
            };
        });
    }, [baseItems]);

    const [rows, setRows] = React.useState<IngredientRow[]>(initialRows);
    React.useEffect(() => setRows(initialRows), [initialRows]);

    // Map of tag name -> colour token (lowercase)
    const [tagColorByName, setTagColorByName] = React.useState<Record<string, string>>({});
    React.useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/tags', { headers: { Accept: 'application/json' } });
                const data = await res.json();
                const map: Record<string, string> = {};
                (Array.isArray(data?.data) ? data.data : []).forEach((t: any) => {
                    const n = String(t?.name ?? '').trim();
                    if (!n) return;
                    map[n] = String(t?.colour ?? 'default').toLowerCase();
                });
                setTagColorByName(map);
            } catch {}
        })();
    }, []);

    const [query, setQuery] = React.useState('');
    const items = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((i) => i.name.toLowerCase().includes(q));
    }, [rows, query]);

    const TagBadge: React.FC<{ tag: string }> = ({ tag }) => {
        const color = (() => {
            switch (tag) {
                case 'Dairy':
                    return 'secondary' as const;
                case 'Vegetable':
                    return 'success' as const;
                case 'Fruit':
                    return 'warning' as const;
                case 'Dry Goods':
                    return 'default' as const;
                case 'Baking':
                    return 'info' as const;
                case 'Oils':
                    return 'primary' as const;
                default:
                    return 'default' as const;
            }
        })();
        return <Badge color={color}>{tag}</Badge>;
    };

    const ChangePill: React.FC<{ value: number }> = ({ value }) => {
        const pos = value > 0;
        const neg = value < 0;
        const zero = value === 0;
        // Per client request: red for increases, green for decreases
        const cls = pos
            ? 'bg-red-50 text-red-700 border-red-200'
            : neg
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-neutral-100 text-neutral-700 border-neutral-200';
        const arrow = pos ? '▲' : neg ? '▼' : '—';
        return (
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}>
                <span aria-hidden>{arrow}</span>
                <span>{zero ? '0.0%' : `${value.toFixed(1)}%`}</span>
            </span>
        );
    };

    const [openRow, setOpenRow] = React.useState<number | null>(null);

    // Inline tag editing: sync to server
    const saveTags = React.useCallback(async (id: number, nextTags: string[]) => {
        const token = getCsrfTokenFromCookie();
        // optimistic update
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, tags: nextTags } : r)));
        try {
            const res = await fetch(`/ingredients/${id}/tags`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({ tags: nextTags }),
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const names = Array.isArray(data?.tags) ? data.tags.map((t: any) => t?.name).filter(Boolean) : nextTags;
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, tags: names } : r)));
        } catch (e) {
            console.error('Failed to save tags', e);
            // no rollback source of truth; leave optimistic value
        }
    }, []);
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    // DataGrid column order + visibility state persisted to localStorage
    const storagePrefix = 'ingredients.dg';
    const orderKey = `${storagePrefix}.columnOrder`;
    const visibilityKey = `${storagePrefix}.visibility`;
    const [orderedFields, setOrderedFields] = React.useState<string[]>(() => {
        try {
            const v = localStorage.getItem(orderKey);
            return v ? JSON.parse(v) : [];
        } catch {
            return [];
        }
    });
    const [visibility, setVisibility] = React.useState<Record<string, boolean>>(() => {
        try {
            const v = localStorage.getItem(visibilityKey);
            return v ? JSON.parse(v) : {};
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
        const [it] = a.splice(from, 1);
        a.splice(to, 0, it);
        return a;
    };
    const handleColumnOrderChange = React.useCallback((params: any) => {
        const field = params?.column?.field ?? params?.field ?? params?.colId;
        const targetIndex: number | null = typeof params?.targetIndex === 'number' ? params.targetIndex : (params?.targetIndex?.index ?? null);
        if (!field || targetIndex == null) return;
        setOrderedFields((prev) => {
            const current = prev.length ? prev.slice() : ['name', 'tags', 'price', 'price_change', 'last_updated', 'actions'];
            const from = current.indexOf(field);
            if (from === -1) return current;
            const next = move(current, from, Math.max(0, Math.min(targetIndex, current.length - 1)));
            try {
                localStorage.setItem(orderKey, JSON.stringify(next));
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

    // Inline editing state for price
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [editValue, setEditValue] = React.useState<string>('');
    const startEdit = (row: IngredientRow) => {
        setEditingId(row.id);
        setEditValue(row.price != null ? String(row.price) : '');
    };
    const commitEdit = () => {
        if (editingId == null) return;
        const num = parseFloat(editValue);
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== editingId) return r;
                const newPrice = isNaN(num) ? null : num;
                const base = r.original_price;
                const pct = base && base > 0 && newPrice != null ? ((newPrice - base) / base) * 100 : 0;
                return {
                    ...r,
                    price: newPrice,
                    price_change: Number.isFinite(pct) ? pct : 0,
                    last_updated: new Date().toISOString(),
                };
            }),
        );
        setEditingId(null);
        setEditValue('');
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    // DraggableTable columns (legacy) – retained but table is commented out below
    const columns: Column<IngredientRow>[] = [
        {
            id: 'name',
            header: 'Name',
            render: (ing) => (
                <Link
                    href={`/ingredients/${ing.id}`}
                    className="text-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary-hover)]"
                >
                    {ing.name}
                </Link>
            ),
            getSortValue: (ing) => ing.name.toLowerCase(),
            sortable: true,
            className: 'w-[28%]',
        },
        {
            id: 'tags',
            header: 'Tags',
            render: (ing) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    {ing.tags.map((t) => (
                        <TagBadge key={`${ing.id}-${t}`} tag={t} />
                    ))}
                </div>
            ),
            getSortValue: (ing) => ing.tags.join(', ').toLowerCase(),
            sortable: true,
            className: 'w-[22%]',
        },
        {
            id: 'price',
            header: 'Price',
            render: (row) => {
                const isEditing = editingId === row.id;
                const display = row.price != null ? `$${row.price.toFixed(2)}${row.unit ? ` (${row.unit})` : ''}` : 'N/A';
                return (
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <input
                                autoFocus
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                }}
                                className="w-28 rounded-md border px-2 py-1 text-sm"
                                aria-label="Edit price"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="text-left text-[color:var(--color-brand-dark)] hover:underline"
                                title="Click to edit price"
                            >
                                {display}
                            </button>
                        )}
                    </div>
                );
            },
            getSortValue: (ing) => Number(ing.price ?? 0),
            sortable: true,
            className: 'w-[15%]',
        },
        {
            id: 'price_change',
            header: 'Price Change',
            render: (ing) => <ChangePill value={ing.price_change} />,
            getSortValue: (ing) => ing.price_change,
            sortable: true,
            className: 'w-[15%]',
        },
        {
            id: 'last_updated',
            header: 'Price Last Updated',
            render: (ing) => {
                const d = new Date(ing.last_updated);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                const cls = diffDays > 14 ? 'text-red-600' : diffDays >= 7 ? 'text-yellow-600' : 'text-black';
                const relative = (() => {
                    if (diffDays <= 0) return 'today';
                    if (diffDays === 1) return 'yesterday';
                    if (diffDays < 7) return `${diffDays} days ago`;
                    const weeks = Math.floor(diffDays / 7);
                    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                })();
                const exact = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                return (
                    <span className={cls} title={exact}>
                        {relative}
                    </span>
                );
            },
            getSortValue: (ing) => new Date(ing.last_updated),
            sortable: true,
            className: 'w-[12%]',
        },
        {
            id: 'actions',
            header: <span className="sr-only">Actions</span>,
            headerAlign: 'right',
            draggable: false,
            resizable: false,
            hideable: false,
            render: (ing) => (
                <div className="relative flex items-center justify-end" data-row-actions data-id={ing.id}>
                    <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openRow === ing.id}
                        onClick={() => setOpenRow((v) => (v === ing.id ? null : ing.id))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                        title="Row actions"
                    >
                        <MoreVertical className="h-4 w-4 text-neutral-600" />
                    </button>
                    {openRow === ing.id && (
                        <div role="menu" className="absolute top-8 right-0 z-30 w-44 overflow-hidden rounded-md border bg-white py-1 shadow-md">
                            <Link
                                role="menuitem"
                                href={`/ingredients/${ing.id}`}
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
            className: 'w-[8%]',
        },
    ];

    const breadcrumbs = [{ title: 'Ingredients', href: '/ingredients' }];

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <Head title="Ingredients" />

            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[color:var(--color-brand-dark)]">Ingredients</h2>
                </div>

                {/* Top controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        className="w-64 rounded-md border px-3 py-2 text-sm"
                        aria-label="Search ingredients"
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="contained" color="primary" size="small" sx={{ textTransform: 'none' }}>
                            Update Prices
                        </Button>
                        <Button variant="contained" color="primary" size="small" sx={{ textTransform: 'none' }}>
                            Import
                        </Button>
                        <Button variant="contained" color="primary" size="small" sx={{ textTransform: 'none' }}>
                            Export
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            sx={{ textTransform: 'none' }}
                            startIcon={<AddRounded fontSize="small" />}
                        >
                            Create Ingredient
                        </Button>
                    </div>
                </div>

                {/* Legacy table commented out in favor of MUI DataGrid default style */}
                {false && (
                    <Paper variant="elevation" elevation={3} className="overflow-hidden rounded-lg border bg-white">
                        <DraggableTable
                            columns={columns}
                            data={items}
                            storageKey="ingredients.columnOrder"
                            rowClassName="hover:bg-[color:var(--color-brand-light-3)]/40"
                        />
                    </Paper>
                )}

                <Paper variant="elevation" elevation={3} sx={{ p: 1 }}>
                    {(() => {
                        const baseColumns: GridColDef[] = [
                            {
                                field: 'name',
                                headerName: 'Name',
                                flex: 1.2,
                                sortable: true,
                                renderCell: (params) => (
                                    <Link
                                        href={`/ingredients/${params.row.id}`}
                                        className="text-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary-hover)]"
                                    >
                                        {params.value as string}
                                    </Link>
                                ),
                            },
                            {
                                field: 'tags',
                                headerName: 'Tags',
                                flex: 1.2,
                                sortable: true,
                                valueGetter: (p) => {
                                    const tags = Array.isArray(p?.row?.tags) ? (p.row.tags as string[]) : [];
                                    const clean = tags.map((t) => String(t ?? '').trim()).filter((t) => t.length > 0);
                                    return clean.join(', ');
                                },
                                renderCell: (p) => {
                                    const id = p.row.id as number;
                                    const tags = Array.isArray(p?.row?.tags) ? (p.row.tags as string[]) : [];
                                    const clean = tags.map((t) => String(t ?? '').trim()).filter((t) => t.length > 0);

                                    const InlineTagsCell: React.FC<{ id: number; tags: string[] }> = ({ id, tags }) => {
                                        const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
                                        const [name, setName] = React.useState('');
                                        const [colour, setColour] = React.useState<string | null>(null);
                                        const [colourAnchor, setColourAnchor] = React.useState<HTMLElement | null>(null);
                                        const [options, setOptions] = React.useState<{ id: number; name: string; colour?: string | null }[]>([]);
                                        const [loaded, setLoaded] = React.useState(false);

                                        const open = Boolean(anchor);
                                        const onOpen = async (el: HTMLElement) => {
                                            setAnchor(el);
                                            if (!loaded) {
                                                try {
                                                    const res = await fetch('/tags', { headers: { Accept: 'application/json' } });
                                                    const data = await res.json();
                                                    setOptions(Array.isArray(data?.data) ? data.data : []);
                                                    setLoaded(true);
                                                } catch {}
                                            }
                                        };
                                        const onClose = () => {
                                            setAnchor(null);
                                            setName('');
                                            setColour(null);
                                        };

                                        const addExisting = (tname: string) => {
                                            if (tags.includes(tname)) return;
                                            const found = options.find((o) => o.name === tname);
                                            if (found) {
                                                setTagColorByName((prev) => ({
                                                    ...prev,
                                                    [tname]: String(found.colour ?? 'default').toLowerCase(),
                                                }));
                                            }
                                            saveTags(id, [...tags, tname]);
                                        };
                                        const createAndAdd = async () => {
                                            const n = name.trim();
                                            if (!n) return;
                                            if (tags.includes(n)) return onClose();
                                            try {
                                                const token = getCsrfTokenFromCookie();
                                                await fetch('/tags', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Accept: 'application/json',
                                                        ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                                                    },
                                                    credentials: 'same-origin',
                                                    body: JSON.stringify({ name: n, colour }),
                                                });
                                            } catch {}
                                            // Optimistically capture colour for this new tag
                                            setTagColorByName((prev) => ({ ...prev, [n]: String(colour ?? 'default').toLowerCase() }));
                                            saveTags(id, [...tags, n]);
                                            onClose();
                                        };
                                        const removeTag = (tname: string) => {
                                            saveTags(
                                                id,
                                                tags.filter((t) => t !== tname),
                                            );
                                        };

                                        const palette: { value: string; className: string }[] = [
                                            { value: 'default', className: 'bg-neutral-300' },
                                            { value: 'primary', className: 'bg-blue-600' },
                                            { value: 'secondary', className: 'bg-purple-600' },
                                            { value: 'success', className: 'bg-green-600' },
                                            { value: 'warning', className: 'bg-amber-500' },
                                            { value: 'info', className: 'bg-cyan-600' },
                                            { value: 'neutral', className: 'bg-neutral-500' },
                                            { value: 'red', className: 'bg-red-600' },
                                            { value: 'orange', className: 'bg-orange-500' },
                                            { value: 'amber', className: 'bg-amber-500' },
                                            { value: 'lime', className: 'bg-lime-500' },
                                            { value: 'green', className: 'bg-green-600' },
                                            { value: 'teal', className: 'bg-teal-600' },
                                            { value: 'cyan', className: 'bg-cyan-600' },
                                            { value: 'blue', className: 'bg-blue-600' },
                                            { value: 'indigo', className: 'bg-indigo-600' },
                                            { value: 'violet', className: 'bg-violet-600' },
                                            { value: 'purple', className: 'bg-purple-600' },
                                            { value: 'pink', className: 'bg-pink-500' },
                                        ];

                                        return (
                                            <div className="flex h-full w-full items-center justify-start gap-1.5">
                                                {tags.map((t: string) => {
                                                    const key = String(tagColorByName[t] ?? '').toLowerCase();
                                                    const cls = palette.find((p) => p.value === key)?.className || 'bg-neutral-300';
                                                    return (
                                                        <span
                                                            key={`${id}-${t}`}
                                                            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs"
                                                        >
                                                            <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
                                                            <span>{t}</span>
                                                            <button
                                                                type="button"
                                                                aria-label={`Remove ${t}`}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    removeTag(t);
                                                                }}
                                                                className="text-neutral-500 hover:text-neutral-700"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => onOpen(e.currentTarget)}
                                                    aria-label="Add tag"
                                                    sx={{
                                                        p: 0.5,
                                                        width: 28,
                                                        height: 28,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <AddRounded fontSize="small" />
                                                </IconButton>
                                                <Popover
                                                    open={open}
                                                    anchorEl={anchor}
                                                    onClose={onClose}
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                                >
                                                    <Box sx={{ p: 2, width: 420 }}>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Add or create a tag
                                                        </Typography>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Choose colour"
                                                                onClick={(e) => setColourAnchor(e.currentTarget)}
                                                                sx={{ border: '1px solid', borderColor: 'divider' }}
                                                            >
                                                                <span
                                                                    className={`h-4 w-4 rounded-full ${palette.find((p) => p.value === colour)?.className || 'bg-neutral-300'}`}
                                                                />
                                                            </IconButton>
                                                            <Menu
                                                                anchorEl={colourAnchor}
                                                                open={Boolean(colourAnchor)}
                                                                onClose={() => setColourAnchor(null)}
                                                                MenuListProps={{ dense: true }}
                                                                PaperProps={{ sx: { p: 1 } }}
                                                            >
                                                                {palette.map((p) => (
                                                                    <MenuItem
                                                                        key={p.value}
                                                                        onClick={() => {
                                                                            setColour(p.value);
                                                                            setColourAnchor(null);
                                                                        }}
                                                                        sx={{ px: 1, py: 0.5, minHeight: 32 }}
                                                                        title={p.value}
                                                                    >
                                                                        <span
                                                                            className={`inline-block h-4 w-4 rounded-full ${p.className}`}
                                                                            aria-label={p.value}
                                                                        />
                                                                    </MenuItem>
                                                                ))}
                                                            </Menu>
                                                            <input
                                                                autoFocus
                                                                value={name}
                                                                onChange={(e) => setName(e.target.value)}
                                                                placeholder="Tag name"
                                                                className="flex-1 rounded-md border px-3 py-2 text-sm"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') createAndAdd();
                                                                }}
                                                            />
                                                            <Button size="small" variant="contained" onClick={createAndAdd}>
                                                                Add
                                                            </Button>
                                                        </div>
                                                        <Divider sx={{ my: 1.5 }} />
                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                            Existing tags
                                                        </Typography>
                                                        <div className="mt-2 max-h-44 overflow-auto pr-1">
                                                            {options
                                                                .filter((o) => !tags.includes(o.name))
                                                                .map((o) => (
                                                                    <button
                                                                        key={o.id}
                                                                        className="flex w-full items-center gap-2 px-2 py-1 text-left text-sm hover:bg-neutral-50"
                                                                        onClick={() => addExisting(o.name)}
                                                                    >
                                                                        <span
                                                                            className={`h-3 w-3 rounded-full ${palette.find((p) => p.value === String(o.colour ?? '').toLowerCase())?.className || 'bg-neutral-300'}`}
                                                                        />
                                                                        <span>{o.name}</span>
                                                                    </button>
                                                                ))}
                                                            {options.filter((o) => !tags.includes(o.name)).length === 0 && (
                                                                <div className="px-2 py-1 text-xs text-neutral-500">No tags</div>
                                                            )}
                                                        </div>
                                                    </Box>
                                                </Popover>
                                            </div>
                                        );
                                    };

                                    return <InlineTagsCell id={id} tags={clean} />;
                                },
                            },
                            {
                                field: 'price',
                                headerName: 'Price',
                                flex: 0.8,
                                sortable: true,
                                valueGetter: (p) => (p?.row && typeof (p as any).row.price !== 'undefined' ? (p as any).row.price : 0),
                                renderCell: (p) => {
                                    const row = p.row as IngredientRow;
                                    const isEditing = editingId === row.id;
                                    const display = row.price != null ? `$${row.price.toFixed(2)}${row.unit ? ` (${row.unit})` : ''}` : 'N/A';
                                    return (
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="0.01"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={commitEdit}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') commitEdit();
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                    className="w-28 rounded-md border px-2 py-1 text-sm"
                                                    aria-label="Edit price"
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(row)}
                                                    className="text-left text-[color:var(--color-brand-dark)] hover:underline"
                                                    title="Click to edit price"
                                                >
                                                    {display}
                                                </button>
                                            )}
                                        </div>
                                    );
                                },
                            },
                            {
                                field: 'price_change',
                                headerName: 'Price Change',
                                flex: 0.9,
                                sortable: true,
                                renderCell: (p) => <ChangePill value={p.row.price_change as number} />,
                            },
                            {
                                field: 'last_updated',
                                headerName: 'Price Last Updated',
                                flex: 1.0,
                                sortable: true,
                                valueGetter: (p) => {
                                    const ts = (p as any)?.row?.last_updated as string | undefined;
                                    const d = ts ? new Date(ts) : null;
                                    return d ? d.getTime() : 0;
                                },
                                renderCell: (p) => {
                                    const d = new Date(p.row.last_updated as string);
                                    const now = new Date();
                                    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                                    const cls = diffDays > 14 ? 'text-red-600' : diffDays >= 7 ? 'text-yellow-600' : 'text-black';
                                    const relative = (() => {
                                        if (diffDays <= 0) return 'today';
                                        if (diffDays === 1) return 'yesterday';
                                        if (diffDays < 7) return `${diffDays} days ago`;
                                        const weeks = Math.floor(diffDays / 7);
                                        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                                    })();
                                    const exact = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                                    return (
                                        <span className={cls} title={exact}>
                                            {relative}
                                        </span>
                                    );
                                },
                            },
                            {
                                field: 'actions',
                                headerName: '',
                                width: 60,
                                sortable: false,
                                filterable: false,
                                disableColumnMenu: true,
                                renderHeader: () => (
                                    <ManageColumns
                                        orderedFields={orderedFields}
                                        setOrderedFields={setOrderedFields}
                                        visibility={visibility}
                                        setVisibility={setVisibility}
                                        allFields={['name', 'tags', 'price', 'price_change', 'last_updated', 'actions']}
                                        storageKeyPrefix={storagePrefix}
                                        renderTrigger={(onOpen) => (
                                            <IconButton size="small" aria-label="Columns" onClick={onOpen}>
                                                <MoreVertical className="h-4 w-4 text-neutral-600" />
                                            </IconButton>
                                        )}
                                    />
                                ),
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
                        const defaults = baseColumns.map((c) => c.field as string);
                        const order = orderedFields.length ? orderedFields : defaults;
                        const missing = defaults.filter((f) => !order.includes(f));
                        const finalOrder = [...order, ...missing];
                        const cols = finalOrder
                            .filter((f) => visibility[f] !== false)
                            .map((f) => map.get(f)!)
                            .filter(Boolean);
                        return (
                            <div style={{ width: '100%' }}>
                                <DataGrid
                                    rows={items}
                                    columns={cols}
                                    columnVisibilityModel={visibility}
                                    onColumnVisibilityModelChange={(m) => setVisibility(m as any)}
                                    disableRowSelectionOnClick
                                    disableColumnResize={false}
                                    autoHeight
                                    initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                                    pageSizeOptions={[10, 25, 50]}
                                    onColumnOrderChange={handleColumnOrderChange}
                                />
                            </div>
                        );
                    })()}
                </Paper>
            </div>
        </AppSidebarLayout>
    );
}
