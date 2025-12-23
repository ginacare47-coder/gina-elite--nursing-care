import Link from "next/link";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabaseServer";
import { FounderCard } from "@/components/FounderCard";

type SiteContentRow = { key: string; value: string | null };

// ✅ UPDATED: only what we need for the cards (name + XAF price)
type ServiceRow = {
  id: string;
  name: string;
  price_cents: number;
};

// ✅ XAF formatter (assumes price_cents is cents; adjust if yours is whole XAF)
function formatXAFFromCents(priceCents: number) {
  const amount = priceCents / 100;
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold tracking-wider text-ink-700/80">
        {eyebrow.toUpperCase()}
      </div>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-ink-50 text-ink-700 ring-1 ring-ink-200 text-sm font-semibold">
        {icon}
      </div>
      <p className="text-sm font-medium leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200/70">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/**
 * Hero:
 * - No blur anywhere
 * - Gradient tint only
 * - Subject fully clean
 * - CTA contrast preserved
 */
function Hero({
  title,
  subtitle,
  cta,
}: {
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <header className="card overflow-hidden">
      <section className="relative min-h-[560px] sm:min-h-[620px] lg:min-h-[640px]">
        {/* Background images */}
        <div className="absolute inset-0">
          {/* Mobile (portrait) */}
          <Image
            src="/hero/hero_mobile_1080x1920.png"
            alt="Home nursing professional"
            fill
            priority
            className="object-cover sm:hidden object-[55%_12%]"
            sizes="100vw"
          />

          {/* Tablet */}
          <Image
            src="/hero/hero_tablet_1536x1152.png"
            alt="Home nursing professional"
            fill
            className="hidden sm:block lg:hidden object-cover object-[70%_14%]"
            sizes="100vw"
          />

          {/* Desktop */}
          <Image
            src="/hero/hero_desktop_1920x1080.png"
            alt="Home nursing professional"
            fill
            className="hidden lg:block object-cover object-[78%_20%]"
            sizes="100vw"
          />
        </div>

        {/* Readability gradients ONLY (no blur) */}
        <div className="pointer-events-none absolute inset-0">
          {/* Left-side tint fade (for headline + CTA readability) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(242,251,255,0.92) 0%, rgba(242,251,255,0.55) 42%, rgba(242,251,255,0.0) 72%)",
            }}
          />

          {/* Soft highlight behind headline (subtle premium lift) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 520px at 22% 28%, rgba(255,255,255,0.45), transparent 62%)",
            }}
          />

          {/* Tiny edge calming */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5" />
        </div>

        {/* Content */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[560px] sm:min-h-[620px] lg:min-h-[640px] items-center">
            <div className="max-w-xl">
              <div className="text-xs font-semibold tracking-wide text-ink-700/80">
                Caring Nurse Services
              </div>

              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                <span className="block">Personal Healthcare</span>
                <span className="block">at Your Home</span>
              </h1>

              {/* Keep dynamic content but preserve your designed wrap */}
              <p className="sr-only">{title}</p>

              <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-slate-600">
                {subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/booking/step-1-service"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold bg-ink-700 text-white hover:bg-ink-800 shadow-soft ring-1 ring-ink-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white/40"
                >
                  {cta}
                </Link>

                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold bg-white/80 text-ink-800 hover:bg-white/95 ring-1 ring-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white/40"
                >
                  How it works
                </a>

                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Admin Portal
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Licensed professionals • Privacy-first booking • Home-based care
              </p>
            </div>
          </div>
        </div>
      </section>
    </header>
  );
}

export default async function HomePage() {
  const supabase = await supabaseServer();

  const { data: content } = await supabase
    .from("site_content")
    .select("key,value")
    .in("key", ["hero_title", "hero_subtitle", "cta_label"]);

  const map = new Map((content ?? []).map((c: SiteContentRow) => [c.key, c.value]));
  const title = map.get("hero_title") ?? "Professional Healthcare at Your Home";
  const subtitle =
    map.get("hero_subtitle") ??
    "Expert nursing care delivered with compassion and convenience.";
  const cta = map.get("cta_label") ?? "Book Your Appointment";

  // ✅ UPDATED: fetch only name + price_cents (from your public.services schema)
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id,name,price_cents")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const safeServices = (services ?? []) as ServiceRow[];

  return (
    <div className="relative">
      {/* Soft page canvas (matches your existing landing style) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-slate-50" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-ink-100/60 to-transparent blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/70 to-transparent" />
      </div>

      <main className="relative mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left */}
          <div className="lg:col-span-5">
            <Hero title={title} subtitle={subtitle} cta={cta} />

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl bg-white/60 ring-1 ring-slate-200/70 p-6">
                <div className="text-xs font-semibold tracking-wider text-slate-600">
                  TRUST & CARE
                </div>

                <div className="mt-4 space-y-4">
                  <FeatureRow icon="✓" text="Licensed healthcare professionals" />
                  <FeatureRow icon="🔒" text="Privacy-first booking and records" />
                  <FeatureRow icon="⏱" text="Fast booking in under 2 minutes" />
                  <FeatureRow icon="🏠" text="Comfortable care in your home" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Response Time" value="< 2 hrs" />
                <StatCard label="Service Area" value="24/7" />
                <StatCard label="Patient Rating" value="4.9★" />
              </div>

              <FounderCard
                name="Gina Care"
                title="Founder & Head Nurse"
                blurb="Have questions about our services? Reach out directly for personalized assistance."
                email="ginacare47@gmail.com"
                phone="+639123456789"
                whatsapp="+639123456789"
                className="mt-2"
              />
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-7 space-y-10 lg:space-y-12">
            <section>
              <SectionHeading
                eyebrow="Our Services"
                title="Comprehensive Care Solutions"
                subtitle="Tap a service to book. Pricing shown in XAF."
              />

              {/* ✅ UPDATED SERVICES SECTION: name + price in XAF, link to booking */}
              {servicesError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                  Couldn’t load services: {servicesError.message}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {safeServices.length ? (
                    safeServices.map((service) => (
                      <Link
                        key={service.id}
                        href={`/booking/step-1-service?service=${encodeURIComponent(
                          service.id
                        )}`}
                        className="card p-6 transition-all hover:ring-2 hover:ring-ink-300"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-base font-semibold text-slate-900 truncate">
                              {service.name}
                            </div>
                            <div className="mt-2 text-sm font-semibold text-ink-700">
                              {formatXAFFromCents(service.price_cents)}
                            </div>
                          </div>

                          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-ink-50 ring-1 ring-ink-200 text-ink-700">
                            →
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="card p-6 text-center text-sm text-slate-600 sm:col-span-2">
                      No services available yet. Add one in Admin → Services.
                    </div>
                  )}
                </div>
              )}
            </section>

            <section id="how">
              <SectionHeading
                eyebrow="Simple Process"
                title="How it works"
                subtitle="Three easy steps to receive professional healthcare at home."
              />

              <div className="card p-6">
                <ol className="grid gap-5 text-sm text-slate-700">
                  <li className="flex gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-ink-50 font-semibold text-ink-700 ring-1 ring-ink-200">
                      1
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Select Your Service</div>
                      <div className="mt-1 text-slate-600">
                        Choose from our professional healthcare services tailored to your needs.
                      </div>
                    </div>
                  </li>

                  <li aria-hidden className="ml-4 h-6 w-px bg-slate-200" />

                  <li className="flex gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-ink-50 font-semibold text-ink-700 ring-1 ring-ink-200">
                      2
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Schedule Your Visit</div>
                      <div className="mt-1 text-slate-600">
                        Pick a convenient date and time from real-time availability.
                      </div>
                    </div>
                  </li>

                  <li aria-hidden className="ml-4 h-6 w-px bg-slate-200" />

                  <li className="flex gap-4">
                    <div className="grid h-9 w-9 place-items-center rounded-2xl bg-ink-50 font-semibold text-ink-700 ring-1 ring-ink-200">
                      3
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Receive Care at Home</div>
                      <div className="mt-1 text-slate-600">
                        Our licensed professionals arrive prepared to provide excellent care.
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link href="/booking/step-1-service" className="btn-primary w-full">
                  Begin Your Booking
                </Link>
                <Link href="/admin/login" className="btn-ghost w-full text-slate-700">
                  Provider Login
                </Link>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Nurse Home Care. Built with Next.js + Supabase.
            <span className="mx-2">•</span>
            Privacy-first
            <span className="mx-2">•</span>
            Licensed Professionals
          </p>
        </footer>

        {/* Sticky mobile CTA */}
        <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
          <div className="bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent px-4 pb-4 pt-3">
            <Link href="/booking/step-1-service" className="btn-primary w-full">
              {cta}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
