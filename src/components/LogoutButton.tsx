"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="eyebrow active:scale-95 transition-transform"
    >
      Log out
    </button>
  );
}
