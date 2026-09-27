import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // If already authenticated and password is not pending change, go to dashboard
  if (session?.user && !session.user.mustChangePassword) {
    redirect("/dashboard");
  }

  // Default entry point for root URL is the login page
  redirect("/login");
}
