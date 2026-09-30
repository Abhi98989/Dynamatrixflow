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
import { Button } from "@/components/ui/button";
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

interface AddResourceDialogProps {
  projectId: string;
  tasks: { id: string; taskCode: string; title: string }[];
}

export function AddResourceDialog({
  projectId,
  tasks,
}: AddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

    const ext = file.name.split(".").pop() || "";
    const cleanName = file.name
      .replace(new RegExp(`\\.${ext}$`, "i"), "")
      .replace(/[-_]/g, " ")
      .trim();

    if (!title || title.trim().length === 0) {
      setTitle(cleanName);
    }

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

  const handleReset = () => {
    setTitle("");
    setSelectedFile(null);
    setErrorMsg(null);
    setCategory("DOCUMENTATION");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      const res = await createResourceAction(projectId, formData);
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
        <Button size="sm" className="gap-1.5 text-xs h-8">
          <Plus className="size-3.5" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="size-5 text-primary" />
            Add Knowledge Resource
          </DialogTitle>
          <DialogDescription>
            Upload files (PDF, DOCX, Images, Sheets) or share an external web
            link.
          </DialogDescription>
        </DialogHeader>

        {/* Source Mode Toggle */}
        <div className="flex items-center p-1 bg-surface-secondary rounded-lg mt-2">
          <button
            type="button"
            onClick={() => {
              setMode("file");
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              mode === "file"
                ? "bg-surface text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <UploadCloud className="size-3.5 text-primary" />
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
                ? "bg-surface text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <LinkIcon className="size-3.5 text-primary" />
            External Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {/* FILE UPLOAD MODE */}
          {mode === "file" ? (
            <div className="space-y-2">
              <Label className="text-xs">
                Select or Drop File <span className="text-red-500">*</span>
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface-secondary/40 hover:bg-surface-secondary"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-surface shadow-xs border border-border flex items-center justify-center mx-auto mb-2 text-primary">
                    <UploadCloud className="size-4" />
                  </div>
                  <p className="text-xs font-semibold text-text-primary">
                    Click to upload{" "}
                    <span className="font-normal text-text-secondary">
                      or drag and drop
                    </span>
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    PDF, DOC, DOCX, PNG, JPG, XLSX, PPTX, or ZIP (max 30MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-surface">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-text-primary truncate block">
                          {selectedFile.name}
                        </span>
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <span className="text-[10px] text-text-muted">
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
                      className="p-1 text-text-muted hover:text-red-600 rounded transition-colors"
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
              <Label htmlFor="url" className="text-xs">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                name="url"
                type="url"
                required={mode === "url"}
                disabled={isPending}
                placeholder="https://..."
                className="text-xs"
              />
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
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., API Documentation V2"
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
                disabled={isPending}
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ResourceCategory)
                }
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
                disabled={isPending}
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
              disabled={isPending}
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
              disabled={isPending}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief context about this resource..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                handleReset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              {mode === "file" ? "Upload & Save" : "Save Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
