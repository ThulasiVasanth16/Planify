"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { TeamMember } from "@/lib/team";

interface OpenOptions {
  status?: string;
  projectId?: string;
  onSuccess?: (task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project_id: string | null;
    project_name: string | null;
    description: string | null;
    notes: string | null;
    assignee_id: string | null;
    due_date: string | null;
    created_at: string;
  }) => void;
}

interface CreateTaskContextValue {
  open: (options?: OpenOptions) => void;
  registerOnSuccess: (callback: OpenOptions["onSuccess"]) => () => void;
}

const CreateTaskContext = createContext<CreateTaskContextValue | null>(null);

export function useCreateTask() {
  const ctx = useContext(CreateTaskContext);
  if (!ctx)
    throw new Error("useCreateTask must be used within CreateTaskProvider");
  return ctx;
}

interface CreateTaskProviderProps {
  children: React.ReactNode;
  projects: { id: string; name: string }[];
  teamMembers: TeamMember[];
}

export function CreateTaskProvider({
  children,
  projects,
  teamMembers,
}: CreateTaskProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<string>("todo");
  const [defaultProjectId, setDefaultProjectId] = useState<string>("");
  const [onSuccess, setOnSuccess] = useState<OpenOptions["onSuccess"]>();

  // Store registered callbacks in a ref
  const callbacksRef = useRef<OpenOptions["onSuccess"][]>([]);

  function open({
    status = "todo",
    projectId = "",
    onSuccess,
  }: OpenOptions = {}) {
    setDefaultStatus(status);
    setDefaultProjectId(projectId);
    setOnSuccess(() => onSuccess);
    setIsOpen(true);
  }

  // Register a callback to be called when a task is created
  const registerOnSuccess = useCallback(
    (callback: OpenOptions["onSuccess"]) => {
      callbacksRef.current.push(callback);
      // Return unsubscribe function
      return () => {
        const index = callbacksRef.current.indexOf(callback);
        if (index > -1) {
          callbacksRef.current.splice(index, 1);
        }
      };
    },
    [],
  );

  // Get all registered callbacks (filter out undefined)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCallbacks = useCallback(() => {
    return callbacksRef.current.filter((cb: any) => !!cb);
  }, []);

  return (
    <CreateTaskContext.Provider value={{ open, registerOnSuccess }}>
      {children}
      <CreateTaskModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projects={projects}
        teamMembers={teamMembers}
        defaultStatus={defaultStatus}
        defaultProjectId={defaultProjectId}
        onSuccess={onSuccess}
        getAllCallbacks={getCallbacks as any}
      />
    </CreateTaskContext.Provider>
  );
}
