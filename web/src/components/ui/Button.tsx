import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive" | "inverse";
export type ButtonSize = "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:opacity-90",
  secondary: "bg-surface text-text hover:bg-line/60",
  outline: "border border-line bg-bg text-text hover:bg-surface",
  ghost: "bg-transparent text-text hover:bg-surface",
  danger: "border border-line bg-bg text-danger hover:bg-surface",
  destructive: "bg-danger text-on-danger hover:opacity-90",
  inverse: "bg-text text-bg hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 text-[16px]",
  lg: "min-h-[52px] px-7 text-[17px]",
  icon: "size-12 justify-center",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-[980px] font-medium tracking-[-0.01em] transition-[background-color,opacity,color] duration-150 disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    extra,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
