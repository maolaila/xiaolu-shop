import { BottomNavClient } from "@/components/store/bottom-nav-client";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <main className="grid min-h-screen place-items-center bg-wash px-4 pb-24 pt-10">
        <div className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-soft">{children}</div>
      </main>
      <BottomNavClient isLoggedIn={Boolean(user)} />
    </>
  );
}
