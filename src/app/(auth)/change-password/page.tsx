import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { KeyRound } from "lucide-react";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url("/assets/image.png")' }}
    >
      <div className="relative z-10 flex w-full max-w-[480px] flex-col items-center">
        {/* Top 3D Clay Brand Lockup */}
        <div className="flex flex-col items-center justify-center mb-4">
          <img
            src="/assets/dynamatrix-clay-brand-lockup.png"
            alt="Dynamatrix Flow"
            className="h-[52px] sm:h-[58px] w-auto object-contain select-none pointer-events-none drop-shadow-sm"
          />
        </div>

        {/* Floating White Clay Card */}
        <div className="w-full rounded-[28px] bg-white p-6 sm:p-8 shadow-[16px_22px_45px_rgba(15,23,42,0.18),-10px_-10px_24px_rgba(255,255,255,1),inset_0_2px_3px_rgba(255,255,255,0.95)] border border-white">
          <div className="flex flex-col items-center text-center space-y-2 mb-6">
            <div className="size-12 rounded-2xl bg-[#EEF2F8] border border-white flex items-center justify-center text-primary shadow-[inset_2px_2px_5px_rgba(160,175,200,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]">
              <KeyRound className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B1220]">
                Security Setup Required
              </h1>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
                Welcome, <strong className="text-[#0B1220] font-semibold">{session.user.name}</strong>. Please choose a personal password for your workspace account.
              </p>
            </div>
          </div>

          <ChangePasswordForm />

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <form
              action={async () => {
                "use server";
                const { logoutAction } = await import("@/server/auth/actions");
                await logoutAction();
              }}
            >
              <button
                type="submit"
                className="text-xs text-[#64748B] hover:text-[#0B1220] font-medium underline transition-colors cursor-pointer"
              >
                ← Sign in with a different account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
