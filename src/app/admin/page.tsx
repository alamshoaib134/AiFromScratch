import { getAllDays } from "@/lib/content";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const courseId = "30-days-of-ai"; // TODO: make admin panel dynamic
  const allDays = getAllDays(courseId);
  const days = allDays.map((d) => ({ day: d.day, title: d.title }));

  return <AdminDashboard days={days} />;
}
