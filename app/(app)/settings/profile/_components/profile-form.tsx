"use client";

import { useRef, useState, useTransition } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Camera, ExternalLink, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  initialFirstName: string;
  initialLastName: string;
  email: string;
  imageUrl: string;
}

export function ProfileForm({ initialFirstName, initialLastName, email, imageUrl }: ProfileFormProps) {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const router = useRouter();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName]   = useState(initialLastName);
  const [avatarSrc, setAvatarSrc] = useState(imageUrl);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isSaving,  startSaving]  = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = [initialFirstName, initialLastName]
    .map((s) => s?.[0] ?? "")
    .join("")
    .toUpperCase() || "?";

  /* ── Photo upload ─────────────────────────────────────────────────────── */

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Optimistic local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarSrc(objectUrl);

    try {
      await user.setProfileImage({ file });
      await user.reload();
      setAvatarSrc(user.imageUrl);
    } catch {
      setAvatarSrc(imageUrl); // revert on failure
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /* ── Save name ────────────────────────────────────────────────────────── */

  function handleSave() {
    if (!user) return;
    setSaveError(null);
    setSaved(false);

    startSaving(async () => {
      try {
        await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save changes.");
      }
    });
  }

  /* ── Delete account ───────────────────────────────────────────────────── */

  function handleDelete() {
    if (!user) return;
    startDeleting(async () => {
      try {
        await user.delete();
        await signOut();
        router.push("/");
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to delete account.");
        setShowDeleteConfirm(false);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* ── Profile Picture ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile photo.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSrc} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm hover:bg-muted"
              aria-label="Change photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="sr-only"
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload photo
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG, GIF or WebP · Max 10 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Personal Information ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Email is managed by Clerk — use the security settings below to change it.
            </p>
          </div>

          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Password & Security ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Password &amp; Security</CardTitle>
          <CardDescription>
            Manage your password, connected accounts, and two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => openUserProfile({ appearance: {} })}
            className="gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Manage security settings
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Opens Clerk&apos;s account portal to change your password and connected accounts.
          </p>
        </CardContent>
      </Card>

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />

          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently deletes your account and all associated data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Account
              </Button>
            </div>
          ) : (
            <div className={cn("rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3")}>
              <p className="text-sm font-medium text-destructive">
                Are you sure? This will permanently delete your account and all your data.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Yes, delete my account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
