import type { ReactNode } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  intro?: ReactNode;
  howTo?: { label: ReactNode; steps: ReactNode[]; video?: ReactNode };
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, intro, howTo, actions }: PageHeaderProps) {
  const hasHelp = Boolean(howTo && howTo.steps.length);
  return (
    <div className="mb-6 flex flex-col gap-3 lg:mb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-[1_1_18rem]">
          <h1 className="display text-[30px] sm:text-[34px] lg:text-[36px]">{title}</h1>
          {intro ? <p className="mt-1.5 max-w-3xl text-[17px] leading-snug text-muted">{intro}</p> : null}
          {subtitle ? <div className="mt-1.5 max-w-3xl text-[16px] text-muted">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex max-w-full flex-wrap gap-3">{actions}</div> : null}
      </div>
      {hasHelp && howTo ? (
        <details className="group w-fit max-w-3xl rounded-[16px] border border-line open:w-full">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3.5 text-[16px] font-medium text-link [&::-webkit-details-marker]:hidden">
            <CircleHelp className="size-[18px] shrink-0" aria-hidden />
            <span className="flex-1">{howTo.label}</span>
            <ChevronDown className="size-[18px] shrink-0 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ol className="grid gap-3 px-4 pb-4 pt-1 md:grid-cols-3">
            {howTo.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="tabular inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-[15px] font-semibold">{index + 1}</span>
                <p className="pt-1 text-[16px] leading-snug">{step}</p>
              </li>
            ))}
          </ol>
          {howTo.video ? <div className="px-4 pb-4">{howTo.video}</div> : null}
        </details>
      ) : null}
    </div>
  );
}
