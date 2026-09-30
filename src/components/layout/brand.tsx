export function Brand({
  className = "text-sidebar-text-active",
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex items-center ${className}`}
      aria-label="Dynamatrix Flow"
    >
      <img 
        src="/assets/logo-light.png" 
        alt="Dynamatrix Flow" 
        className="h-[42px] w-auto"
      />
    </div>
  );
}
