"use client";

export function SummaryCard({
  serviceName,
  date,
  time,
  clientName,
  phone,
  address,
}: {
  serviceName: string;
  date: string;
  time: string;
  clientName: string;
  phone: string;
  address?: string | null;
}) {
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-slate-900">Summary</div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600">Service</dt>
          <dd className="font-medium text-slate-900">{serviceName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600">Date</dt>
          <dd className="font-medium text-slate-900">{date}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600">Time</dt>
          <dd className="font-medium text-slate-900">{time}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600">Client</dt>
          <dd className="font-medium text-slate-900">{clientName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-600">Phone</dt>
          <dd className="font-medium text-slate-900">{phone}</dd>
        </div>
        {address ? (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-slate-600">Address</dt>
            <dd className="text-right font-medium text-slate-900">{address}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
