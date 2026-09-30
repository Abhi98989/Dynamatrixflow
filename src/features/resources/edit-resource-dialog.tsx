"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { ResourceCategory } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Loader2, AlertCircle } from "lucide-react";
import { updateResourceAction } from "./actions";

interface EditResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: {
    id: string;
    title: string;
    url: string;
    description: string | null;
    category: ResourceCategory;
    tags: string[];
    relatedTask: { id: string } | null;
  };
  projectId: string;
  tasks: { id: string; taskCode: string; title: string }[];
}

export function EditResourceDialog({
  open,
  onOpenChange,
  resource,
  projectId,
  tasks,
}: EditResourceDialogProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateResourceAction(resource.id, projectId, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="size-5 text-primary" />
            Edit Knowledge Resource
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={resource.title}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url" className="text-xs">
              URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              required
              defaultValue={resource.url}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                name="category"
                required
                defaultValue={resource.category}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.values(ResourceCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="relatedTaskId" className="text-xs">
                Related Task (Optional)
              </Label>
              <select
                id="relatedTaskId"
                name="relatedTaskId"
                defaultValue={resource.relatedTask?.id || ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- None --</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.taskCode} - {t.title.substring(0, 20)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs">
              Tags (Comma separated)
            </Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={resource.tags.join(", ")}
              placeholder="e.g., frontend, auth, guide"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">
              Description (Optional)
            </Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={resource.description || ""}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief context about this resource..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Update Resource
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
