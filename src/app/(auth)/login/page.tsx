import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user && !session.user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <div 
      className="relative flex h-screen max-h-screen w-full items-center justify-center p-3 sm:p-5 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: 'url("/assets/image.png")' }}
    >
      {/* Unified Main Card matching Template */}
      <div className="relative z-10 flex w-full max-w-[850px] min-h-[540px] max-h-[94vh] flex-col lg:flex-row rounded-[32px] sm:rounded-[36px] overflow-hidden shadow-[24px_32px_64px_rgba(15,23,42,0.22),-16px_-16px_40px_rgba(255,255,255,1),inset_0_2px_3px_rgba(255,255,255,1)] border border-white/80 bg-white">
        
        {/* Left Side: Dark Panel with Full Artwork */}
        <div className="relative hidden lg:flex w-[50%] min-h-[540px] overflow-hidden shrink-0">
          <img 
            src="/assets/left-panel-mockup.png" 
            alt="Dynamatrix Flow - Plan. Collaborate. Deliver." 
            className="w-full h-full object-cover object-center select-none pointer-events-none"
          />
          <h1 className="sr-only">
            Plan. Collaborate. Deliver. Dynamatrix Flow Project & Team Workspace
          </h1>
        </div>

        {/* Right Side: with image.png background as requested */}
        <div 
          className="relative z-10 flex w-full lg:w-[50%] flex-col items-center justify-center py-3.5 px-4 sm:px-6 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/assets/image.png")' }}
        >
          {/* Top 3D Clay Brand Lockup */}
          <div className="flex flex-col items-center justify-center mb-2">
            <img 
              src="/assets/dynamatrix-clay-brand-lockup.png" 
              alt="Dynamatrix Flow - Project & Team Workspace" 
              className="h-[56px] sm:h-[62px] w-auto object-contain select-none pointer-events-none" 
            />
          </div>

          {/* Floating White Clay Card with Form */}
          <div className="w-full max-w-[348px] rounded-[24px] bg-white p-3.5 sm:p-4 shadow-[12px_18px_36px_rgba(164,178,202,0.36),-8px_-8px_20px_rgba(255,255,255,1),inset_0_2px_3px_rgba(255,255,255,0.95)] border border-white">
            <div className="space-y-0.5 mb-2">
              <h2 className="text-[20px] sm:text-[21px] font-extrabold tracking-tight text-[#0B1220]">
                Welcome back
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Enter your Employee ID to access the workspace.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
