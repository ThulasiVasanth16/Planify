import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceByUserId } from "@/lib/workspace";
import { inviteMember, getTeamMembers } from "@/lib/team";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspaceByUserId(userId);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { email, displayName, role } = body as {
    email?: string;
    displayName?: string;
    role?: string;
  };

  if (!email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ error: "role must be admin or member" }, { status: 400 });
  }

  try {
    const member = await inviteMember({
      workspaceId: workspace.id,
      invitedBy: userId,
      displayName: displayName?.trim() || email.split("@")[0],
      email: email.trim().toLowerCase(),
      role: role as "admin" | "member",
    });
    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error("POST /api/team/invite", err);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
