import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminIndex() {
  await requireAdmin();
  redirect("/admin/dashboard");
}
