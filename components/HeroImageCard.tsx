import Image from "next/image";
import Link from "next/link";

export function HeroImageCard({
  title,
  subtitle,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
}) {
  return (
    <header className="card overflow-hidden">
      {/* Image */}
      <div className="relative h-64 sm:h-72 lg:h-80 w-full">
        <Image
          src="/hero/hero-nurse.png"
          alt="Professional nurse providing home care"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 520px"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-slate-900/25 to-transparent" />

        {/* Text */}
        <div className="absolute bottom-6 left-6 right-6 max-w-[420px]">
          <div className="text-xs font-semibold tracking-wide text-white/90">
            Caring Nurse Services
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold leading-tight text-white">
            {title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 space-y-3">
        <Link href="/booking/step-1-service" className="btn-primary w-full">
          {ctaLabel}
        </Link>

        <div className="flex gap-3">
          <Link
            href="/admin/login"
            className="btn-ghost w-full text-slate-700"
          >
            Admin Login
          </Link>

          <a href="#how" className="btn-ghost w-full text-slate-700">
            How it works
          </a>
        </div>
      </div>
    </header>
  );
}

