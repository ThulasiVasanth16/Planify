import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceByUserId, getWorkspaceOwnerProfile } from "@/lib/workspace";
import { getTeamMembers } from "@/lib/team";
import { InvitePageClient } from "./_components/invite-page-client";

export default async function InviteMembersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) redirect("/onboarding");

  const [members, ownerProfile] = await Promise.all([
    getTeamMembers(workspace.id),
    getWorkspaceOwnerProfile(userId),
  ]);

  return (
    <InvitePageClient
      members={members}
      ownerProfile={ownerProfile}
    />
  );
}
