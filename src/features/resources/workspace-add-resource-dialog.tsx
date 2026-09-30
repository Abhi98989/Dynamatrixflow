"use client";

import * as React from "react";
import { useState, useTransition, useRef } from "react";
import { ResourceCategory } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  File,
  X,
  CheckCircle2,
} from "lucide-react";
import { createResourceAction } from "./actions";

interface ProjectOption {
  id: string;
  name: string;
  projectCode: string;
}

interface WorkspaceAddResourceDialogProps {
  projects: ProjectOption[];
}

const CATEGORIES: { label: string; value: ResourceCategory }[] = [
  { label: "Documentation", value: "DOCUMENTATION" },
  { label: "Development", value: "DEVELOPMENT" },
  { label: "API Reference", value: "API" },
  { label: "Research", value: "RESEARCH" },
  { label: "Design Asset", value: "DESIGN" },
  { label: "Client Reference", value: "CLIENT_REFERENCE" },
  { label: "Competitor", value: "COMPETITOR" },
  { label: "Meeting Note", value: "MEETING" },
  { label: "Tutorial", value: "TUTORIAL" },
  { label: "Other", value: "OTHER" },
];

export function WorkspaceAddResourceDialog({
  projects,
}: WorkspaceAddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || "",
  );
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("DOCUMENTATION");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext || "")) {
      return <ImageIcon className="size-6 text-purple-600" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return <FileSpreadsheet className="size-6 text-emerald-600" />;
    }
    if (["zip", "rar", "tar", "gz"].includes(ext || "")) {
      return <FileArchive className="size-6 text-amber-600" />;
    }
    if (["pdf"].includes(ext || "")) {
      return <FileText className="size-6 text-red-600" />;
    }
    return <File className="size-6 text-blue-600" />;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);

    // Auto-populate Title if empty or was previously auto-filled
    const ext = file.name.split(".").pop() || "";
    const cleanName = file.name
      .replace(new RegExp(`\\.${ext}$`, "i"), "")
      .replace(/[-_]/g, " ")
      .trim();

    if (!title || title.trim().length === 0) {
      setTitle(cleanName);
    }

    // Auto-select smart category
    const extLower = ext.toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(extLower)) {
      setCategory("DESIGN");
    } else if (["pdf", "doc", "docx", "txt", "md"].includes(extLower)) {
      setCategory("DOCUMENTATION");
    } else if (["xls", "xlsx", "csv"].includes(extLower)) {
      setCategory("RESEARCH");
    } else if (["ppt", "pptx"].includes(extLower)) {
      setCategory("CLIENT_REFERENCE");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReset = () => {
    setTitle("");
    setSelectedFile(null);
    setErrorMsg(null);
    setCategory("DOCUMENTATION");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setErrorMsg("Please select a project workspace.");
      return;
    }

    if (mode === "file" && !selectedFile) {
      setErrorMsg("Please choose a file to upload (PDF, Docs, or Image).");
      return;
    }

    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.set("mode", mode);
    formData.set("title", title);
    formData.set("category", category);

    if (mode === "file" && selectedFile) {
      formData.set("file", selectedFile);
    }

    startTransition(async () => {
      const res = await createResourceAction(selectedProjectId, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        handleReset();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleReset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-[6px] text-[13px] font-semibold transition-colors"
        >
          <Plus className="size-4" />
          Add Resource
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] rounded-[10px] p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold text-foreground">
            <UploadCloud className="size-5 text-primary" />
            Add Knowledge Resource
          </DialogTitle>
          <DialogDescription className="text-[13px] text-text-secondary">
            Upload files (PDF, DOCX, Images, Spreadsheets) or bookmark external
            web links.
          </DialogDescription>
        </DialogHeader>

        {/* Source Mode Toggle (File vs Link) */}
        <div className="flex items-center p-1 bg-surface-hover rounded-lg mt-3">
          <button
            type="button"
            onClick={() => {
              setMode("file");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              mode === "file"
                ? "bg-surface text-foreground shadow-xs"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <UploadCloud className="size-4 text-primary" />
            Upload File (PDF, Docs, Image)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("url");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              mode === "url"
                ? "bg-surface text-foreground shadow-xs"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <LinkIcon className="size-3.5 text-primary" />
            External Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-[6px] border border-[#FECACA] bg-[#FEF2F2] p-3 text-[12px] text-[#DC2626]">
              <AlertCircle className="size-4 shrink-0 text-[#DC2626]" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-1.5">
            <Label
              htmlFor="projectSelect"
              className="text-[12px] font-semibold text-foreground"
            >
              Project Workspace <span className="text-[#DC2626]">*</span>
            </Label>
            <select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              disabled={isPending}
              className="w-full h-9 rounded-[6px] border border-border-subtle bg-surface px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          {/* FILE UPLOAD MODE */}
          {mode === "file" ? (
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold text-foreground">
                Select or Drop File <span className="text-[#DC2626]">*</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                disabled={isPending}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg,.gif,.txt,.csv,.zip,.json"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-[#EEF2FF]"
                      : "border-border-subtle bg-background hover:bg-surface-hover"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-surface shadow-xs border border-border flex items-center justify-center mx-auto mb-2 text-primary">
                    <UploadCloud className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Click to upload{" "}
                    <span className="font-normal text-text-muted">
                      or drag and drop
                    </span>
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    PDF, DOC, DOCX, PNG, JPG, XLSX, PPTX, or ZIP (max 30MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-surface">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {selectedFile.name}
                        </span>
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <span className="text-[11px] text-text-muted">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary hover:underline px-2 py-1"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="p-1 text-text-muted hover:text-[#DC2626] rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL MODE */
            <div className="space-y-1.5">
              <Label
                htmlFor="url"
                className="text-[12px] font-semibold text-foreground"
              >
                Destination URL <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="url"
                name="url"
                type="url"
                required={mode === "url"}
                disabled={isPending}
                placeholder="https://github.com/... or https://docs..."
                className="h-9 text-[13px]"
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="title"
              className="text-[12px] font-semibold text-foreground"
            >
              Resource Title <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., API Architecture Specification v2"
              className="h-9 text-[13px]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label
              htmlFor="category"
              className="text-[12px] font-semibold text-foreground"
            >
              Category <span className="text-[#DC2626]">*</span>
            </Label>
            <select
              id="category"
              name="category"
              required
              disabled={isPending}
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              className="w-full h-9 rounded-[6px] border border-border-subtle bg-surface px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
            <Label
              htmlFor="description"
              className="text-[12px] font-semibold text-foreground"
            >
              Description{" "}
              <span className="text-text-muted font-normal">(Optional)</span>
            </Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              disabled={isPending}
              placeholder="Brief context on how this asset is used..."
              className="w-full rounded-[6px] border border-border-subtle bg-surface p-2.5 text-[13px] text-foreground placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label
              htmlFor="tags"
              className="text-[12px] font-semibold text-foreground"
            >
              Tags{" "}
              <span className="text-text-muted font-normal">
                (Comma-separated)
              </span>
            </Label>
            <Input
              id="tags"
              name="tags"
              disabled={isPending}
              placeholder="api, v2, spec, frontend"
              className="h-9 text-[13px]"
            />
          </div>

          {/* Dialog Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                handleReset();
                setOpen(false);
              }}
              disabled={isPending}
              className="px-3.5 py-1.5 text-[13px] font-medium text-text-secondary hover:bg-surface-hover rounded-[6px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-[6px] text-[13px] font-semibold transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "file" ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Add Resource"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
