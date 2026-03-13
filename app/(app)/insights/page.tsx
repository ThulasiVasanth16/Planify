import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsSummary } from "@/lib/analytics";
import { InsightsDashboard } from "./_components/insights-dashboard";

export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Pass the current date to ensure server uses the same date as client
  const summary = await getAnalyticsSummary(
    userId,
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  return <InsightsDashboard summary={summary} />;
}
