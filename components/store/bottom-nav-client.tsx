"use client";

import { ClipboardList, Grid3X3, Home, ShoppingCart, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function BottomNavClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "首页", icon: Home, active: pathname === "/" },
    { href: "/products", label: "分类", icon: Grid3X3, active: pathname.startsWith("/products") },
    { href: "/cart", label: "购物车", icon: ShoppingCart, active: pathname.startsWith("/cart") || pathname.startsWith("/checkout") },
    { href: "/orders", label: "订单", icon: ClipboardList, active: pathname.startsWith("/orders") },
    {
      href: isLoggedIn ? "/orders" : "/login",
      label: isLoggedIn ? "我的" : "登录",
      icon: UserRound,
      active: pathname.startsWith("/login") || pathname.startsWith("/register")
    }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className={cn(
                "grid place-items-center gap-0.5 text-[11px] font-medium",
                item.active ? "text-red-600" : "text-muted"
              )}
              href={item.href}
              key={item.label}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
