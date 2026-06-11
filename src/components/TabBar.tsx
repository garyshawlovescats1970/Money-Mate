"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/money", label: "Money", icon: WalletIcon },
  { href: "/bills", label: "Bills", icon: BoltIcon },
  { href: "/deals", label: "Deals", icon: TagIcon },
  { href: "/invest", label: "Invest", icon: ChartIcon },
  { href: "/coach", label: "Coach", icon: ChatIcon },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      <div className="mx-auto flex max-w-[430px]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 active:scale-95 transition-transform"
            >
              <Icon active={active} />
              <span
                className={`mono text-[10px] uppercase tracking-widest ${
                  active ? "brand-text" : "text-muted"
                }`}
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

function stroke(active: boolean) {
  return active ? "url(#brandGrad)" : "#8A91A8";
}

function Defs() {
  return (
    <defs>
      <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8B7CFF" />
        <stop offset="1" stopColor="#5B8CFF" />
      </linearGradient>
    </defs>
  );
}

type P = { active: boolean };
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function WalletIcon({ active }: P) {
  return (
    <svg {...base} stroke={stroke(active)}>
      <Defs />
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" fill={stroke(active)} stroke="none" />
    </svg>
  );
}

function BoltIcon({ active }: P) {
  return (
    <svg {...base} stroke={stroke(active)}>
      <Defs />
      <path d="M13 3 5 13.5h6L11 21l8-10.5h-6L13 3Z" />
    </svg>
  );
}

function TagIcon({ active }: P) {
  return (
    <svg {...base} stroke={stroke(active)}>
      <Defs />
      <path d="M3 11V4a1 1 0 0 1 1-1h7l10 10-8 8L3 11Z" />
      <circle cx="8" cy="8" r="1.2" fill={stroke(active)} stroke="none" />
    </svg>
  );
}

function ChartIcon({ active }: P) {
  return (
    <svg {...base} stroke={stroke(active)}>
      <Defs />
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </svg>
  );
}

function ChatIcon({ active }: P) {
  return (
    <svg {...base} stroke={stroke(active)}>
      <Defs />
      <path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12Z" />
    </svg>
  );
}
