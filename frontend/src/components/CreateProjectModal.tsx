import React, { useState } from 'react';
import { X, Calendar, Flag, FileText } from 'lucide-react';
import { backendApi } from '@/lib/backend-api';

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateProjectModal({ open, onClose, onSuccess }: CreateProjectModalProps) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'ACTIVE' as 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statusOptions = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PAUSED', label: 'Paused' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ];

    const priorityOptions = [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'CRITICAL', label: 'Critical' },
    ];

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            startDate: '',
            endDate: '',
        });
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const projectData = {
                name: form.name,
                description: form.description || undefined,
                status: form.status,
                priority: form.priority,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
            };

            await backendApi.createProject(projectData);
            onSuccess();
            handleClose();
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Error creating project');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm bg-black/60" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-sm text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/50 dark:border-gray-700/50">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 pt-8 pb-6 sm:p-8 sm:pb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-blue-400" id="modal-title">
                                    Create New Project
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-2">
                                    Organize your tasks and track progress
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-sm hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-sm">
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                                    <span className="text-red-500">⚠️</span>
                                    {error}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Project Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Project Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        value={form.name}
                                        onChange={handleChange}
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white text-base transition-all duration-200 shadow-md hover:shadow-lg"
                                        placeholder="e.g., Kitchen Renovation, Home Office Setup..."
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    Description
                                </label>
                                <div>
                                    <textarea
                                        name="description"
                                        id="description"
                                        rows={3}
                                        value={form.description}
                                        onChange={handleChange}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        placeholder="Description du projet..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Statut */}
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Statut
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            name="status"
                                            id="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Priorité */}
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Priorité
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Flag className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <select
                                            name="priority"
                                            id="priority"
                                            value={form.priority}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        >
                                            {priorityOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Date de début */}
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Date de début
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            name="startDate"
                                            id="startDate"
                                            value={form.startDate}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Date de fin */}
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Date de fin
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            name="endDate"
                                            id="endDate"
                                            value={form.endDate}
                                            onChange={handleChange}
                                            min={form.startDate || undefined}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modern Buttons */}
                            <div className="flex justify-end space-x-4 pt-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-600 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !form.name.trim()}
                                    className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border border-transparent rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 transform"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating...
                                        </div>
                                    ) : (
                                        '✨ Create Project'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
