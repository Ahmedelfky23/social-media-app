import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "motion/react";
import { Home, ArrowLeft, Compass, Ghost } from "lucide-react";

export default function Notfound() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex items-center justify-center py-10 sm:py-16 px-4">
      <Helmet>
        <title>Page not found | SocialApp</title>
        <meta
          name="description"
          content="The page you are looking for does not exist."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-2xl overflow-hidden bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-100 dark:border-white/10 shadow-xl shadow-[#083695]/5 dark:shadow-black/30 px-6 py-12 sm:px-12 sm:py-14 text-center"
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#083695]/10 dark:bg-blue-500/15 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#4a7fd4]/15 dark:bg-indigo-500/15 blur-[80px]" />

        <div className="relative">
          {/* ghost badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 16 }}
            className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-linear-to-br from-[#083695] to-[#4a7fd4] flex items-center justify-center shadow-lg shadow-[#083695]/30"
          >
            <Ghost size={40} className="text-white" />
          </motion.div>

          {/* big 404 */}
          <p className="text-[64px] sm:text-[88px] leading-none font-black tracking-tight">
            <span className="bg-linear-to-br from-[#083695] via-[#1a5bd4] to-[#4a7fd4] dark:from-white dark:via-blue-200 dark:to-blue-400 bg-clip-text text-transparent">
              404
            </span>
          </p>

          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Lost in the feed?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            The page you're looking for doesn't exist, was moved, or the link
            is broken. Let's get you back to the good stuff.
          </p>

          {/* actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#083695] hover:bg-[#0a337c] text-white text-sm font-semibold px-6 py-3 shadow-md shadow-[#083695]/25 transition-all hover:-translate-y-0.5"
            >
              <Home size={17} />
              Back to Home
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-[#083695]/40 hover:text-[#083695] dark:hover:text-white dark:hover:border-white/25 text-sm font-semibold px-6 py-3 transition-all cursor-pointer"
            >
              <ArrowLeft size={17} />
              Go Back
            </button>
          </div>

          {/* quick links */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/8 flex items-center justify-center gap-1 text-sm">
            <Compass size={15} className="text-gray-400" />
            <span className="text-gray-400 dark:text-gray-500 mr-1">Try:</span>
            {[
              { label: "Feed", to: "/home" },
              { label: "Profile", to: "/profile" },
              { label: "Bookmarks", to: "/bookmarks" },
              { label: "Chats", to: "/chats" },
            ].map((l, i) => (
              <span key={l.to} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300 dark:text-gray-600">•</span>}
                <Link
                  to={l.to}
                  className="text-[#083695] dark:text-blue-400 font-medium hover:underline"
                >
                  {l.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

