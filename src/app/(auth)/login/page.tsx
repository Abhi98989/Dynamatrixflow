import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import Image from "next/image";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.mustChangePassword) {
      redirect("/change-password");
    }
    redirect("/dashboard");
  }

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left Side */}
      <div className="relative hidden md:flex flex-1 flex-col justify-between bg-[#0B1020] px-12 py-16 lg:px-20 overflow-hidden">
        {/* Abstract CSS Background matching screenshot */}
        <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl from-[#2563EB]/20 to-transparent rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#5B5FEF]/30 to-transparent rounded-full blur-[120px]" />
          
          {/* Glowing structural plates */}
          <div className="absolute top-1/4 right-0 w-[400px] h-[250px] border border-[#2563EB]/20 bg-gradient-to-r from-transparent to-[#2563EB]/40 rounded-3xl transform rotate-12 blur-[1px] backdrop-blur-sm" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[300px] border border-[#5B5FEF]/20 bg-gradient-to-br from-[#2563EB]/40 to-transparent rounded-3xl transform -rotate-12 blur-[1px] backdrop-blur-sm shadow-[0_0_80px_rgba(37,99,235,0.4)]" />
          
          {/* Dot pattern */}
          <div className="absolute bottom-16 left-16 grid grid-cols-5 gap-6 opacity-[0.15]">
            {[...Array(25)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white rounded-full" />
            ))}
          </div>
        </div>

        <div className="relative z-10 w-[200px] h-[60px] overflow-hidden flex items-center">
          <Image 
            src="/logo-new.png" 
            alt="Dynamatrix Flow Logo" 
            width={280} 
            height={140} 
            className="w-[200px] h-[100px] object-cover object-center mix-blend-screen -ml-2"
            priority
          />
        </div>

        <div className="relative z-10 mt-auto mb-20 space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-[72px] max-w-lg leading-[1.1]">
            Plan.<br/>
            Collaborate.<br/>
            <span className="text-[#2563EB]">Deliver.</span>
          </h1>
          <p className="max-w-[400px] text-[#94A3B8] text-lg leading-relaxed">
            A focused command center for Dynamatrix Solution&apos;s projects and team.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 lg:px-24">
        <div className="w-full max-w-[440px] mx-auto space-y-10">
          <div className="text-center flex flex-col items-center">
            <Image 
              src="/app-icon.png" 
              alt="App Icon" 
              width={64} 
              height={64} 
              className="object-contain mb-6 rounded-[14px] shadow-sm ring-1 ring-black/5"
              priority
            />
            <div className="space-y-2">
              <h2 className="text-[36px] font-bold tracking-tight text-[#101828]">Welcome back</h2>
              <p className="text-[15px] text-[#667085]">
                Enter your Employee ID to access the workspace.
              </p>
            </div>
          </div>
          
          <LoginForm />
          
          {/* Demo Credentials Helper */}
          <div className="mt-10 rounded-xl bg-[#F9FAFC] border border-[#EEF1F5] p-5 text-sm text-[#475467]">
             <div className="flex items-center gap-2 font-semibold text-[#101828] mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h6"/></svg>
               Demo Credentials
             </div>
             <div className="grid gap-y-3 text-[13px]">
               <div className="flex justify-between items-center">
                 <span className="text-[#667085]">Admin</span>
                 <code className="font-mono text-[#101828]">DMS-001</code>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[#667085]">Employee</span>
                 <code className="font-mono text-[#101828]">DMS-003</code>
               </div>
               <div className="flex justify-between items-center pt-3 mt-1 border-t border-[#EEF1F5]">
                 <span className="text-[#667085]">Password</span>
                 <code className="font-mono text-[#101828] select-all">DynamatrixDev123!</code>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
