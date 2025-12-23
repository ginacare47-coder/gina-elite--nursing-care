"use client";

import clsx from "clsx";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_mins: number;
  is_active: boolean;
};

export function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: Service;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const price = (service.price_cents / 100).toFixed(2);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "card w-full text-left p-4 transition hover:bg-slate-50 active:scale-[0.99]",
        selected && "ring-2 ring-ink-300"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900">{service.name}</div>
          {service.description ? (
            <div className="mt-1 text-sm text-slate-600">{service.description}</div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="pill">₱ {price}</span>
            <span className="pill">{service.duration_mins} mins</span>
          </div>
        </div>
        <div
          className={clsx(
            "h-5 w-5 rounded-full ring-1 ring-slate-300",
            selected && "bg-ink-700 ring-ink-700"
          )}
          aria-hidden
        />
      </div>
    </button>
  );
}
