import { Link, useLocation } from "@tanstack/react-router";
import { Flame, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BottomNav() {
  const loc = useLocation();
  const { profile } = useAuth();

  const items = [
    { to: "/discover", label: "Descobrir", Icon: Flame },
    { to: "/matches",  label: "Matches",   Icon: MessageCircle },
    { to: "/me",       label: "Perfil",    Icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-4 safe-bottom pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 rounded-[28px] border border-white/10 bg-background/80 backdrop-blur-2xl px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {items.map(({ to, label, Icon }) => {
          const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
          const isProfile = to === "/me";

          return (
            <Link
              key={to}
              to={to}
              className="relative flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-300"
              style={active ? {
                background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)",
                boxShadow: "0 0 16px hsl(var(--primary) / 0.45)",
              } : {}}
            >
              {isProfile && profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt=""
                  className={`h-5 w-5 rounded-full object-cover transition-all duration-200 ${
                    active ? "ring-1 ring-white/60" : "ring-1 ring-border"
                  }`}
                />
              ) : (
                <Icon
                  className={`h-[18px] w-[18px] transition-colors duration-200 shrink-0 ${
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.3 : 1.8}
                />
              )}

              <span
                className={`text-[13px] font-semibold leading-none transition-all duration-300 overflow-hidden ${
                  active
                    ? "max-w-[80px] opacity-100 text-primary-foreground"
                    : "max-w-0 opacity-0"
                }`}
                style={{ whiteSpace: "nowrap" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
