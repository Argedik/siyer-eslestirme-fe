import { listTerms } from "@/lib/terms";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const terms = await listTerms();

  return <AdminDashboard terms={terms} />;
}
