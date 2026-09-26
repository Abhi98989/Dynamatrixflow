"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, Sparkles, FolderPlus } from "lucide-react";
import { Priority, ProjectStatus, SystemRole } from "@prisma/client";
import { createProjectAction } from "./actions";

interface LeadOption {
  id: string;
  name: string;
  employeeId: string;
  position: string | null;
  systemRole: SystemRole;
}

interface NewProjectFormProps {
  leads: LeadOption[];
  currentUserId: string;
  currentUserRole: SystemRole;
}

export function NewProjectForm({
  leads,
  currentUserId,
  currentUserRole: _currentUserRole,
}: NewProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [codeMode, setCodeMode] = useState<"auto" | "custom">("auto");
  const [prefix, setPrefix] = useState("PRJ");
  const [customCode, setCustomCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side date check
    if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
      setError("Project deadline cannot be earlier than start date.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    if (codeMode === "custom") {
      formData.set("projectCode", customCode.trim().toUpperCase());
      formData.delete("prefix");
    } else {
      formData.set("prefix", prefix.trim().toUpperCase());
      formData.delete("projectCode");
    }

    startTransition(async () => {
      const res = await createProjectAction(undefined, formData);
      if (res.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.projectId) {
        router.push(`/projects/${res.projectId}`);
      } else {
        router.push("/projects");
      }
    });
  };

  return (
    <div className="w-full">
      {/* Top Breadcrumb & Header */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 border border-[#DBEAFE]">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Create New Project
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Initialize a scoped client or internal workspace with dedicated lead and tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 p-5 sm:p-7 space-y-6"
      >
        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold">Unable to create project:</span> {error}
            </div>
          </div>
        )}

        {/* Section 1: Project Identity */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Project Identity
            </h2>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                disabled={isPending}
                placeholder="e.g. Core API Gateway v3.0"
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm text-slate-900 disabled:opacity-60"
              />
            </div>

            {/* Project Code Strategy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Project Code
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCodeMode("auto")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      codeMode === "auto"
                        ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Auto-Generate
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setCodeMode("custom")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      codeMode === "custom"
                        ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Custom Code
                  </button>
                </div>
              </div>

              {codeMode === "auto" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="relative">
                    <input
                      id="prefix"
                      name="prefix"
                      type="text"
                      maxLength={5}
                      value={prefix}
                      disabled={isPending}
                      onChange={(e) =>
                        setPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
                      }
                      placeholder="e.g. CORE"
                      className="w-full h-10 px-3 font-mono rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm uppercase text-slate-900 disabled:opacity-60"
                    />
                    <Sparkles className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2.5 flex items-center justify-between">
                    <span>Generated Format:</span>
                    <span className="font-mono font-bold text-[#4F46E5]">
                      DF-{prefix || "PRJ"}-###
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    id="customCode"
                    name="customCode"
                    type="text"
                    required={codeMode === "custom"}
                    value={customCode}
                    disabled={isPending}
                    onChange={(e) =>
                      setCustomCode(
                        e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase()
                      )
                    }
                    placeholder="e.g. DF-EXP-001 or PROJ-882"
                    className="w-full h-10 px-3 font-mono rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm uppercase text-slate-900 disabled:opacity-60"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Uppercase alphanumeric with hyphens. Must be globally unique.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="clientName"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Client / Department
              </label>
              <input
                id="clientName"
                name="clientName"
                type="text"
                disabled={isPending}
                placeholder="e.g. Internal Infrastructure or Acme Corp"
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm text-slate-900 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Description / Scope
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                disabled={isPending}
                placeholder="Brief summary of requirements, deliverables, and goals..."
                className="w-full p-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm text-slate-900 resize-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Configuration & Leads */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Execution & Assignment
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="projectLeadId"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Project Lead <span className="text-red-500">*</span>
              </label>
              <select
                id="projectLeadId"
                name="projectLeadId"
                required
                defaultValue={
                  leads.find((l) => l.id === currentUserId)?.id ||
                  leads[0]?.id ||
                  ""
                }
                disabled={isPending}
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm bg-white text-slate-900 disabled:opacity-60"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.employeeId}) {l.position ? `— ${l.position}` : ""}{" "}
                    {l.id === currentUserId ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="status"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={ProjectStatus.PLANNING}
                disabled={isPending}
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm bg-white text-slate-900 disabled:opacity-60"
              >
                <option value={ProjectStatus.PLANNING}>Planning</option>
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.ON_HOLD}>On Hold</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="priority"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={Priority.MEDIUM}
                disabled={isPending}
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm bg-white text-slate-900 disabled:opacity-60"
              >
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.CRITICAL}>Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="startDate"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Target Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm text-slate-900 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="deadline"
                className="text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Target Deadline
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isPending}
                className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] text-sm text-slate-900 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Link
            href="/projects"
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5B5FEF] text-white rounded-md text-sm font-semibold hover:bg-[#4C50D8] active:bg-[#4145C2] transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
