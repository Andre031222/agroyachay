import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function SkeletonGrid({ count = 4, className, itemClassName }: { count?: number; className?: string; itemClassName?: string }) {
  return (
    <div className={cn("grid gap-4", className)} role="status" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn("h-28 rounded-[20px]", itemClassName)} />
      ))}
    </div>
  );
}
