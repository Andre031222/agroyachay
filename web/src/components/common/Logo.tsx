import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function LogoMark({ size = 28, className, priority }: { size?: number; className?: string; priority?: boolean }) {
  const source = size <= 56 ? 128 : 256;
  return (
    <Image
      src={`/brand/agroyachay-mark-${source}.png`}
      alt=""
      aria-hidden
      width={source}
      height={source}
      sizes={`${size}px`}
      priority={priority}
      style={{ width: size, height: size }}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

export function Logo({ href = "/", label, className }: { href?: string; label: string; className?: string }) {
  return (
    <Link href={href} aria-label={label} className={cn("inline-flex min-h-11 items-center gap-2 rounded-[12px] text-[21px] font-semibold tracking-[-0.03em]", className)}>
      <LogoMark priority />
      <span>AgroYachay</span>
    </Link>
  );
}
