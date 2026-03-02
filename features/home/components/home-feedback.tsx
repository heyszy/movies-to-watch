import { Button } from "@base-ui/react/button";

interface HomeFeedbackProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HomeFeedback({
  title,
  description,
  actionLabel,
  onAction,
}: HomeFeedbackProps) {
  return (
    <section
      className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm"
      aria-live="polite"
    >
      <p className="text-xl font-semibold text-slate-900">{title}</p>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
        {description}
      </p>

      {actionLabel && onAction ? (
        <Button
          type="button"
          onClick={onAction}
          className="mt-6 min-h-11 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
