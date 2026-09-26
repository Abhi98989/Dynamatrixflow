"use client";

import { X } from "lucide-react";
import { removeMemberAction } from "@/server/projects/member-actions";

export function RemoveMemberButton({ memberId, projectId, memberName }: { memberId: string; projectId: string; memberName: string }) {
  return (
    <form
      action={async (formData) => {
        if (!confirm(`Remove ${memberName} from this project?`)) return;
        await removeMemberAction(formData);
      }}
    >
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        className="w-6 h-6 rounded flex items-center justify-center text-[#98A2B3] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
        title={`Remove ${memberName}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
