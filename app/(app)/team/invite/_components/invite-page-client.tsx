"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InviteMembersModal } from "@/components/modals/InviteMembersModal";
import type { TeamMember } from "@/lib/team";

interface InvitePageClientProps {
  members: TeamMember[];
  ownerProfile: { user_id: string; display_name: string } | null;
}

export function InvitePageClient({ members: initialMembers, ownerProfile }: InvitePageClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);

  function handleClose() {
    router.push("/team");
  }

  return (
    <div className="flex h-full items-center justify-center">
      <InviteMembersModal
        isOpen={true}
        onClose={handleClose}
        members={members}
        ownerProfile={ownerProfile}
        onInvite={(member) => setMembers((prev) => [...prev, member])}
        onCancel={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
      />
    </div>
  );
}
