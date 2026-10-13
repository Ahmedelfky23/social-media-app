import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import type { NotificationType } from "../../types/Notification.type";

const API = "https://route-posts.routemisr.com";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

/* ------------------------------- API calls ------------------------------ */
async function getUnreadCount(): Promise<number> {
  const res = await axios.get(`${API}/notifications/unread-count`, {
    headers: authHeaders(),
  });
  return res.data.data.unreadCount ?? 0;
}

async function getNotifications(): Promise<NotificationType[]> {
  const res = await axios.get(
    `${API}/notifications?unread=false&page=1&limit=10`,
    { headers: authHeaders() },
  );
  return res.data.data.notifications ?? [];
}

/* -------------------------------- helpers ------------------------------- */
function notificationText(type: string): string {
  if (type.includes("follow")) return "started following you";
  if (type.includes("reply")) return "replied to your comment";
  if (type.includes("comment")) return "commented on your post";
  if (type.includes("share")) return "shared your post";
  if (type.includes("like")) return "liked your post";
  return "interacted with you";
}

function TypeIcon({ type }: { type: string }) {
  const base =
    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white ring-2 ring-white dark:ring-[#0f172a]";
  if (type.includes("like"))
    return (
      <span className={`${base} bg-linear-to-br from-rose-500 to-pink-500`}>
        <Heart size={13} className="fill-white" />
      </span>
    );
  if (type.includes("comment") || type.includes("reply"))
    return (
      <span className={`${base} bg-linear-to-br from-[#083695] to-[#4a7fd4]`}>
        <MessageCircle size={13} />
      </span>
    );
  if (type.includes("follow"))
    return (
      <span className={`${base} bg-linear-to-br from-emerald-500 to-teal-500`}>
        <UserPlus size={13} />
      </span>
    );
  return (
    <span className={`${base} bg-linear-to-br from-[#083695] to-[#4a7fd4]`}>
      <Bell size={13} />
    </span>
  );
}

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const hasToken = !!localStorage.getItem("token");

  /* Unread badge count (kept fresh every 30s) */
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    enabled: hasToken,
    refetchInterval: 30000,
  });

  /* Notifications list (fetched when the dropdown opens) */
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: getNotifications,
    enabled: hasToken && open,
  });

  function refreshNotifications() {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  /* Mark one notification as read */
  const markRead = useMutation({
    mutationFn: (id: string) =>
      axios.patch(`${API}/notifications/${id}/read`, null, {
        headers: authHeaders(),
      }),
    onSuccess: refreshNotifications,
  });

  /* Mark all notifications as read */
  const markAllRead = useMutation({
    mutationFn: () =>
      axios.patch(`${API}/notifications/read-all`, null, {
        headers: authHeaders(),
      }),
    onSuccess: refreshNotifications,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  function handleOpenNotification(n: NotificationType) {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.entityType === "post" && n.entityId) {
      setOpen(false);
      navigate(`/post/${n.entityId}`);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative text-[#083695] dark:text-gray-300 cursor-pointer hover:bg-[#083695]/10 dark:hover:bg-white/10 p-1.5 sm:p-2 rounded-full transition-colors"
      >
        <Bell size={18} className="sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold ring-2 ring-[#f2f5fa] dark:ring-[#0f172a]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 z-50 origin-top-right rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8">
            <h3 className="text-sm font-semibold text-[#083695] dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#083695] dark:hover:text-blue-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markAllRead.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Mark all as read
              </button>
            )}
          </div>

          {/* list */}
          <div className="max-h-[60dvh] sm:max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-white/8">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2
                  size={22}
                  className="animate-spin text-gray-400 dark:text-gray-500"
                />
              </div>
            ) : isError ? (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                Failed to load notifications.
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleOpenNotification(n)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer ${
                    !n.isRead ? "bg-[#083695]/3 dark:bg-blue-400/6" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={n.actor.photo}
                      alt={n.actor.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <TypeIcon type={n.type} />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {n.actor.name}
                      </span>{" "}
                      {notificationText(n.type)}
                    </p>
                    {n.entity?.body && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        &quot;{n.entity.body}&quot;
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#083695] dark:bg-blue-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


