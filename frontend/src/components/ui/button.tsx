import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[background-color,color,border-color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 aria-invalid:ring-destructive/25 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        /* button-primary: black pill, dominant CTA */
        default:
          "rounded-full bg-primary text-primary-foreground shadow-[var(--elevation-1)] hover:opacity-90 active:opacity-80",
        /* button-accent-green: mint pill for brand-emphasis CTAs */
        accent:
          "rounded-full bg-accent text-accent-foreground shadow-[var(--elevation-1)] hover:opacity-90 active:opacity-80",
        /* destructive */
        destructive:
          "rounded-full bg-destructive text-white shadow-[var(--elevation-1)] hover:opacity-90 active:opacity-80",
        /* button-secondary: outlined pill */
        outline:
          "rounded-full border border-border bg-transparent text-foreground hover:bg-muted active:bg-muted/70",
        secondary:
          "rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted",
        /* button-ghost: quieter rectangular, keeps rounded-md */
        ghost:
          "rounded-md bg-transparent text-foreground hover:bg-muted active:bg-muted/70",
        /* button-link */
        link: "rounded-none bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-11 px-6 has-[>svg]:px-5",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
