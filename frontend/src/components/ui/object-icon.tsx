import { DoorOpen, SquareLibrary, Archive, Lamp } from "lucide-react";

interface ObjectIconProps {
    type: "room" | "place" | "container" | "item";
    className?: string;
}

export function ObjectIcon({ type, className = "w-7 h-7" }: ObjectIconProps) {
    const iconMap = {
        room: DoorOpen,
        place: SquareLibrary,
        container: Archive,
        item: Lamp,
    };

    const Icon = iconMap[type];
    return <Icon className={`${className} text-accent`} />;
}

export const OBJECT_ICONS = {
    room: <ObjectIcon type="room" />,
    place: <ObjectIcon type="place" />,
    container: <ObjectIcon type="container" />,
    item: <ObjectIcon type="item" />,
} as const;
