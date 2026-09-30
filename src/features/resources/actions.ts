"use server";

import { db } from "@/server/db/client";
import {
  requireActiveUser,
  canManageProject,
} from "@/server/auth/authorization";
import { ResourceCategory, SystemRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

const ALLOWED_EXTS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".txt",
  ".csv",
  ".zip",
  ".json",
];

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export async function createResourceAction(
  projectId: string,
  formData: FormData,
) {
  try {
    const currentUser = await requireActiveUser();
    const member = await db.projectMember.findFirst({
      where: { projectId, userId: currentUser.id, removedAt: null },
    });

    if (!member && currentUser.systemRole !== SystemRole.ADMIN) {
      return { error: "You are not a member of this project." };
    }

    const titleInput = formData.get("title") as string | null;
    const mode = (formData.get("mode") as string) || "url";
    let url = (formData.get("url") as string) || "";
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as ResourceCategory;
    const description = formData.get("description") as string | null;
    const tagsInput = formData.get("tags") as string | null;
    const relatedTaskId = formData.get("relatedTaskId") as string | null;

    let finalTitle = titleInput?.trim() || "";

    // Handle File Upload Mode
    if (
      mode === "file" ||
      (file && file.size > 0 && typeof file.name === "string")
    ) {
      if (!file || file.size === 0) {
        return { error: "Please choose a document or image file to upload." };
      }

      if (file.size > MAX_FILE_SIZE) {
        return {
          error:
            "File size exceeds 30MB limit. Please compress or choose a smaller file.",
        };
      }

      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        return {
          error: `Unsupported file format (${ext}). Supported formats: PDF, Word (DOC/DOCX), Excel, PPT, PNG, JPG, WEBP, SVG, CSV, TXT, ZIP.`,
        };
      }

      // Auto-extract title if empty
      if (!finalTitle) {
        finalTitle =
          path.basename(file.name, ext).replace(/[-_]/g, " ").trim() ||
          "Uploaded Document";
      }

      // Ensure upload directory exists
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "resources",
      );
      await fs.promises.mkdir(uploadDir, { recursive: true });

      const rawBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40);
      const uniqueName = `${Date.now()}_${rawBase || "resource"}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      const bytes = await file.arrayBuffer();
      await fs.promises.writeFile(filePath, Buffer.from(bytes));

      url = `/api/uploads/resources/${uniqueName}`;
    } else {
      // URL Mode
      if (!url) {
        return { error: "Destination URL is required for web links." };
      }

      try {
        new URL(url);
      } catch {
        return {
          error:
            "Invalid URL. Please enter a valid URL starting with http:// or https://",
        };
      }

      if (!finalTitle) {
        return { error: "Resource Title is required." };
      }
    }

    if (!category) {
      return { error: "Category is required." };
    }

    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    await db.$transaction(async (tx) => {
      const resource = await tx.projectResource.create({
        data: {
          projectId,
          title: finalTitle,
          url,
          category,
          description: description?.trim() || null,
          tags,
          relatedTaskId: relatedTaskId || null,
          addedById: currentUser.id,
        },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: currentUser.id,
          action: "CREATED_RESOURCE",
          entityType: "RESOURCE",
          entityId: resource.id,
          metadata: { title: finalTitle, url, category, mode },
        },
      });
    });

    revalidatePath(`/projects/${projectId}/resources`);
    revalidatePath("/resources");
    return { success: true };
  } catch (error: unknown) {
    console.error("Create resource error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create resource.";
    return { error: message };
  }
}

export async function archiveResourceAction(
  resourceId: string,
  projectId: string,
) {
  try {
    const currentUser = await requireActiveUser();

    const resource = await db.projectResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.projectId !== projectId) {
      return { error: "Resource not found." };
    }

    const isManager = await canManageProject(currentUser.id, projectId);
    const isOwner = resource.addedById === currentUser.id;

    if (!isManager && !isOwner) {
      return {
        error:
          "Only Project Leads, Admins, or the creator can archive this resource.",
      };
    }

    await db.$transaction(async (tx) => {
      await tx.projectResource.update({
        where: { id: resourceId },
        data: { archivedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: currentUser.id,
          action: "ARCHIVED_RESOURCE",
          entityType: "RESOURCE",
          entityId: resourceId,
          metadata: { title: resource.title },
        },
      });
    });

    revalidatePath(`/projects/${projectId}/resources`);
    revalidatePath("/resources");
    return { success: true };
  } catch (error: unknown) {
    console.error("Archive resource error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to archive resource.";
    return { error: message };
  }
}

export async function updateResourceAction(
  resourceId: string,
  projectId: string,
  formData: FormData,
) {
  try {
    const currentUser = await requireActiveUser();

    const resource = await db.projectResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.projectId !== projectId) {
      return { error: "Resource not found." };
    }

    const isManager = await canManageProject(currentUser.id, projectId);
    const isOwner = resource.addedById === currentUser.id;

    if (!isManager && !isOwner) {
      return {
        error:
          "Only Project Leads, Admins, or the creator can edit this resource.",
      };
    }

    const title = (formData.get("title") as string)?.trim();
    let url = (formData.get("url") as string)?.trim() || resource.url;
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as ResourceCategory;
    const description = formData.get("description") as string | null;
    const tagsInput = formData.get("tags") as string | null;
    const relatedTaskId = formData.get("relatedTaskId") as string | null;

    if (!title) {
      return { error: "Title is required." };
    }

    // If new file uploaded during edit
    if (file && file.size > 0 && typeof file.name === "string") {
      if (file.size > MAX_FILE_SIZE) {
        return { error: "File size exceeds 30MB limit." };
      }
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        return { error: `Unsupported file type (${ext}).` };
      }

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "resources",
      );
      await fs.promises.mkdir(uploadDir, { recursive: true });

      const rawBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40);
      const uniqueName = `${Date.now()}_${rawBase || "resource"}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      const bytes = await file.arrayBuffer();
      await fs.promises.writeFile(filePath, Buffer.from(bytes));
      url = `/api/uploads/resources/${uniqueName}`;
    } else if (
      url &&
      !url.startsWith("/api/uploads/") &&
      !url.startsWith("/uploads/")
    ) {
      try {
        new URL(url);
      } catch {
        return { error: "Invalid URL provided." };
      }
    }

    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    await db.$transaction(async (tx) => {
      await tx.projectResource.update({
        where: { id: resourceId },
        data: {
          title,
          url,
          category,
          description: description?.trim() || null,
          tags,
          relatedTaskId: relatedTaskId || null,
        },
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: currentUser.id,
          action: "UPDATED_RESOURCE",
          entityType: "RESOURCE",
          entityId: resourceId,
          metadata: { title, url, category },
        },
      });
    });

    revalidatePath(`/projects/${projectId}/resources`);
    revalidatePath("/resources");
    return { success: true };
  } catch (error: unknown) {
    console.error("Update resource error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update resource.";
    return { error: message };
  }
}
