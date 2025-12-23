import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import clsx from "clsx";

 // If you don't have this, remove it or create the file

export type FounderCardProps = {
  name: string;
  title?: string;
  blurb?: string;
  email: string;
  phone: string;
  whatsapp?: string; // optional, defaults to phone
  className?: string;
};

// Helper function moved inside component
function normalizePhoneForWa(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

// Simple cn utility if you don't have it
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function FounderCard({
  name,
  title = "Founder",
  blurb = "Have questions or need help booking? Reach out anytime.",
  email,
  phone,
  whatsapp,
  className,
}: FounderCardProps) {
  const wa = whatsapp ?? phone;
  const waDigits = normalizePhoneForWa(wa);

  const mailto = `mailto:${email}`;
  const tel = `tel:${phone.replace(/\s/g, "")}`;
  const waLink = waDigits ? `https://wa.me/${waDigits}` : undefined;

  return (
    <div className={cn(
      "rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm ring-1 ring-slate-200/70",
      className
    )}>
      {/* Header with badge */}
      <div className="mb-5">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Direct Contact
        </span>
      </div>

      {/* Profile Info */}
      <div className="flex items-start gap-4">
        {/* Avatar/Initial */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-2xl font-semibold text-blue-600 ring-2 ring-white shadow-sm">
          {name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          <p className="mt-1 text-sm text-slate-600">{title}</p>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{blurb}</p>
        </div>
      </div>

      {/* Contact Buttons Grid */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {/* Email Button */}
        <Link
          href={mailto}
          className="group relative flex flex-col items-center justify-center rounded-xl bg-white p-3 ring-1 ring-slate-200 transition-all hover:ring-blue-300 hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <Mail className="h-5 w-5" />
          </div>
          <span className="mt-2 text-xs font-medium text-slate-700">Email</span>
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full text-center">
            {email}
          </span>
        </Link>

        {/* WhatsApp Button */}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="group relative flex flex-col items-center justify-center rounded-xl bg-white p-3 ring-1 ring-slate-200 transition-all hover:ring-green-300 hover:shadow-sm active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-medium text-slate-700">WhatsApp</span>
            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full text-center">
              Message us
            </span>
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-medium text-slate-400">WhatsApp</span>
          </div>
        )}

        {/* Call Button */}
        <a
          href={tel}
          className="group relative flex flex-col items-center justify-center rounded-xl bg-white p-3 ring-1 ring-slate-200 transition-all hover:ring-blue-300 hover:shadow-sm active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <Phone className="h-5 w-5" />
          </div>
          <span className="mt-2 text-xs font-medium text-slate-700">Call</span>
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full text-center">
            {phone}
          </span>
        </a>
      </div>

      {/* Contact Details Footer */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 truncate">{email}</span>
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{phone}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Typically responds within 2 hours • Available Monday-Friday, 8AM-6PM
        </p>
      </div>
    </div>
  );
}
