import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Search, Activity, TrendingUp } from 'lucide-react';
import { Project, useGetProject } from '@/app/hooks/useGetProjects';
import { backendApi } from '@/lib/backend-api';

interface ProjectDetailsModalProps {
    open: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: () => void;
}

interface Item {
    id: number;
    name: string;
    quantity: number;
    status: string;
    room?: { name: string };
    place?: { name: string };
    container?: { name: string };
}

export default function ProjectDetailsModal({ open, onClose, project, onUpdate }: ProjectDetailsModalProps) {
    const { project: fullProject, loading, refetch } = useGetProject(open ? project.id : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Item[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('items');

    // Search items
    const searchItems = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const items = await backendApi.getItems(query);
            setSearchResults(items);
        } catch (error) {
            console.error('Error searching items:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Debounce for search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchItems(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Add an item to the project
    const handleAddItem = async (item: Item) => {
        try {
            await backendApi.addItemToProject(project.id, item.id, 1);
            refetch();
            onUpdate();
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Error adding item');
        }
    };

    // Update an item's quantity
    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            await handleRemoveItem(itemId);
            return;
        }

        try {
            await backendApi.updateProjectItem(project.id, itemId, newQuantity);
            refetch();
            onUpdate();
        } catch (error) {
            console.error('Error updating quantity:', error);
            alert('Error updating quantity');
        }
    };

    // Remove an item from the project
    const handleRemoveItem = async (itemId: number) => {
        await backendApi.removeItemFromProject(project.id, itemId);
        refetch();
        onUpdate();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const getStatusColor = (status: Project['status']) => {
        const colors = {
            ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            PAUSED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
        return colors[status];
    };

    const getPriorityColor = (priority: Project['priority']) => {
        const colors = {
            LOW: 'text-gray-600 dark:text-gray-400',
            MEDIUM: 'text-blue-600 dark:text-blue-400',
            HIGH: 'text-orange-600 dark:text-orange-400',
            CRITICAL: 'text-red-600 dark:text-red-400',
        };
        return colors[priority];
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-sm text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white" id="modal-title">
                                    {project.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                        {project.status === 'ACTIVE' ? 'Active' :
                                            project.status === 'PAUSED' ? 'Paused' :
                                                project.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                                    </span>
                                    <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                                        Priority: {project.priority === 'LOW' ? 'Low' :
                                            project.priority === 'MEDIUM' ? 'Medium' :
                                                project.priority === 'HIGH' ? 'High' : 'Critical'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Description et dates */}
                        {(project.description || project.startDate || project.endDate) && (
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-sm">
                                {project.description && (
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">{project.description}</p>
                                )}
                                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                    {project.startDate && (
                                        <span>Start: {formatDate(project.startDate)}</span>
                                    )}
                                    {project.endDate && (
                                        <span>End: {formatDate(project.endDate)}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Onglets */}
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('items')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'items'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >                                        Items ({fullProject?.projectItems?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >                                        <Activity className="w-4 h-4 inline mr-1" />
                                    Analytics
                                </button>
                            </nav>
                        </div>

                        {/* Contenu des onglets */}
                        {activeTab === 'items' && (
                            <div className="space-y-4">
                                {/* Recherche d'articles */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Add item to project
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                            placeholder="Search for an item..."
                                        />
                                    </div>

                                    {/* Résultats de recherche */}
                                    {searchLoading && (
                                        <div className="mt-2 p-2 text-sm text-gray-600 dark:text-gray-400">
                                            Searching...
                                        </div>
                                    )}

                                    {searchResults.length > 0 && (
                                        <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-sm max-h-40 overflow-y-auto">
                                            {searchResults.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {item.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Stock: {item.quantity} • {item.room?.name || 'No location'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddItem(item)}
                                                        className="ml-2 p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Liste des articles du projet */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Project items
                                    </h4>

                                    {loading && (
                                        <div className="text-center py-8">
                                            <div className="text-gray-600 dark:text-gray-400">Loading items...</div>
                                        </div>
                                    )}

                                    {!loading && (!fullProject?.projectItems || fullProject.projectItems.length === 0) && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-sm">
                                            <p className="text-gray-600 dark:text-gray-400">No items in this project</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">Use the search above to add items</p>
                                        </div>
                                    )}

                                    {!loading && fullProject?.projectItems && fullProject.projectItems.length > 0 && (
                                        <div className="space-y-2">
                                            {fullProject.projectItems.map((projectItem) => (
                                                <div
                                                    key={projectItem.id}
                                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-sm"
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {projectItem.item?.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Available stock: {projectItem.item?.quantity} •
                                                            {projectItem.item?.room?.name && ` ${projectItem.item.room.name}`}
                                                            {projectItem.item?.place?.name && ` • ${projectItem.item.place.name}`}
                                                            {projectItem.item?.container?.name && ` • ${projectItem.item.container.name}`}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(projectItem.itemId, projectItem.quantity - 1)}
                                                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>

                                                        <span className="min-w-[3rem] text-center text-sm font-medium text-gray-900 dark:text-white">
                                                            {projectItem.quantity}
                                                        </span>

                                                        <button
                                                            onClick={() => handleUpdateQuantity(projectItem.itemId, projectItem.quantity + 1)}
                                                            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleRemoveItem(projectItem.itemId)}
                                                            className="ml-2 p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="space-y-4">
                                <div className="text-center py-8">
                                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Detailed project analytics
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500">
                                        Feature under development
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
