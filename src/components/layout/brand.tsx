
export function Brand({ className = "text-sidebar-text-active" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      aria-label="Dynamatrix Flow"
    >
      <div className="flex items-center gap-3">
        {/* SVG Logo */}
        <svg width="40" height="40" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <defs>
            <linearGradient id="left-grad" x1="0" y1="0" x2="100" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="right-grad" x1="80" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          <path d="M 25,30 L 65,30 L 90,80 L 65,130 L 25,130 Z" fill="url(#left-grad)" />
          <path d="M 78,30 L 90,30 A 50 50 0 0 1 90 130 L 78,130 L 103,80 Z" fill="url(#right-grad)" />
        </svg>
        
        {/* Brand Text */}
        <div className="flex flex-col pt-1">
          <span className="text-[22px] leading-none font-bold tracking-tight flex items-center gap-1.5">
            Dynamatrix <span className="bg-gradient-to-r from-[#5B5FEF] via-[#2563EB] to-[#06B6D4] bg-clip-text text-transparent">Flow</span>
          </span>
          <span className="text-[9px] mt-1 font-semibold tracking-[0.2em] uppercase opacity-70">
            Project & Team Workspace
          </span>
        </div>
      </div>
    </div>
  );
}
