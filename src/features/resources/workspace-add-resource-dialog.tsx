'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { ResourceCategory } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Link as LinkIcon, AlertCircle, Loader2 } from 'lucide-react';
import { createResourceAction } from './actions';

interface ProjectOption {
  id: string;
  name: string;
  projectCode: string;
}

interface WorkspaceAddResourceDialogProps {
  projects: ProjectOption[];
}

const CATEGORIES: { label: string; value: ResourceCategory }[] = [
  { label: 'Documentation', value: 'DOCUMENTATION' },
  { label: 'Development', value: 'DEVELOPMENT' },
  { label: 'API Reference', value: 'API' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Design Asset', value: 'DESIGN' },
  { label: 'Client Reference', value: 'CLIENT_REFERENCE' },
  { label: 'Competitor', value: 'COMPETITOR' },
  { label: 'Meeting Note', value: 'MEETING' },
  { label: 'Tutorial', value: 'TUTORIAL' },
  { label: 'Other', value: 'OTHER' },
];

export function WorkspaceAddResourceDialog({ projects }: WorkspaceAddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setErrorMsg('Please select a project to associate this resource with.');
      return;
    }

    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createResourceAction(selectedProjectId, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5B5FEF] hover:bg-[#4C50D8] text-white rounded-[6px] text-[13px] font-semibold transition-colors"
        >
          <Plus className="size-4" />
          Add Resource
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] rounded-[10px] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold text-[#101828]">
            <LinkIcon className="size-5 text-[#5B5FEF]" />
            Add Knowledge Resource
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#475467]">
            Add documentation, repository links, architectural guides, or technical assets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-[6px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[12px] text-[#DC2626]">
              <AlertCircle className="size-4 shrink-0 text-[#DC2626]" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="projectSelect" className="text-[12px] font-semibold text-[#101828]">
              Project Workspace <span className="text-[#DC2626]">*</span>
            </Label>
            <select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              className="w-full h-9 rounded-[6px] border border-[#D0D5DD] bg-white px-3 text-[13px] text-[#101828] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-[12px] font-semibold text-[#101828]">
              Resource Title <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g., API Architecture Specification v2"
              className="h-9 text-[13px]"
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url" className="text-[12px] font-semibold text-[#101828]">
              Destination URL <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://github.com/... or https://docs..."
              className="h-9 text-[13px]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-[12px] font-semibold text-[#101828]">
              Category <span className="text-[#DC2626]">*</span>
            </Label>
            <select
              id="category"
              name="category"
              required
              defaultValue="DOCUMENTATION"
              className="w-full h-9 rounded-[6px] border border-[#D0D5DD] bg-white px-3 text-[13px] text-[#101828] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-[12px] font-semibold text-[#101828]">
              Description <span className="text-[#667085] font-normal">(Optional)</span>
            </Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Brief context on how this asset is used..."
              className="w-full rounded-[6px] border border-[#D0D5DD] bg-white p-2.5 text-[13px] text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-[#5B5FEF]"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-[12px] font-semibold text-[#101828]">
              Tags <span className="text-[#667085] font-normal">(Comma-separated)</span>
            </Label>
            <Input
              id="tags"
              name="tags"
              placeholder="api, v2, spec, frontend"
              className="h-9 text-[13px]"
            />
          </div>

          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E7EC]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-[13px] font-medium text-[#475467] hover:bg-[#F9FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#5B5FEF] hover:bg-[#4C50D8] text-white text-[13px] font-semibold disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isPending ? 'Saving...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
