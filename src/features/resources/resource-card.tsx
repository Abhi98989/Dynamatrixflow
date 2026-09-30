"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import { ResourceCategory } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ExternalLink,
  Copy,
  Trash2,
  Check,
  Link as LinkIcon,
  BookOpen,
  Code,
  PenTool,
  Server,
  Users,
  Video,
  Monitor,
  Edit2,
  Download,
} from "lucide-react";
import { archiveResourceAction } from "./actions";
import { EditResourceDialog } from "./edit-resource-dialog";

interface Resource {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: ResourceCategory;
  tags: string[];
  addedBy: {
    id: string;
    name: string;
  };
  relatedTask: {
    id: string;
    taskCode: string;
    title: string;
  } | null;
  createdAt: Date;
}

interface ResourceCardProps {
  resource: Resource;
  projectId: string;
  currentUserId: string;
  isManager: boolean;
  tasks: { id: string; taskCode: string; title: string }[];
}

const CATEGORY_ICONS: Record<ResourceCategory, React.ElementType> = {
  RESEARCH: BookOpen,
  DOCUMENTATION: FileText,
  DEVELOPMENT: Code,
  DESIGN: PenTool,
  API: Server,
  CLIENT_REFERENCE: Users,
  COMPETITOR: Monitor,
  MEETING: Video,
  TUTORIAL: BookOpen,
  OTHER: LinkIcon,
};

export function ResourceCard({
  resource,
  projectId,
  currentUserId,
  isManager,
  tasks,
}: ResourceCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const Icon = CATEGORY_ICONS[resource.category] || FileText;
  const canEdit = isManager || resource.addedBy.id === currentUserId;
  const isFile =
    resource.url.startsWith("/api/uploads/") ||
    resource.url.startsWith("/uploads/") ||
    /\.(pdf|docx?|xlsx?|pptx?|png|jpe?g|webp|svg|zip)$/i.test(resource.url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resource.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleArchive = () => {
    if (!confirm("Are you sure you want to archive this resource?")) return;
    startTransition(async () => {
      await archiveResourceAction(resource.id, projectId);
    });
  };

  return (
    <Card className="p-4.5 flex flex-col gap-3 rounded-2xl border border-[rgba(220,227,240,0.85)] bg-surface shadow-clay hover:border-primary/40 transition-all h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            <Icon className="size-4" />
          </div>
          <div>
            <h4
              className="font-semibold text-sm text-text-primary line-clamp-1"
              title={resource.title}
            >
              {resource.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-surface-secondary text-text-secondary border border-border tracking-wide uppercase">
                {resource.category.replace("_", " ")}
              </span>
              {isFile && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 tracking-wide uppercase">
                  File
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-text-muted hover:text-text-primary"
            onClick={handleCopy}
            title="Copy URL"
          >
            {copied ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            download={isFile ? true : undefined}
            className="inline-flex items-center justify-center size-7 rounded-md text-text-muted hover:bg-surface-secondary hover:text-primary transition-colors"
            title={isFile ? "Download / View File" : "Open Link"}
          >
            {isFile ? (
              <Download className="size-3.5" />
            ) : (
              <ExternalLink className="size-3.5" />
            )}
          </a>
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-text-muted hover:text-primary hover:bg-surface-secondary"
                onClick={() => setEditOpen(true)}
                title="Edit Resource"
              >
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={handleArchive}
                disabled={isPending}
                title="Archive Resource"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {resource.description && (
        <p className="text-xs text-text-secondary line-clamp-2 mt-1">
          {resource.description}
        </p>
      )}

      {/* Tags & Task Link */}
      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
        {resource.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] text-text-secondary bg-surface-secondary px-1.5 py-0.5 rounded"
          >
            #{tag}
          </span>
        ))}
        {resource.relatedTask && (
          <a
            href={`/projects/${projectId}/tasks/${resource.relatedTask.id}`}
            className="text-[10px] text-primary hover:underline bg-primary/5 px-1.5 py-0.5 rounded ml-auto flex items-center gap-1"
          >
            <LinkIcon className="size-2.5" />
            {resource.relatedTask.taskCode}
          </a>
        )}
      </div>

      <div className="text-[10px] text-text-muted flex items-center justify-between mt-1 pt-2 border-t border-border/50">
        <span>Added by {resource.addedBy.name}</span>
        <span>{new Date(resource.createdAt).toLocaleDateString("en-US")}</span>
      </div>

      {canEdit && (
        <EditResourceDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          resource={resource}
          projectId={projectId}
          tasks={tasks}
        />
      )}
    </Card>
  );
}
