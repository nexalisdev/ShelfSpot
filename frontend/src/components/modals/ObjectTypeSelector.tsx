import React from "react";
import { OBJECT_TYPES } from "@/lib/constants";
import { ObjectIcon } from "@/components/ui/object-icon";

interface ObjectTypeSelectorProps {
    onSelect: (type: string) => void;
}

export function ObjectTypeSelector({ onSelect }: ObjectTypeSelectorProps) {
    return (
        <div className="p-8">
            <h2 className="text-2xl font-semibold mb-8 text-center text-foreground">
                What would you like to add to your home?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {OBJECT_TYPES.map((type) => (
                    <div
                        key={type.key}
                        className="border-2 border-border rounded-lg p-6 flex flex-col items-center hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer bg-muted/40 backdrop-blur-sm"
                        onClick={() => onSelect(type.key)}
                    >
                        <div className="text-primary mb-3">
                            <ObjectIcon type={type.key as "room" | "place" | "container" | "item"} />
                        </div>
                        <span className="text-foreground font-medium text-center">
                            {type.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
