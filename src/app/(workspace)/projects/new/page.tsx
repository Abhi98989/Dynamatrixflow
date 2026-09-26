import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { SystemRole, AccountStatus } from "@prisma/client";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { NewProjectForm } from "@/features/projects/new-project-form";

export const metadata: Metadata = {
  title: "Create Project | Dynamatrix Flow",
  description: "Initialize a new project workspace.",
};

export default async function NewProjectPage() {
  const currentUser = await requireActiveUser();
  const canCreate =
    currentUser.systemRole === SystemRole.ADMIN ||
    currentUser.systemRole === SystemRole.PROJECT_LEAD;

  if (!canCreate) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            You are signed in as an employee. Only Administrators and Project Leads have permission to initialize new projects.
          </p>
          <div className="mt-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5FEF] text-white rounded-md text-sm font-semibold hover:bg-[#4C50D8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch active users for lead assignment
  const leads = await db.user.findMany({
    where: { accountStatus: AccountStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      employeeId: true,
      position: true,
      systemRole: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <NewProjectForm
        leads={leads}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.systemRole}
      />
    </div>
  );
}
