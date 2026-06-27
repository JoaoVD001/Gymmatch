import { Link, useLocation } from "@tanstack/react-router";
import { Flame, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BottomNav() {
  const loc = useLocation();
  const { profile } = useAuth();

  const items = [
    { to: "/discover", Icon: Flame },
    { to: "/matches",  Icon: MessageCircle },
    { to: "/me",       Icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-5 safe-bottom pointer-events-none">
      <div className="pointer-events-auto flex items-center rounded-[28px] bg-card border border-border/40 px-3 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {items.map(({ to, Icon }) => {
          const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
          const isProfile = to === "/me";

          return (
            <Link
              key={to}
              to={to}
              className="relative flex h-14 w-16 items-center justify-center"
            >
              {active && (
                <>
                  {/* Barra vermelha no topo */}
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary))]" />
                  {/* Cone de luz descendo */}
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-14 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse 70% 100% at 50% 0%, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0.15) 50%, transparent 80%)",
                    }}
                  />
                </>
              )}

              {isProfile && profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt=""
                  className={`relative z-10 h-6 w-6 rounded-full object-cover transition-all duration-200 ${
                    active
                      ? "ring-2 ring-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                      : "ring-1 ring-white/20 opacity-50"
                  }`}
                />
              ) : (
                <Icon
                  className={`relative z-10 transition-all duration-200 ${
                    active
                      ? "h-[22px] w-[22px] text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]"
                      : "h-[20px] w-[20px] text-muted-foreground/50"
                  }`}
                  strokeWidth={active ? 2 : 1.5}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
