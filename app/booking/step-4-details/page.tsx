import Link from "next/link";
import { BookingWizard } from "@/components/BookingWizard";

export default function Page() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-ink-700">
          ← Home
        </Link>
        <div className="text-xs text-slate-500">Step 4 of 5</div>
      </div>

      <BookingWizard step={4} />
    </main>
  );
}
