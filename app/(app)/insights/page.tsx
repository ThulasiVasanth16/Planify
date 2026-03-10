import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsSummary } from "@/lib/analytics";
import { InsightsDashboard } from "./_components/insights-dashboard";

export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const summary = await getAnalyticsSummary(userId);

  return <InsightsDashboard summary={summary} />;
}
