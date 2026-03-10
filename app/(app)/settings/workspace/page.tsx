import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getWorkspaceWithSettings } from "@/lib/workspace";
import { WorkspaceForm } from "./_components/workspace-form";

export default async function WorkspaceSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workspace = await getWorkspaceWithSettings(userId);
  if (!workspace) redirect("/onboarding");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and workspace preferences.</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border pb-1">
        {[
          { label: "Profile",   href: "/settings/profile",   active: false },
          { label: "Workspace", href: "/settings/workspace",  active: true  },
        ].map(({ label, href, active }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <WorkspaceForm workspace={workspace} />
    </div>
  );
}
