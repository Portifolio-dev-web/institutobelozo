import { STATUS } from "@/lib/format";

export const StatusBadge = ({ status, testId }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span data-testid={testId || `status-badge-${status}`} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
};
