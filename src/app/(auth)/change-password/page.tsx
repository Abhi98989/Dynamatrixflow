import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { Brand } from "@/components/layout/brand";
import { KeyRound } from "lucide-react";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-[420px]">
        <Card className="border-border shadow-md bg-surface">
          <CardHeader className="space-y-3 pb-6 text-center">
            <div className="flex justify-center pb-2">
              <Brand className="text-text-primary" />
            </div>
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-text-primary">
              Password Change Required
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary px-2">
              Welcome, {session.user.name}. As a security precaution for internal
              company accounts, please set a personal password to access your
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <ChangePasswordForm />
            <div className="mt-4 pt-4 border-t border-[#E4E7EC] text-center">
              <form action={async () => {
                "use server";
                const { logoutAction } = await import("@/server/auth/actions");
                await logoutAction();
              }}>
                <button
                  type="submit"
                  className="text-xs text-[#667085] hover:text-[#101828] underline transition-colors cursor-pointer"
                >
                  ← Sign in with a different account
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
