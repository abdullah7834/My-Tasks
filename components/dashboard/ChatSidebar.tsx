"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";

export default function ChatSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 px-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
      >
        <span className="inline-flex items-center gap-2">
          <MessageSquare size={16} strokeWidth={1.75} />
          Chats
        </span>
        <ChevronDown
          size={18}
          className={open ? "rotate-180 transition text-foreground" : "transition"}
        />
      </button>

      {open ? (
        <div className="mt-1 space-y-1">
          <Link
            href="/dashboard/chats"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-foreground ml-6"
          >
            My Chats
          </Link>
        </div>
      ) : null}
    </div>
  );
}
