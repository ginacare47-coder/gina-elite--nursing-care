import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { ServicesManager } from "./services-manager";

export default async function AdminServicesPage() {
  await requireAdmin();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <AdminNav />
      <div className="mt-6">
        <ServicesManager />
      </div>
    </main>
  );
}
