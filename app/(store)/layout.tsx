import { BottomNavClient } from "@/components/store/bottom-nav-client";
import { StoreHeader } from "@/components/store/header";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <StoreHeader />
      <main className="pb-20">{children}</main>
      <BottomNavClient isLoggedIn={Boolean(user)} />
    </>
  );
}
