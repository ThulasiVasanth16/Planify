"use client";

import { useState, useEffect } from "react";
import { Users, X, Plus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectMember {
  member_id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: string;
}

interface ProjectMembersModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProjectMembersModal({
  projectId,
  isOpen,
  onClose,
}: ProjectMembersModalProps) {
  const [assigned, setAssigned] = useState<ProjectMember[]>([]);
  const [available, setAvailable] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchMembers();
    }
  }, [isOpen, projectId]);

  async function fetchMembers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      const data = await res.json();
      setAssigned(data.assigned || []);
      setAvailable(data.available || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
    setLoading(false);
  }

  async function addMember(memberId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        // Move from available to assigned
        const member = available.find((m) => m.member_id === memberId);
        if (member) {
          setAssigned([...assigned, member]);
          setAvailable(available.filter((m) => m.member_id !== memberId));
        }
      }
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  }

  async function removeMember(memberId: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        // Move from assigned to available
        const member = assigned.find((m) => m.member_id === memberId);
        if (member) {
          setAssigned(assigned.filter((m) => m.member_id !== memberId));
          setAvailable([...available, member]);
        }
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Project Members</h2>
          <button onClick={onClose} className='rounded-md p-1 hover:bg-muted'>
            <X className='h-4 w-4' />
          </button>
        </div>

        {loading ? (
          <p className='text-center text-muted-foreground'>Loading...</p>
        ) : (
          <>
            {/* Assigned Members */}
            <div className='mb-4'>
              <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
                Currently Assigned ({assigned.length})
              </h3>
              {assigned.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No team members assigned yet.
                </p>
              ) : (
                <div className='space-y-2'>
                  {assigned.map((member) => (
                    <div
                      key={member.member_id}
                      className='flex items-center justify-between rounded-lg border border-border bg-background p-2'
                    >
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='text-xs'>
                            {initials(member.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium'>
                            {member.display_name}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(member.member_id)}
                        className='rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive'
                      >
                        <UserMinus className='h-4 w-4' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Members */}
            <div>
              <h3 className='mb-2 text-sm font-medium text-muted-foreground'>
                Available Team Members ({available.length})
              </h3>
              {available.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No more team members to add. Invite more members from the Team
                  page.
                </p>
              ) : (
                <div className='space-y-2'>
                  {available.map((member) => (
                    <div
                      key={member.member_id}
                      className='flex items-center justify-between rounded-lg border border-border bg-background p-2'
                    >
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='text-xs'>
                            {initials(member.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='text-sm font-medium'>
                            {member.display_name}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => addMember(member.member_id)}
                        className='rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90'
                      >
                        <Plus className='h-3 w-3' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Button variant='ghost' className='mt-4 w-full' onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
