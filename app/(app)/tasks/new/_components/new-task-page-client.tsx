"use client";

import { useRouter } from "next/navigation";
import { CreateTaskModal } from "@/components/modals/create-task-modal";

interface NewTaskPageClientProps {
  projects: { id: string; name: string }[];
}

export function NewTaskPageClient({ projects }: NewTaskPageClientProps) {
  const router = useRouter();

  function handleClose() {
    router.push("/tasks");
  }

  return (
    <div className="flex h-full items-center justify-center">
      <CreateTaskModal
        isOpen={true}
        onClose={handleClose}
        projects={projects}
        defaultStatus="todo"
      />
    </div>
  );
}
