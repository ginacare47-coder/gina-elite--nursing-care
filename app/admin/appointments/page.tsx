import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { AppointmentsManager } from "./appointments-manager";

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <AdminNav />
      <div className="mt-6">
        <AppointmentsManager />
      </div>
    </main>
  );
}
