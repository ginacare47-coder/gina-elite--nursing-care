import Link from "next/link";
import { BookingWizard } from "@/components/BookingWizard";

export default function Step2DatePage() {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-ink-700">
          ← Home
        </Link>
        <div className="text-xs text-slate-500">Step 2 of 5</div>
      </div>

      <BookingWizard step={2} />
    </main>
  );
}
