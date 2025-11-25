"use client";
import ItemsTable from "@/components/ItemsTable";
import useGetConsumables from "@/app/hooks/useGetConsumables";
import { useTranslation } from "react-i18next";

export default function Consumables() {
  const { t } = useTranslation();
  const { items, loading, error } = useGetConsumables();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-emerald-900/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-sm"></div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-blue-400 dark:to-emerald-400">
                {t("page.consumables.title")}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {t("page.consumables.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">{t("page.consumables.loading")}</div>
          </div>
        )}
        {error && (
          <div className="p-6">
            <div className="text-red-600 dark:text-red-400">{t("page.consumables.error", { error })}</div>
          </div>
        )}
        {!loading && !error && items && items.length > 0 && (
          <div className="p-6">
            <ItemsTable items={items} />
          </div>
        )}
        {!loading && !error && items && items.length === 0 && (
          <div className="p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              {t("page.consumables.empty")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
