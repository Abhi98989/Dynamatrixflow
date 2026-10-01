import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { AccountStatus } from "@prisma/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify fresh status and mustChangePassword directly from DB to support instant revocation
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      employeeId: true,
      systemRole: true,
      accountStatus: true,
      position: true,
      mustChangePassword: true,
    },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <div className="min-h-dvh">
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <Topbar user={user} />
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full outline-none bg-[#F6F7FB] min-h-[calc(100dvh-64px)] p-2 sm:p-3 lg:p-4"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
