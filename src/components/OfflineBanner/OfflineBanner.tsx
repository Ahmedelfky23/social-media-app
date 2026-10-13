import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WifiOff, RotateCw } from "lucide-react";
import { Button } from "#components/ui/button";

function useNetworkState() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { online };
}

export default function OfflineBanner() {
  const { online } = useNetworkState();

  const isOffline = online === false;

  const handleRetry = () => window.location.reload();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6"
        >
          <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-rose-500/20 bg-white/85 px-4 py-3 shadow-lg shadow-rose-500/10 backdrop-blur-xl dark:border-rose-400/20 dark:bg-rose-950/60 sm:gap-4 sm:px-5">
            {/* Icon with a soft ping to signal "trying to reconnect" */}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400 sm:size-11">
              <WifiOff className="size-5 sm:size-6" aria-hidden="true" />
              <span
                className="absolute inset-0 animate-ping rounded-full bg-rose-500/20 dark:bg-rose-400/20"
                aria-hidden="true"
              />
            </div>

            {/* Message */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                No internet connection
              </p>
              <p className="mt-0.5 truncate text-xs text-rose-700/80 dark:text-rose-200/70">
                Check your network — we&apos;ll reconnect automatically.
              </p>
            </div>

            {/* Retry */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="shrink-0 border-rose-500/30 bg-transparent text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-400/10 dark:hover:text-rose-100"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
