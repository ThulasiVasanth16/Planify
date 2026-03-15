"use client";

import { useRouter } from "next/navigation";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { TeamMember } from "@/lib/team";

interface NewTaskPageClientProps {
  projects: { id: string; name: string }[];
  teamMembers: TeamMember[];
}

export function NewTaskPageClient({
  projects,
  teamMembers,
}: NewTaskPageClientProps) {
  const router = useRouter();

  function handleClose() {
    router.push("/tasks");
  }

  return (
    <div className='flex h-full items-center justify-center'>
      <CreateTaskModal
        isOpen={true}
        onClose={handleClose}
        projects={projects}
        teamMembers={teamMembers}
        defaultStatus='todo'
      />
    </div>
  );
}
