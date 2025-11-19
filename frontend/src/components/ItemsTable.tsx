"use client";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import useGetTags from "@/app/hooks/useGetTags";
import { MoreVertical, CheckSquare, Square, Trash2, Download, Tags, X } from "lucide-react";
import { Menu } from "@headlessui/react";
import { useFloating, FloatingPortal, offset, flip, shift } from '@floating-ui/react';
import { Item, Tag } from "@/app/types";
import TablePagination from "@/components/TablePagination";
import { backendApi } from "@/lib/backend-api";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export type ItemsTableColumn =
    | "name"
    | "quantity"
    | "status"
    | "room"
    | "place"
    | "container"
    | "tags"
    | "actions";

interface ItemsTableProps {
    search?: string;
    items?: Item[];
    columns?: ItemsTableColumn[];
    onCreate?: () => void;
    showCreateForm?: boolean;
    children?: React.ReactNode;
}

function ItemsTable({ search, items: itemsProp, columns = [
    "name",
    "quantity",
    "status",
    "room",
    "place",
    "container",
    "tags",
    "actions",
], }: ItemsTableProps) {
    const [items, setItems] = useState<Item[]>(itemsProp || []);
    const [loading, setLoading] = useState(!itemsProp);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [editId, setEditId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<Partial<Item>>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
    const { data: allTags, loading: tagsLoading } = useGetTags();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [favourites, setFavourites] = useState<number[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300); // 300ms delay
        return () => clearTimeout(handler);
    }, [searchInput]);

    // Ensure items is always an array
    const safeItems = Array.isArray(items) ? items : [];
    const filteredItems = (debouncedSearch || search)
        ? safeItems.filter((item) => {
            const searchValue = (debouncedSearch || search || "").toLowerCase();
            const nameMatch = item.name?.toLowerCase().includes(searchValue);
            const tagsMatch = Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(searchValue));
            return nameMatch || tagsMatch;
        })
        : safeItems;
    const totalPages = Math.ceil(filteredItems.length / pageSize);
    const paginatedItems = (Array.isArray(filteredItems) ? filteredItems : []).slice((page - 1) * pageSize, page * pageSize);

    const allSelected = paginatedItems.length > 0 && paginatedItems.every(item => selectedIds.includes(item.id));
    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(selectedIds.filter(id => !paginatedItems.some(item => item.id === id)));
        else setSelectedIds([...selectedIds, ...paginatedItems.filter(item => !selectedIds.includes(item.id)).map(item => item.id)]);
    };
    const toggleSelect = (id: number) => {
        setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
    };

    useEffect(() => {
        if (itemsProp) return;
        async function fetchItems() {
            try {
                const data = await backendApi.getItems();
                setItems(data);
            } catch {
                setError("Erreur lors du chargement des objets");
            } finally {
                setLoading(false);
            }
        }
        fetchItems();
    }, [itemsProp]);

    useEffect(() => {
        // Fetch user's favourites on mount
        async function fetchFavourites() {
            try {
                const data = await backendApi.getFavourites();
                if (Array.isArray(data)) {
                    setFavourites(data.map((fav: { itemId?: number; item?: { id: number } }) => fav.itemId || fav.item?.id).filter((id): id is number => typeof id === 'number'));
                }
            } catch { }
        }
        fetchFavourites();
    }, []);

    // Handler to delete multiple items
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Supprimer ${selectedIds.length} objet(s) sélectionné(s) ?`)) return;
        if (!window.confirm(`Êtes-vous vraiment sûr de vouloir supprimer définitivement ${selectedIds.length} objet(s) ? Cette action est irréversible.`)) return;
        try {
            await Promise.all(selectedIds.map(id => backendApi.deleteItem(id)));
            setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
            setSelectedIds([]);
        } catch {
            alert("Erreur lors de la suppression multiple");
        }
    };

    // Handler to clear selection
    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    // Handler to export selected items to CSV
    const handleExportCSV = () => {
        if (selectedIds.length === 0) return;
        const selectedItems = items.filter(item => selectedIds.includes(item.id));

        // Create CSV headers
        const headers = ['ID', 'Name', 'Quantity', 'Status', 'Room', 'Place', 'Container', 'Tags'];
        const csvRows = [headers.join(',')];

        // Add data rows
        selectedItems.forEach(item => {
            const row = [
                item.id,
                `"${(item.name || '').replace(/"/g, '""')}"`,
                item.quantity || 0,
                `"${(item.status || '').replace(/"/g, '""')}"`,
                `"${(item.room?.name || '').replace(/"/g, '""')}"`,
                `"${(item.place?.name || '').replace(/"/g, '""')}"`,
                `"${(item.container?.name || '').replace(/"/g, '""')}"`,
                `"${(Array.isArray(item.tags) ? item.tags.join('; ') : '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        // Create and download file
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `shelfspot_items_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Handler to export selected items to JSON
    const handleExportJSON = () => {
        if (selectedIds.length === 0) return;
        const selectedItems = items.filter(item => selectedIds.includes(item.id));

        const jsonContent = JSON.stringify(selectedItems, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `shelfspot_items_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    // Handler for bulk tag management
    const handleBulkTags = async (tagName: string, action: 'add' | 'remove') => {
        if (selectedIds.length === 0) return;

        try {
            const updatePromises = selectedIds.map(async (id) => {
                const item = items.find(it => it.id === id);
                if (!item) return;

                const currentTags = Array.isArray(item.tags) ? item.tags : [];
                let newTags: string[];

                if (action === 'add') {
                    newTags = currentTags.includes(tagName) ? currentTags : [...currentTags, tagName];
                } else {
                    newTags = currentTags.filter(t => t !== tagName);
                }

                await backendApi.updateItem(id, { tags: newTags });
                return { id, tags: newTags };
            });

            const results = await Promise.all(updatePromises);

            // Update local state
            setItems((prev: Item[]) =>
                prev.map((item: Item) => {
                    const update = results.find(r => r && r.id === item.id);
                    return update ? { ...item, tags: update.tags } : item;
                })
            );
        } catch (error) {
            console.error("Error updating tags:", error);
            alert("Erreur lors de la mise à jour des tags");
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + A to select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !editId) {
                e.preventDefault();
                const allIds = paginatedItems.map(item => item.id);
                setSelectedIds(allIds);
            }
            // Escape to clear selection
            if (e.key === 'Escape' && selectedIds.length > 0 && !editId) {
                handleClearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, editId, paginatedItems]);

    if (loading) return <div>Chargement...</div>;
    if (error) return <div>{error}</div>;

    const handleEdit = (item: Item) => {
        setEditId(item.id);
        setEditValues({ ...item });
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let processedValue: any = value;

        if (name === 'quantity') {
            processedValue = parseInt(value, 10) || 0;
        }

        setEditValues({ ...editValues, [name]: processedValue });
    };

    const handleSave = async () => {
        // Now backend supports tag updates!
        const { tags, ...otherFields } = editValues;

        const allowedFields = {
            name: otherFields.name,
            quantity: otherFields.quantity,
            status: otherFields.status,
            tags: tags, // Include tags in the request
        };

        const filteredData = Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object.entries(allowedFields).filter(([_, value]) => {
                if (Array.isArray(value)) return true; // Always include arrays (even empty ones)
                return value !== undefined && value !== "";
            })
        );

        try {
            await backendApi.updateItem(editId!, filteredData);

            // Update local state with all changes including tags
            setItems((prev: Item[]) => prev.map((it: Item) => (it.id === editId ? { ...it, ...filteredData, tags: tags || [] } : it)));
            setEditId(null);
            setEditValues({});
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Erreur lors de la sauvegarde de l'objet");
        }
    };

    const handleCancel = () => {
        setEditId(null);
        setEditValues({});
    };

    // Handler to delete a single item
    const handleDelete = async (id: number) => {
        if (!window.confirm("Supprimer cet objet ?")) return;
        try {
            await backendApi.deleteItem(id);
            setItems((prev) => prev.filter((item: Item) => item.id !== id));
        } catch {
            alert("Erreur lors de la suppression");
        }
    };

    function ActionMenu({ item, handleEdit, handleDelete, favourites, setFavourites }: {
        item: Item;
        handleEdit: (item: Item) => void;
        handleDelete: (id: number) => void;
        favourites: number[];
        setFavourites: React.Dispatch<React.SetStateAction<number[]>>;
    }) {
        const { refs, floatingStyles } = useFloating({
            placement: 'bottom-end',
            middleware: [offset(4), flip(), shift()],
            strategy: 'fixed',
        });
        return (
            <Menu as="div" className="inline-block text-left relative z-[60]">
                {({ open }: { open: boolean }) => (
                    <>
                        <Menu.Button ref={refs.setReference} as="button" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                            <MoreVertical className="w-5 h-5" />
                        </Menu.Button>
                        {open && (
                            <FloatingPortal>
                                <Menu.Items
                                    ref={refs.setFloating}
                                    style={{ ...floatingStyles, zIndex: 60 }}
                                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg focus:outline-none flex flex-col p-1"
                                >
                                    <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                            <button
                                                className={`w-full text-left px-4 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                                onClick={() => handleEdit(item)}
                                            >
                                                Modifier
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                            <button
                                                className={`w-full text-left px-4 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                                onClick={() => {
                                                    if (typeof window !== 'undefined') {
                                                        window.location.href = `/manage/${item.id}`;
                                                    }
                                                }}
                                            >
                                                Page de l&apos;objet
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }: { active: boolean }) => {
                                            const isFav = favourites.includes(item.id);
                                            return (
                                                <button
                                                    className={`w-full text-left px-4 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                                    onClick={async () => {
                                                        if (isFav) {
                                                            await backendApi.deleteFavourite(item.id);
                                                            setFavourites((prev: number[]) => prev.filter((favId: number) => favId !== item.id));
                                                        } else {
                                                            await backendApi.createFavourite(item.id);
                                                            setFavourites([...favourites, item.id]);
                                                        }
                                                    }}
                                                >
                                                    {isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                                </button>
                                            );
                                        }}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                            <button
                                                className={`w-full text-left px-4 py-2 text-sm rounded text-red-600 ${active ? 'bg-red-100 dark:bg-red-900' : ''}`}
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Supprimer l&apos;objet
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </FloatingPortal>
                        )}
                    </>
                )}
            </Menu>
        );
    }

    return (
        <div>
            <div className="flex items-center mb-2 gap-2 flex-wrap">
                {selectedIds.length > 0 && (
                    <>
                        {/* Selection Counter Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-sm">
                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {selectedIds.length} selected
                            </span>
                        </div>

                        {/* Bulk Action Buttons */}
                        <div className="flex items-center gap-1">
                            {/* Delete Selected */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                                onClick={handleDeleteSelected}
                                title="Delete selected items"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            {/* Export Dropdown */}
                            <Menu as="div" className="relative">
                                <Menu.Button
                                    as={Button}
                                    size="sm"
                                    variant="ghost"
                                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="Export selected items"
                                >
                                    <Download className="w-4 h-4" />
                                </Menu.Button>
                                <Menu.Items className="absolute left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg focus:outline-none p-1 min-w-[140px]">
                                    <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                                onClick={handleExportCSV}
                                            >
                                                Export as CSV
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                            <button
                                                className={`w-full text-left px-3 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                                onClick={handleExportJSON}
                                            >
                                                Export as JSON
                                            </button>
                                        )}
                                    </Menu.Item>
                                </Menu.Items>
                            </Menu>

                            {/* Bulk Tag Management Dropdown */}
                            {!tagsLoading && Array.isArray(allTags) && allTags.length > 0 && (
                                <Menu as="div" className="relative">
                                    <Menu.Button
                                        as={Button}
                                        size="sm"
                                        variant="ghost"
                                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        title="Manage tags for selected items"
                                    >
                                        <Tags className="w-4 h-4" />
                                    </Menu.Button>
                                    <Menu.Items className="absolute left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg focus:outline-none p-2 max-h-[300px] overflow-y-auto min-w-[180px]">
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                                            Add Tag
                                        </div>
                                        {allTags.map((tag: Tag) => (
                                            <Menu.Item key={`add-${tag.id}`}>
                                                {({ active }: { active: boolean }) => (
                                                    <button
                                                        className={`w-full text-left px-3 py-2 text-sm rounded ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                                        onClick={() => handleBulkTags(tag.name, 'add')}
                                                    >
                                                        {tag.icon && <span className="mr-2">{tag.icon}</span>}
                                                        {tag.name}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ))}
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                                            Remove Tag
                                        </div>
                                        {allTags.map((tag: Tag) => (
                                            <Menu.Item key={`remove-${tag.id}`}>
                                                {({ active }: { active: boolean }) => (
                                                    <button
                                                        className={`w-full text-left px-3 py-2 text-sm rounded text-red-600 dark:text-red-400 ${active ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                                                        onClick={() => handleBulkTags(tag.name, 'remove')}
                                                    >
                                                        {tag.icon && <span className="mr-2">{tag.icon}</span>}
                                                        {tag.name}
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Items>
                                </Menu>
                            )}

                            {/* Clear Selection */}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={handleClearSelection}
                                title="Clear selection"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </>
                )}

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search an item..."
                    className="theme-input rounded px-2 py-1 ml-auto w-56"
                    value={searchInput}
                    onChange={e => {
                        setSearchInput(e.target.value);
                        setPage(1);
                    }}
                />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 max-h-[60vh] h-[55vh] overflow-y-auto overflow-x-auto text-sm rounded-sm shadow-sm"
            >
                <Table>
                    <TableHeader>
                        <TableRow className="h-8">
                            <TableHead className="w-8 px-2">
                                <button onClick={toggleSelectAll} aria-label="Tout sélectionner">
                                    {allSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                                </button>
                            </TableHead>
                            {columns.includes("name") && (
                                <TableHead>Nom</TableHead>
                            )}
                            {columns.includes("quantity") && (
                                <TableHead>Quantité</TableHead>
                            )}
                            {columns.includes("status") && (
                                <TableHead>Statut</TableHead>
                            )}
                            {columns.includes("room") && (
                                <TableHead>Pièce</TableHead>
                            )}
                            {columns.includes("place") && (
                                <TableHead>Emplacement</TableHead>
                            )}
                            {columns.includes("container") && (
                                <TableHead>Contenant</TableHead>
                            )}
                            {columns.includes("tags") && (
                                <TableHead>Tags</TableHead>
                            )}
                            {columns.includes("actions") && (
                                <TableHead>Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((item: Item, idx: number) => (
                            <TableRow key={item.id} className={(idx % 2 === 0 ? "bg-white dark:bg-gray-800 h-8" : "bg-gray-50 dark:bg-gray-700/50 h-8") + " hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"}>
                                <TableCell className="w-8 px-2 py-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                        aria-label="Sélectionner"
                                    />
                                </TableCell>
                                {editId === item.id ? (
                                    <>
                                        {columns.includes("name") && (
                                            <TableCell>
                                                <input
                                                    ref={inputRef}
                                                    name="name"
                                                    value={editValues.name}
                                                    onChange={handleChange}
                                                    className="theme-input rounded px-2 py-1 w-full"
                                                />
                                            </TableCell>
                                        )}
                                        {columns.includes("quantity") && (
                                            <TableCell>
                                                <input
                                                    name="quantity"
                                                    type="number"
                                                    value={editValues.quantity}
                                                    onChange={handleChange}
                                                    className="theme-input rounded px-2 py-1 w-full"
                                                />
                                            </TableCell>
                                        )}
                                        {columns.includes("status") && (
                                            <TableCell>
                                                <input
                                                    name="status"
                                                    value={editValues.status || ""}
                                                    onChange={handleChange}
                                                    className="theme-input rounded px-2 py-1 w-full"
                                                />
                                            </TableCell>
                                        )}
                                        {columns.includes("room") && (
                                            <TableCell>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {item.room?.name || "N/A"}
                                                </span>
                                            </TableCell>
                                        )}
                                        {columns.includes("place") && (
                                            <TableCell>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {item.place?.name || "N/A"}
                                                </span>
                                            </TableCell>
                                        )}
                                        {columns.includes("container") && (
                                            <TableCell>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {item.container?.name || "N/A"}
                                                </span>
                                            </TableCell>
                                        )}
                                        {columns.includes("tags") && (
                                            <TableCell>
                                                {tagsLoading ? (
                                                    <span>Chargement des tags…</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.isArray(allTags) && allTags.map((tag: Tag) => {
                                                            const selected = editValues.tags?.includes(tag.name);
                                                            return (
                                                                <button
                                                                    key={tag.id}
                                                                    type="button"
                                                                    className={`px-2 py-1 rounded text-xs border ${selected ? "theme-tag border-blue-500" : "theme-muted border-muted"}`}
                                                                    onClick={() => {
                                                                        setEditValues((prev: Partial<Item>) => {
                                                                            const prevTags = prev.tags || [];
                                                                            return {
                                                                                ...prev,
                                                                                tags: selected
                                                                                    ? prevTags.filter((t: string) => t !== tag.name)
                                                                                    : [...prevTags, tag.name],
                                                                            };
                                                                        });
                                                                    }}
                                                                >
                                                                    {tag.icon ? <span className="mr-1">{tag.icon}</span> : null}{tag.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </TableCell>
                                        )}
                                        {columns.includes("actions") && (
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="secondary" onClick={handleSave}>
                                                        Enregistrer
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                                                        Annuler
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {columns.includes("name") && <TableCell className="py-1">{item.name}</TableCell>}
                                        {columns.includes("quantity") && <TableCell className="py-1">{item.quantity}</TableCell>}
                                        {columns.includes("status") && <TableCell className="py-1">{item.status}</TableCell>}
                                        {columns.includes("room") && <TableCell className="py-1">{item.room?.name}</TableCell>}
                                        {columns.includes("place") && <TableCell className="py-1">{item.place?.name}</TableCell>}
                                        {columns.includes("container") && <TableCell className="py-1">{item.container?.name}</TableCell>}
                                        {columns.includes("tags") && <TableCell className="py-1">
                                            <div className="flex flex-wrap gap-1">
                                                {item.tags && item.tags.length > 0 ? (
                                                    (item.tags as string[]).map((tagName: string) => {
                                                        const tagObj = Array.isArray(allTags) ? allTags.find((t: Tag) => t.name === tagName) : undefined;
                                                        return (
                                                            <span
                                                                key={tagName}
                                                                className="px-2 py-1 rounded text-xs border theme-tag border-blue-500 flex items-center gap-1"
                                                            >
                                                                {tagObj?.icon ? <span>{tagObj.icon}</span> : null}{tagName}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="theme-muted text-xs">Aucun tag</span>
                                                )}
                                            </div>
                                        </TableCell>}
                                        {columns.includes("actions") && (
                                            <TableCell className="relative py-1">
                                                <ActionMenu
                                                    item={item}
                                                    handleEdit={handleEdit}
                                                    handleDelete={handleDelete}
                                                    favourites={favourites}
                                                    setFavourites={setFavourites}
                                                />
                                            </TableCell>
                                        )}
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <TablePagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
        </div>
    );
}

export default ItemsTable;
