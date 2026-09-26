import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Dynamatrix Flow",
  description:
    "Internal project and team management workspace for Dynamatrix Solution.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full">
      {children}
    </div>
  );
}
