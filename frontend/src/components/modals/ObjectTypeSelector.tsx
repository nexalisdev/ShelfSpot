import React from "react";
import { OBJECT_TYPES } from "@/lib/constants";
import { ObjectIcon } from "@/components/ui/object-icon";

interface ObjectTypeSelectorProps {
    onSelect: (type: string) => void;
}

export function ObjectTypeSelector({ onSelect }: ObjectTypeSelectorProps) {
    return (
        <div className="p-8">
            <h2 className="text-2xl font-semibold mb-8 text-center text-gray-900 dark:text-white">
                What would you like to add to your home?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {OBJECT_TYPES.map((type) => (
                    <div
                        key={type.key}
                        className="border-2 border-gray-200 dark:border-gray-600 rounded-sm p-6 flex flex-col items-center hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm"
                        onClick={() => onSelect(type.key)}
                    >
                        <div className="text-blue-600 dark:text-blue-400 mb-3">
                            <ObjectIcon type={type.key as "room" | "place" | "container" | "item"} />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium text-center">
                            {type.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
