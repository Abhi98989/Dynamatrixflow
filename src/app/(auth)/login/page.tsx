import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { Brand } from "@/components/layout/brand";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.mustChangePassword) {
      redirect("/change-password");
    }
    redirect("/dashboard");
  }

  return (
    <div className="flex w-full min-h-screen overflow-hidden bg-[#F9FAFC]">
      {/* Left Showcase Side */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between bg-[#0B1020] px-12 py-12 lg:px-20 overflow-hidden">
        {/* Abstract Modern Grid Background */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl from-[#2563EB]/20 to-transparent rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#5B5FEF]/25 to-transparent rounded-full blur-[120px]" />
          
          {/* Subtle structural geometry */}
          <div className="absolute top-1/4 right-0 w-[420px] h-[260px] border border-white/[0.08] bg-gradient-to-r from-transparent to-[#2563EB]/20 rounded-3xl transform rotate-12 blur-[0.5px] backdrop-blur-sm" />
          <div className="absolute bottom-1/4 left-1/4 w-[480px] h-[280px] border border-white/[0.06] bg-gradient-to-br from-[#5B5FEF]/20 to-transparent rounded-3xl transform -rotate-12 blur-[0.5px] backdrop-blur-sm" />
          
          {/* Subtle Grid Dots */}
          <div className="absolute bottom-12 left-16 grid grid-cols-6 gap-6 opacity-[0.12]">
            {[...Array(36)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white rounded-full" />
            ))}
          </div>
        </div>

        {/* Clean Vector Brand Logo */}
        <div className="relative z-10">
          <Brand />
        </div>

        {/* Hero Narrative */}
        <div className="relative z-10 mt-auto mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 text-[12px] font-medium backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B5FEF] animate-pulse" />
            Enterprise Workspace
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12]">
            Plan.<br />
            Collaborate.<br />
            <span className="bg-gradient-to-r from-[#5B5FEF] via-[#60A5FA] to-[#38BDF8] bg-clip-text text-transparent">
              Deliver.
            </span>
          </h1>

          <p className="max-w-[420px] text-[#94A3B8] text-[14px] sm:text-[15px] leading-relaxed">
            The unified command center for Dynamatrix Solution&apos;s project lifecycles, Kanban delivery, and cross-functional teams.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-5 text-[12px] text-[#94A3B8]/80 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Role-Based Access
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B5FEF]" /> Real-Time Auditing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" /> Milestone Tracking
            </span>
          </div>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 lg:px-20 xl:px-24">
        <div className="w-full max-w-[380px] mx-auto space-y-8">
          <div className="text-center flex flex-col items-center">
            {/* Minimal Brand Mark */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0B1020] to-[#1E293B] border border-[#E4E7EC] flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="login-mark-left" x1="0" y1="0" x2="100" y2="160" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="login-mark-right" x1="80" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <path d="M 25,30 L 65,30 L 90,80 L 65,130 L 25,130 Z" fill="url(#login-mark-left)" />
                <path d="M 78,30 L 90,30 A 50 50 0 0 1 90 130 L 78,130 L 103,80 Z" fill="url(#login-mark-right)" />
              </svg>
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-[24px] font-bold tracking-tight text-[#101828]">Welcome to Dynamatrix Flow</h2>
              <p className="text-[13px] text-[#667085]">
                Sign in with your Employee ID to access your workspace.
              </p>
            </div>
          </div>
          
          <LoginForm />

          <p className="text-center text-[12px] text-[#98A2B3] pt-4">
            Authorized Personnel Only · Protected by Enterprise RBAC
          </p>
        </div>
      </div>
    </div>
  );
}
