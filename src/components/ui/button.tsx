import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        gold: "bg-gold-500 text-forest-950 hover:bg-gold-400",
        forest: "bg-forest-900 text-cream-50 hover:bg-forest-800",
        outlineLight: "border border-cream-50/70 text-cream-50 hover:bg-cream-50/10",
        outline: "border border-forest-900/25 text-forest-900 hover:bg-forest-900/5",
        ghost: "text-forest-900 hover:bg-forest-900/5",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variant: "forest", size: "md" },
  },
);

type Props = VariantProps<typeof buttonVariants> & { className?: string; children: React.ReactNode };

export function ButtonLink({ href, variant, size, className, children }: Props & { href: string }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant,
  size,
  className,
  children,
  ...rest
}: Props & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      {children}
    </button>
  );
}
