import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfileSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Settings</h1>
        <p className='text-sm text-muted-foreground'>
          Manage your account and workspace preferences.
        </p>
      </div>

      {/* Tab navigation */}
      <div className='flex gap-1 border-b border-border pb-1 overflow-x-auto'>
        {[
          { label: "Profile", href: "/settings/profile", active: true },
          { label: "Workspace", href: "/settings/workspace", active: false },
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

      <ProfileForm
        initialFirstName={user.firstName ?? ""}
        initialLastName={user.lastName ?? ""}
        email={email}
        imageUrl={user.imageUrl}
      />
    </div>
  );
}
