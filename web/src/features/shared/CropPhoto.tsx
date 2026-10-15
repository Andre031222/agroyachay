"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cropImage } from "@/lib/crop-image";
import { cn } from "@/lib/cn";
import type { CropSpecies } from "@/lib/types";
import { useLabels } from "./labels";

interface CropPhotoProps {
  code: string | null | undefined;
  alt: string;
  variant?: "thumb" | "full";
  shape?: "square" | "wide" | "photo";
  radius?: "sm" | "md" | "lg" | "none";
  sizes?: string;
  className?: string;
  priority?: boolean;
}

const SHAPES = { square: "aspect-square", wide: "aspect-[16/9]", photo: "aspect-[4/3]" };
const RADII = { sm: "rounded-[10px]", md: "rounded-[16px]", lg: "rounded-[20px]", none: "" };

export function CropPhoto({ code, alt, variant = "thumb", shape, radius, sizes, className, priority }: CropPhotoProps) {
  const aspect = SHAPES[shape ?? (variant === "thumb" ? "square" : "photo")];
  const round = RADII[radius ?? (variant === "thumb" ? "md" : "lg")];
  return (
    <span className={cn("relative block shrink-0 overflow-hidden bg-surface", aspect, round, className)}>
      <Image src={cropImage(code, variant)} alt={alt} fill sizes={sizes ?? (variant === "thumb" ? "64px" : "(min-width: 768px) 50vw, 100vw")} priority={priority} className="object-cover" />
    </span>
  );
}

export interface CropChoice {
  value: string;
  code: string;
  label: string;
  sub?: string;
}

interface CropChoicesProps {
  label: string;
  hint?: string;
  name: string;
  options: CropChoice[];
  value: string;
  onChange: (value: string) => void;
  columns?: "2" | "3" | "4";
}

export function CropChoices({ label, hint, name, options, value, onChange, columns = "4" }: CropChoicesProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-[16px] font-medium">{label}</legend>
      {hint ? <p className="mb-2 text-[15px] text-muted">{hint}</p> : null}
      <div className={cn("mt-2 grid grid-cols-2 gap-3", columns !== "2" && "sm:grid-cols-3", columns === "4" && "lg:grid-cols-4")}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-2 rounded-[16px] border-2 bg-surface p-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link",
                selected ? "border-accent" : "border-transparent hover:border-line",
              )}
            >
              <input type="radio" name={name} value={option.value} checked={selected} onChange={() => onChange(option.value)} className="sr-only" />
              <CropPhoto code={option.code} alt="" sizes="(min-width: 1024px) 160px, 45vw" className="w-full" />
              <span className="flex min-h-7 flex-col px-1 text-center leading-tight">
                <span className="text-[16px] font-medium">{option.label}</span>
                {option.sub ? <span className="text-[14px] text-muted">{option.sub}</span> : null}
              </span>
              {selected ? (
                <span aria-hidden className="absolute right-3 top-3 inline-flex size-7 items-center justify-center rounded-full bg-accent text-on-accent">
                  <Check className="size-4" />
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface SpeciesPickerProps {
  label: string;
  catalog: CropSpecies[];
  value: string;
  onChange: (code: string) => void;
  name: string;
  columns?: "2" | "3" | "4";
}

export function SpeciesPicker({ label, catalog, value, onChange, name, columns = "4" }: SpeciesPickerProps) {
  const labels = useLabels();
  const options = catalog.map((item) => ({ value: item.code, code: item.code, label: labels.species(item.code, catalog) }));
  return <CropChoices label={label} name={name} options={options} value={value} onChange={onChange} columns={columns} />;
}

export function SpeciesPickerSkeleton({ label, count = 8, columns = "4" }: { label: string; count?: number; columns?: "2" | "3" | "4" }) {
  return (
    <div aria-busy="true">
      <p className="mb-1 text-[16px] font-medium">{label}</p>
      <div className={cn("mt-2 grid grid-cols-2 gap-3", columns !== "2" && "sm:grid-cols-3", columns === "4" && "lg:grid-cols-4")}>
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className="flex flex-col gap-2 rounded-[16px] border-2 border-transparent bg-surface p-2">
            <span className="skeleton block aspect-square w-full rounded-[16px]" />
            <span className="block min-h-7" />
          </span>
        ))}
      </div>
    </div>
  );
}
