import { getAllDays } from "@/lib/content";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const allDays = getAllDays();
  const days = allDays.map((d) => ({ day: d.day, title: d.title }));

  return <AdminDashboard days={days} />;
}
