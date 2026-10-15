"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

export type ToastState = "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  button?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: number;
  state: ToastState;
  duration: number;
  version: number;
  closing: boolean;
}

type Input = string | ToastOptions;

const DEFAULT_DURATION: Record<ToastState, number> = { success: 4000, info: 5000, warning: 6000, error: 7000, loading: Infinity };
const MAX_VISIBLE = 3;
const EMPTY: ToastItem[] = [];

let items: ToastItem[] = EMPTY;
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function normalize(input: Input): ToastOptions {
  return typeof input === "string" ? { title: input } : input;
}

function upsert(state: ToastState, input: Input, id?: number): number {
  const options = normalize(input);
  const duration = options.duration ?? (options.button ? Math.max(DEFAULT_DURATION[state], 8000) : DEFAULT_DURATION[state]);
  const existing = id === undefined ? undefined : items.find((item) => item.id === id);
  if (existing) {
    items = items.map((item) =>
      item.id === id ? { ...item, ...options, description: options.description, button: options.button, state, duration, version: item.version + 1, closing: false } : item,
    );
    emit();
    return existing.id;
  }
  counter += 1;
  items = [...items, { ...options, id: counter, state, duration, version: 0, closing: false }];
  emit();
  return counter;
}

function remove(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function dismiss(id?: number) {
  items = items.map((item) => (id === undefined || item.id === id ? { ...item, closing: true } : item));
  emit();
}

type Resolver<T> = Input | ((value: T) => Input);

function resolve<T>(resolver: Resolver<T>, value: T): Input {
  return typeof resolver === "function" ? resolver(value) : resolver;
}

export const toast = {
  success: (input: Input) => upsert("success", input),
  error: (input: Input) => upsert("error", input),
  warning: (input: Input) => upsert("warning", input),
  info: (input: Input) => upsert("info", input),
  loading: (input: Input) => upsert("loading", input),
  action: (input: ToastOptions & { button: NonNullable<ToastOptions["button"]> }) => upsert("info", input),
  promise: <T,>(promise: Promise<T>, messages: { loading: Input; success: Resolver<T>; error: Resolver<unknown> }): Promise<T> => {
    const id = upsert("loading", messages.loading);
    promise.then(
      (value) => upsert("success", resolve(messages.success, value), id),
      (error: unknown) => upsert("error", resolve(messages.error, error), id),
    );
    return promise;
  },
  dismiss,
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const ICON_TONE: Record<ToastState, string> = {
  success: "text-accent",
  error: "text-danger",
  warning: "text-warn",
  info: "text-link",
  loading: "text-muted",
};

function StateIcon({ state }: { state: ToastState }) {
  const className = cn("size-[22px] shrink-0", ICON_TONE[state]);
  if (state === "loading") return <span aria-hidden className="size-5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent text-muted" />;
  if (state === "success") return <CheckCircle2 className={className} aria-hidden />;
  if (state === "error") return <XCircle className={className} aria-hidden />;
  if (state === "warning") return <AlertTriangle className={className} aria-hidden />;
  return <Info className={className} aria-hidden />;
}

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ToastView({ item, index }: { item: ToastItem; index: number }) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [heights, setHeights] = useState({ head: 48, full: 48 });
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const remaining = useRef(item.duration);
  const startedAt = useRef(0);
  const dragStart = useRef<number | null>(null);
  const hasBody = !!(item.description || item.button);

  useLayoutEffect(() => {
    const measure = () => {
      const head = headRef.current?.offsetHeight ?? 48;
      const body = bodyRef.current?.offsetHeight ?? 0;
      setHeights((current) => (current.head === head && current.full === head + body ? current : { head, full: head + body }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (headRef.current) observer.observe(headRef.current);
    if (bodyRef.current) observer.observe(bodyRef.current);
    return () => observer.disconnect();
  }, [item.version]);

  const close = useCallback(() => {
    const fast = reducedMotion();
    setExpanded(false);
    window.setTimeout(() => setLeaving(true), fast || !hasBody ? 0 : 260);
    window.setTimeout(() => remove(item.id), fast ? 0 : hasBody ? 480 : 220);
  }, [hasBody, item.id]);

  useEffect(() => {
    const enter = window.setTimeout(() => setShown(true), 16);
    const open = window.setTimeout(() => setExpanded(true), reducedMotion() ? 0 : 280);
    remaining.current = item.duration;
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(open);
    };
  }, [item.version, item.duration]);

  useEffect(() => {
    if (item.closing) {
      const timer = window.setTimeout(close, 0);
      return () => window.clearTimeout(timer);
    }
  }, [item.closing, close]);

  useEffect(() => {
    if (paused || !Number.isFinite(item.duration) || item.closing) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(close, Math.max(0, remaining.current));
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, item.duration, item.version, item.closing, close]);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.pointerType !== "touch") return;
    dragStart.current = event.clientY;
    setDragging(true);
    setPaused(true);
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    if (dragStart.current === null) return;
    setDrag(Math.min(0, event.clientY - dragStart.current));
  };
  const onPointerEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    setDragging(false);
    setPaused(false);
    if (drag < -36) close();
    else setDrag(0);
  };

  const open = expanded && hasBody;
  const visible = shown && !leaving;
  const depth = Math.min(index, MAX_VISIBLE - 1);

  return (
    <li
      role={item.state === "error" ? "alert" : "status"}
      aria-live={item.state === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      style={{
        transform: `translateY(${visible ? drag : -12}px) scale(${visible ? 1 - depth * 0.03 : 0.92})`,
        opacity: visible ? Math.max(0.2, 1 + drag / 120) : 0,
        transition: !dragging ? "transform 380ms cubic-bezier(0.34, 1.45, 0.64, 1), opacity 200ms ease-out" : "none",
      }}
      className="pointer-events-auto w-full touch-pan-x select-none motion-reduce:!transition-none"
    >
      <div
        className={cn("overflow-hidden border border-line bg-elevated text-text", open ? "rounded-[20px]" : "rounded-[26px]")}
        style={{
          height: open ? heights.full : heights.head,
          transition: "height 420ms cubic-bezier(0.34, 1.3, 0.64, 1), border-radius 200ms ease-out",
        }}
      >
        <div ref={headRef} className="flex min-h-12 items-center gap-3 py-2.5 pl-4 pr-2">
          <StateIcon state={item.state} />
          <p className="min-w-0 flex-1 text-[16px] font-semibold leading-snug">{item.title}</p>
          <button
            type="button"
            onClick={close}
            aria-label={t("common.close")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div
          ref={bodyRef}
          aria-hidden={!open}
          className="flex flex-col gap-3 px-4 pb-4 pl-[50px]"
          style={{ opacity: open ? 1 : 0, transition: "opacity 200ms ease-out" }}
        >
          {item.description ? <p className="text-[15px] leading-relaxed text-muted">{item.description}</p> : null}
          {item.button ? (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                item.button?.onClick();
                close();
              }}
              className="inline-flex min-h-11 items-center justify-center self-start rounded-[980px] bg-text px-4 text-[15px] font-medium text-bg hover:opacity-90"
            >
              {item.button.label}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  const visible = list.slice(-MAX_VISIBLE).reverse();
  return (
    <ol className="pointer-events-none fixed inset-x-0 top-3 z-[95] mx-auto flex w-[min(400px,calc(100vw-24px))] flex-col items-stretch gap-2 pt-[env(safe-area-inset-top)]">
      {visible.map((item, index) => (
        <ToastView key={item.id} item={item} index={index} />
      ))}
    </ol>
  );
}
