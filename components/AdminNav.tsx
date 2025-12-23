import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/appointments", label: "Appointments" },
];

export function AdminNav() {
  return (
    <nav className="card p-3">
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="btn-ghost text-slate-700"
          >
            {l.label}
          </Link>
        ))}
        <Link href="/" className="btn-ghost ml-auto text-slate-700">
          Public Site
        </Link>
      </div>
    </nav>
  );
}
