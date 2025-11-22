"use client";

import { useState } from 'react';
import { Plus, Calendar, AlertTriangle, TrendingUp, Activity, Trash2, Edit, Eye } from 'lucide-react';
import { useGetProjects, useGetScoringStatistics, useGetTopItems, useGetCriticalItems, Project } from '@/app/hooks/useGetProjects';
import { backendApi } from '@/lib/backend-api';
import CreateProjectModal from '../../../components/CreateProjectModal';
import ProjectDetailsModal from '../../../components/ProjectDetailsModal';
import EditProjectModal from '../../../components/EditProjectModal';

// Component to display project status
const ProjectStatus = ({ status }: { status: Project['status'] }) => {
    const statusConfig = {
        ACTIVE: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Active' },
        PAUSED: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Paused' },
        COMPLETED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'Completed' },
        CANCELLED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', label: 'Cancelled' },
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
            {statusConfig[status].label}
        </span>
    );
};

// Component to display project priority
const ProjectPriority = ({ priority }: { priority: Project['priority'] }) => {
    const priorityConfig = {
        LOW: { color: 'text-gray-600 dark:text-gray-400', label: 'Low' },
        MEDIUM: { color: 'text-blue-600 dark:text-blue-400', label: 'Medium' },
        HIGH: { color: 'text-orange-600 dark:text-orange-400', label: 'High' },
        CRITICAL: { color: 'text-red-600 dark:text-red-400', label: 'Critical' },
    };

    return (
        <span className={`inline-flex items-center text-sm font-medium ${priorityConfig[priority].color}`}>
            {priorityConfig[priority].label}
        </span>
    );
};

export default function ProjectsPage() {
    const { projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useGetProjects();
    const { statistics, refetch: refetchStats } = useGetScoringStatistics();
    const { topItems, loading: topItemsLoading, refetch: refetchTopItems } = useGetTopItems();
    const { criticalItems, loading: criticalLoading, refetch: refetchCritical } = useGetCriticalItems();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState('projects');

    // Refresh all data
    const refreshAllData = () => {
        refetchProjects();
        refetchStats();
        refetchTopItems();
        refetchCritical();
    };

    // Handle project deletion
    const handleDeleteProject = async (project: Project) => {
        if (window.confirm(`Are you sure you want to delete the project "${project.name}"? This action is irreversible.`)) {
            try {
                await backendApi.deleteProject(project.id);
                refreshAllData();
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Error deleting project');
            }
        }
    };

    // Recalculate all scores
    const handleRecalculateScores = async () => {
        try {
            await backendApi.recalculateScores();
            refreshAllData();
        } catch (error) {
            console.error('Error recalculating scores:', error);
            alert('Error recalculating scores');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const getScoreColor = (score: number) => {
        if (score >= 10) return 'text-red-600 dark:text-red-400 font-bold';
        if (score >= 5) return 'text-orange-600 dark:text-orange-400 font-medium';
        if (score >= 1) return 'text-blue-600 dark:text-blue-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Modals */}
            <CreateProjectModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={refreshAllData}
            />
            {selectedProject && (
                <>
                    <ProjectDetailsModal
                        open={showDetailsModal}
                        onClose={() => setShowDetailsModal(false)}
                        project={selectedProject}
                        onUpdate={refreshAllData}
                    />
                    <EditProjectModal
                        open={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        project={selectedProject}
                        onSuccess={refreshAllData}
                    />
                </>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your projects and track the importance of your items
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRecalculateScores}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <Activity className="w-4 h-4" />
                        Recalculate Scores
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </div>

            {/* Quick Statistics */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalItems}</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-md">
                                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Score</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.itemsWithScore}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-md">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.averageScore}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                                <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Items</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.distribution.critical}</p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'projects', label: 'Projects', count: projects.length },
                        { key: 'top-items', label: 'Important Items', count: topItems.length },
                        { key: 'critical-items', label: 'Critical Items', count: criticalItems.length },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.key
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 py-0.5 px-2 rounded-sm text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm">

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                    <div className="p-6">
                        {projectsLoading && (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-gray-600 dark:text-gray-400">Loading projects...</div>
                            </div>
                        )}

                        {projectsError && (
                            <div className="text-red-600 dark:text-red-400 text-center py-8">{projectsError}</div>
                        )}

                        {!projectsLoading && !projectsError && projects.length === 0 && (
                            <div className="text-center py-12">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 text-lg">No projects found</p>
                                <p className="text-gray-500 dark:text-gray-500">Create your first project to get started</p>
                            </div>
                        )}

                        {!projectsLoading && !projectsError && projects.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Project
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Priority
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Dates
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {projects.map((project) => (
                                            <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {project.name}
                                                        </div>
                                                        {project.description && (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                                                                {project.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ProjectStatus status={project.status} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ProjectPriority priority={project.priority} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                    <div>
                                                        {project.startDate && (
                                                            <div>Start: {formatDate(project.startDate)}</div>
                                                        )}
                                                        {project.endDate && (
                                                            <div>End: {formatDate(project.endDate)}</div>
                                                        )}
                                                        {!project.startDate && !project.endDate && (
                                                            <span className="text-gray-500 dark:text-gray-400">Not defined</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                    {project.projectItems?.length || 0} items
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProject(project);
                                                                setShowDetailsModal(true);
                                                            }}
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProject(project);
                                                                setShowEditModal(true);
                                                            }}
                                                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProject(project)}
                                                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Important Items Tab */}
                {activeTab === 'top-items' && (
                    <div className="p-6">
                        {topItemsLoading && (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-gray-600 dark:text-gray-400">Loading items...</div>
                            </div>
                        )}

                        {!topItemsLoading && topItems.length === 0 && (
                            <div className="text-center py-12">
                                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No items with scores found</p>
                            </div>
                        )}

                        {!topItemsLoading && topItems.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Item
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Importance Score
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Stock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Location
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {topItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-lg font-bold ${getScoreColor(item.importanceScore)}`}>
                                                        {item.importanceScore.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {item.room?.name || ''}
                                                    {item.place?.name && ` • ${item.place.name}`}
                                                    {item.container?.name && ` • ${item.container.name}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Critical Items Tab */}
                {activeTab === 'critical-items' && (
                    <div className="p-6">
                        {criticalLoading && (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-gray-600 dark:text-gray-400">Loading critical items...</div>
                            </div>
                        )}

                        {!criticalLoading && criticalItems.length === 0 && (
                            <div className="text-center py-12">
                                <AlertTriangle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">No critical items detected</p>
                                <p className="text-gray-500 dark:text-gray-500 text-sm">All your important items have sufficient stock</p>
                            </div>
                        )}

                        {!criticalLoading && criticalItems.length > 0 && (
                            <div>
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        <p className="text-red-800 dark:text-red-200 font-medium">
                                            Items requiring immediate attention
                                        </p>
                                    </div>
                                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                                        These items have high importance scores but low stock. Consider restocking them.
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Item
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Score
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Stock
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Criticality
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Location
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {criticalItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {item.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-sm font-bold ${getScoreColor(item.importanceScore)}`}>
                                                            {item.importanceScore.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                                            {item.criticalityRatio.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {item.room?.name || ''}
                                                        {item.place?.name && ` • ${item.place.name}`}
                                                        {item.container?.name && ` • ${item.container.name}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
