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

  const activeIndex = items.findIndex(({ to }) =>
    loc.pathname === to || loc.pathname.startsWith(to + "/")
  );

  const ITEM_W = 64;
  const PX = 12;
  const centerX = PX + activeIndex * ITEM_W + ITEM_W / 2;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-5 safe-bottom pointer-events-none">
      <style>{`
        @keyframes beam-on {
          0%   { opacity: 0; transform: scaleY(0); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: scaleY(1); }
        }
        .beam-cone {
          transform-origin: top center;
          animation: beam-on 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div className="pointer-events-auto relative flex items-center rounded-[28px] bg-card border border-border/40 px-3 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* Barra — desliza suavemente */}
        <span
          className="absolute top-0 h-[3px] w-8 rounded-full bg-primary pointer-events-none z-20"
          style={{
            left: 0,
            transform: `translateX(${centerX - 16}px)`,
            transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 0 10px 2px hsl(var(--primary) / 0.7)",
          }}
        />

        {/* Cone — acende na nova posição, sem slide */}
        <span
          key={activeIndex}
          className="beam-cone absolute top-0 h-full w-16 pointer-events-none bg-gradient-to-b from-primary/45 via-primary/10 to-transparent"
          style={{
            left: `${centerX - 32}px`,
            clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
          }}
        />

        {items.map(({ to, Icon }, idx) => {
          const active = idx === activeIndex;
          const isProfile = to === "/me";

          return (
            <Link
              key={to}
              to={to}
              className="relative z-10 flex h-14 w-16 items-center justify-center"
            >
              {isProfile && profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt=""
                  className={`h-6 w-6 rounded-full object-cover transition-all duration-300 ${
                    active
                      ? "ring-2 ring-primary opacity-100"
                      : "ring-1 ring-border opacity-50"
                  }`}
                />
              ) : (
                <Icon
                  className={`transition-all duration-300 ${
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
