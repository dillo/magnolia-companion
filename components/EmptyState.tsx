import type { ReactNode } from "react";

export default function EmptyState({
  message,
  detail,
  action,
}: {
  message: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-card px-6 py-8 text-center sm:py-10">
      <h3 className="break-words font-display text-xl font-semibold text-ink">{message}</h3>
      {detail && <p className="mx-auto mt-2 max-w-prose break-words text-moss">{detail}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
