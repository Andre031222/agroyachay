"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const controlClass =
  "w-full min-h-[52px] rounded-[12px] border border-line bg-bg px-4 text-[17px] text-text placeholder:text-muted transition-colors focus:border-link focus:outline-2 focus:outline-offset-0 focus:outline-link disabled:opacity-60 aria-[invalid=true]:border-danger";

interface FieldShellProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function FieldShell({ id: fixedId, label, hint, error, className, children }: FieldShellProps) {
  const generated = useId();
  const id = fixedId ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[16px] font-medium text-text">
        {label}
      </label>
      {children(id, describedBy)}
      {hint ? (
        <div id={hintId} className="text-[15px] text-muted">
          {hint}
        </div>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-[15px] font-medium text-danger">
          <AlertCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export function Input({ id, label, hint, error, wrapperClassName, className, ...rest }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      {(id, describedBy) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={cn(controlClass, className)} {...rest} />
      )}
    </FieldShell>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export function Textarea({ label, hint, error, wrapperClassName, className, ...rest }: TextareaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={wrapperClassName}>
      {(id, describedBy) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, "min-h-28 py-3 leading-relaxed", className)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  options: Option[];
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  wrapperClassName?: string;
}

export function Select({ label, options, hint, error, placeholder, wrapperClassName, className, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} className={wrapperClassName}>
      {(id, describedBy) => (
        <div className="relative">
          <select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(controlClass, "appearance-none pr-10", className)}
            {...rest}
          >
            {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
      )}
    </FieldShell>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-12 min-w-12 items-center justify-center disabled:opacity-50"
    >
      <span className={cn("relative h-[31px] w-[51px] rounded-[980px] transition-colors", checked ? "bg-accent" : "bg-line")}>
        <span
          className={cn(
            "absolute top-[2px] size-[27px] rounded-full border border-line bg-white transition-[left]",
            checked ? "left-[22px]" : "left-[2px]",
          )}
        />
      </span>
    </button>
  );
}
