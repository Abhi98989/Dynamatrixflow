"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { revokeGuestAction } from "./actions";
import { Trash2 } from "lucide-react";
export function RevokeGuestButton({
  guestUserId,
  projectId,
  guestName,
}: {
  guestUserId: string;
  projectId: string;
  guestName: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    if (!confirm(`Are you sure you want to revoke guest access for ${guestName}? They will no longer be able to monitor this project.`)) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("guestUserId", guestUserId);
      formData.set("projectId", projectId);

      const res = await revokeGuestAction(formData);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={handleRevoke}
      className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
      title="Revoke Guest Access"
    >
      <Trash2 className="w-3.5 h-3.5 mr-1" />
      {isPending ? "Revoking..." : "Revoke"}
    </Button>
  );
}
