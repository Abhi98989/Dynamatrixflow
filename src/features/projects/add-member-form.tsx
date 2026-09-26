"use client";

import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { addMemberAction } from "@/server/projects/member-actions";

interface User {
  id: string;
  name: string;
  employeeId: string;
  position: string | null;
}

export function AddMemberForm({ projectId, availableUsers }: { projectId: string; availableUsers: User[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 h-8 bg-[#5B5FEF] rounded-md text-[13px] font-semibold text-white hover:bg-[#4C50D8] transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" /> Add Member
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await addMemberAction(formData);
        setOpen(false);
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="projectId" value={projectId} />

      <select
        name="userId"
        required
        className="h-8 px-2.5 bg-white border border-[#E4E7EC] rounded-md text-[13px] text-[#101828] focus:outline-none focus:border-[#5B5FEF] min-w-[180px]"
      >
        <option value="">Select employee…</option>
        {availableUsers.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.employeeId})
          </option>
        ))}
      </select>

      <select
        name="projectRole"
        className="h-8 px-2.5 bg-white border border-[#E4E7EC] rounded-md text-[13px] text-[#101828] focus:outline-none focus:border-[#5B5FEF]"
      >
        <option value="DEVELOPER">Developer</option>
        <option value="DESIGNER">Designer</option>
        <option value="QA">QA</option>
        <option value="RESEARCHER">Researcher</option>
        <option value="PROJECT_LEAD">Lead</option>
        <option value="OTHER">Other</option>
      </select>

      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-3 h-8 bg-[#5B5FEF] rounded-md text-[13px] font-semibold text-white hover:bg-[#4C50D8] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add
      </button>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-8 px-3 border border-[#E4E7EC] rounded-md text-[13px] font-medium text-[#667085] hover:bg-[#F9FAFC] transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
