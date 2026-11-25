"use client";
import Link from "next/link";
import { useTransition } from "react";
import type { Notification } from "@/lib/types";
import { markNotificationsReadAction } from "@/app/actions/account";
import { Icon } from "@/components/ui/Icon";
import { formatRelativeDays } from "@/lib/format";

const ICON: Record<string, string> = { order: "package", subscription: "wallet", shop: "store", tip: "bulb", announcement: "bell" };

export function NotificationList({ items }: { items: Notification[] }) {
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <>
      {unread > 0 && <button type="button" disabled={pending} className="btn btn-secondary btn-sm press mb-4" onClick={() => start(async () => { await markNotificationsReadAction(); })}>Tout marquer comme lu</button>}
      <ul className="card divide-y divide-line">{items.map((n) => {
        const body = (<><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${n.read_at ? "bg-mist text-slate" : "bg-orange-soft text-orange-text"}`}><Icon name={ICON[n.kind]} size={18} /></span>
          <span className="min-w-0 flex-1"><span className={`block text-sm ${n.read_at ? "" : "font-semibold"}`}>{n.title}</span>{n.body && <span className="block text-sm text-slate">{n.body}</span>}
            <span className="text-xs text-slate">{formatRelativeDays(n.created_at)}</span></span>{!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-orange" aria-label="Non lue" />}</>);
        return (
          <li key={n.id}>{n.link
            ? <Link href={n.link} onClick={() => { if (!n.read_at) void markNotificationsReadAction([n.id]); }} className="press flex gap-3 p-4 hover:bg-mist">{body}</Link>
            : <div className="flex gap-3 p-4">{body}</div>}</li>
        );
      })}</ul>
    </>
  );
}
