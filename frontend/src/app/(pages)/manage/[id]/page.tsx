"use client"
import ManageObjectClient from "@/components/ManageObjectClient";
import AlertsManager from "@/components/AlertsManager";
import useGetItems from "@/app/hooks/useGetItems";
import { useParams } from "next/navigation";
import { Package, MapPin, Home, Archive, Tags, Hash, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ManageObjectPage() {
    const { t } = useTranslation();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data, loading, error } = useGetItems(id);

    if (!id) {
        return (
            <main className="max-w-2xl mx-auto p-8 theme-bg">
                <h1 className="text-2xl font-bold mb-4">{t('page.manageItem.missingParameter')}</h1>
                <p className="theme-muted">{t('page.manageItem.noIdProvided')}</p>
            </main>
        );
    }

    if (loading) return <div>{t('loading')}</div>;
    if (error) return <div>{t('page.manageItem.error')} : {error}</div>;
    if (!data || Array.isArray(data)) return <div>{t('page.manageItem.noObjectFound')}</div>;

    const item = data;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-blue-200/50 dark:border-gray-700 rounded-sm p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-sm">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                {item.name}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                {t('page.manageItem.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Item Details Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        {t('page.manageItem.itemInformation')}
                    </h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Quantity */}
                        <div className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-700/50 rounded-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-sm">
                                    <Hash className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('page.manageItem.quantity')}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.quantity}</p>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="group p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-200/50 dark:border-purple-700/50 rounded-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-sm">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">{t('page.manageItem.status')}</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{item.status || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Room */}
                        <div className="group p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border border-green-200/50 dark:border-green-700/50 rounded-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-600 dark:bg-green-500 rounded-sm">
                                    <Home className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">{t('page.manageItem.room')}</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">{item.room?.name || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Place */}
                        <div className="group p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border border-orange-200/50 dark:border-orange-700/50 rounded-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-600 dark:bg-orange-500 rounded-sm">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">{t('page.manageItem.place')}</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">{item.place?.name || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Container */}
                        <div className="group p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 border border-indigo-200/50 dark:border-indigo-700/50 rounded-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-sm">
                                    <Archive className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{t('page.manageItem.container')}</p>
                                    <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">{item.container?.name || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="group p-4 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/10 border border-pink-200/50 dark:border-pink-700/50 rounded-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-pink-600 dark:bg-pink-500 rounded-sm">
                                    <Tags className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-2">{t('page.manageItem.tags')}</p>
                                    {item.tags && item.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {item.tags.map((tag, index) => (
                                                <span key={index} className="px-2 py-1 text-xs font-medium bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('page.manageItem.noTags')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page.manageItem.actions')}</h2>
                </div>
                <div className="p-6">
                    <ManageObjectClient item={item} />
                </div>
            </div>

            {/* Quantity Alert Card */}
            <AlertsManager
                itemId={item.id}
                itemName={item.name}
                currentQuantity={item.quantity}
            />
        </div>
    );
}
