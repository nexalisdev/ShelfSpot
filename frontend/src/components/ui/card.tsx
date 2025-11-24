// Card minimal compatible shadcn/ui
type CardProps = React.HTMLAttributes<HTMLDivElement>;
export function Card({ className, ...props }: CardProps) {
    return (
        <div className={"rounded-sm border theme-card theme-border shadow p-6 " + (className || "")} {...props} />
    );
}