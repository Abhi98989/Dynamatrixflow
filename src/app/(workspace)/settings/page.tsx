import { Metadata } from 'next';
import { requireActiveUser } from '@/server/auth/authorization';
import { db } from '@/server/db/client';
import { WorkspaceSettingsView } from '@/features/settings/workspace-settings-view';

export const metadata: Metadata = {
  title: 'Workspace Settings | Dynamatrix Flow',
  description: 'Manage workspace configuration, notification rules, display density, and security policies.',
};

export default async function SettingsPage() {
  const sessionUser = await requireActiveUser();

  const user = await db.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      systemRole: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const currentUser = {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    systemRole: user.systemRole,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <WorkspaceSettingsView currentUser={currentUser} />
    </div>
  );
}
