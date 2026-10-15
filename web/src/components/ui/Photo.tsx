import Image from "next/image";
import { cn } from "@/lib/cn";

export type PhotoName =
  | "hero"
  | "terraces"
  | "potato-field"
  | "quinoa"
  | "farmer"
  | "altiplano"
  | "harvest"
  | "leaf"
  | "market"
  | "soil"
  | "sensor"
  | "auth";

interface PhotoProps {
  name: PhotoName;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  rounded?: boolean;
}

export function Photo({ name, alt, className, priority, sizes = "(min-width: 1024px) 50vw, 100vw", rounded = true }: PhotoProps) {
  return (
    <div className={cn("relative overflow-hidden bg-surface", rounded && "rounded-[20px]", className)}>
      <Image src={`/images/${name}.jpg`} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </div>
  );
}
