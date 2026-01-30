"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: number;
  email: string;
  message: string;
  appointmentId: number | null;
  createdAt: string;
  read: number;
}

interface NotificationsPanelProps {
  onMarkAsRead?: () => void;
}

export function NotificationsPanel({ onMarkAsRead }: NotificationsPanelProps) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (email?: string) => {
    const emailToUse = email ?? session?.user?.email;
    if (!emailToUse) return;
    setLoading(true);
    try {
      const url = `/api/notifications?email=${encodeURIComponent(emailToUse)}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications(session.user.email);
    }
  }, [session?.user?.email]);

  const markAsRead = async (id: number) => {
    const email = session?.user?.email;
    if (!email) return;
    try {
      await fetch(
        `/api/notifications/${id}/read?email=${encodeURIComponent(email)}`,
        { method: "PATCH", credentials: "include" }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
      );
      onMarkAsRead?.();
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b pb-4 mb-4">
        <Bell className="h-6 w-6 text-primary shrink-0" />
        <h2 className="font-semibold text-lg">Notifications</h2>
        {unreadCount > 0 && (
          <span className="rounded-full bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5">
            {unreadCount}
          </span>
        )}
      </div>

      {status === "loading" ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !session?.user?.email ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">Log in to see messages from the clinic about your appointments.</p>
          <Button asChild size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      ) : null}

      {session?.user?.email && (
        <div className="flex-1 min-h-0 flex flex-col">
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {session.user.email}
          </p>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6">No notifications yet.</p>
          ) : (
            <ScrollArea className="flex-1 pr-2 -mr-2">
              <ul className="space-y-3 pb-4">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg border p-3 text-sm ${
                      n.read
                        ? "bg-muted/40 border-border text-muted-foreground"
                        : "bg-primary/10 border-primary/30 border-l-4 border-l-primary font-medium text-foreground"
                    }`}
                  >
                    <p className="text-xs mb-1 flex items-center gap-1">
                      <span className={n.read ? "text-muted-foreground" : "text-primary"}>
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                      {!n.read && (
                        <span className="text-primary font-semibold">New</span>
                      )}
                    </p>
                    <p className={`whitespace-pre-wrap break-words ${n.read ? "text-muted-foreground" : ""}`}>{n.message}</p>
                    {!n.read && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 p-0 h-auto text-xs text-muted-foreground"
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
