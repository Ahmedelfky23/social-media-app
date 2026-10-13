import { SidebarBody, SidebarLink, useSidebar } from "../ui/sidebar";
import { NavLink } from "react-router-dom";
import logo from "../../assets/routebg.jpg";
import logo3 from "../../assets/route3.svg"
import logo2 from "../../assets/route2.png"
import logo4 from "../../assets/route4.png"

import {
  IconArrowLeft,
  IconBookmark,
  IconHome,
  IconMessageCircle,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Loader } from "../Loader/Loader";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "../PostCard/PostCard";
import FollowSuggestions from "../FollowSuggestions/FollowSuggestions";
import { UserPlus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function MainSidebar() {
  const { open, setOpen } = useSidebar();
  const { theme } = useTheme();
  const { userLogin, setUserLogin } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const navigate = useNavigate();

  function handleLogout(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
    }
    setIsLoading(true);
    setOpen(false);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserLogin(null);
      setIsLoading(false);
      navigate("/login");
    }, 1000);
  }

  const links = [
    {
      label: "Home",
      href: "/home",
      icon: (
        <IconHome className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors" />
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <IconUserBolt className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors" />
      ),
    },
    {
      label: "Bookmarks",
      href: "/bookmarks",
      icon: (
        <IconBookmark className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors" />
      ),
    },
    {
      label: "Chats",
      href: "/chats",
      icon: (
        <IconMessageCircle className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors" />
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <IconSettings className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors" />
      ),
    },
    userLogin
      ? {
          label: "Logout",
          href: "/login",
          icon: (
            <IconArrowLeft className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors" />
          ),
          onClick: handleLogout,
        }
      : {
          label: "Login",
          href: "/login",
          icon: (
            <IconArrowLeft className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-[#083695] dark:text-white transition-colors rotate-180" />
          ),
          onClick: () => setOpen(false),
        },
  ];

  return (
    <>
      {isLoading && <Loader message="Logging out..." />}
      {/* ====== Mobile bottom tab bar (phones) — thumb-friendly nav ====== */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#083695]/10 dark:border-white/10 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl pb-safe"
      >
        <div className="grid grid-cols-6 gap-1 px-2 pt-1.5">
          {links.slice(0, 5).map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              onClick={link.onClick}
              aria-label={link.label}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors ${
                  isActive
                    ? "text-[#083695] dark:text-blue-400 bg-[#083695]/8 dark:bg-blue-400/10"
                    : "text-gray-500 dark:text-gray-400 hover:text-[#083695] dark:hover:text-white"
                }`
              }
            >
              {link.icon}
              <span className="leading-none">{link.label}</span>
            </NavLink>
          ))}
          {/* زر اقتراح الأصدقاء */}
          <button
            onClick={() => setShowMobileSuggestions(true)}
            aria-label="Who to follow"
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors text-[#2c53a4] dark:text-white hover:text-[#083695] dark:hover:text-white cursor-pointer"
          >
            <UserPlus className="h-6 w-6" />
            <span className="leading-none">Follow</span>
          </button>
        </div>
      </nav>

      {/* Mobile FollowSuggestions Sheet */}
      <AnimatePresence>
        {showMobileSuggestions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSuggestions(false)}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#0f172a] rounded-t-3xl shadow-2xl pb-safe max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-sm font-bold text-gray-800 dark:text-white">People you may know</span>
                <button
                  onClick={() => setShowMobileSuggestions(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <FollowSuggestions />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <SidebarBody className="justify-between gap-6 md:gap-10">
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <div className="hidden md:flex flex-col mb-3 shrink-0">
          <div
            className={
              open
                ? "flex items-center px-1 h-14"
                : "flex items-center justify-center h-14"
            }
          >
            {open ? (
              <img
                src={logo3}
                alt="Route logo"
                className="h-9 w-auto object-contain"
                style={{
                  filter:
                    theme === "dark" ? "brightness(0) invert(1)" : undefined,
                }}
              />
            ) : (
              <img
                src={theme === "dark" ? logo2 : logo4}
                alt="Route logo"
                className="h-12 w-12 object-contain"
              />
            )}
          </div>
          <div
            className={
              open
                ? "mt-2 h-px w-full bg-[#083695]/10 dark:bg-white/10"
                : "mt-2 mx-auto h-px w-8 bg-[#083695]/10 dark:bg-white/10"
            }
          />
        </div>

        <div className="md:hidden flex items-center gap-3 pb-4 border-b border-[#083695]/10 dark:border-white/10 mb-4">
          <img
            src={logo}
            alt="logo"
            className="h-8 w-8 rounded-full object-contain"
          />
          <span className="text-base font-bold text-[#083695] dark:text-white">
            SocialApp
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {links.map((link, idx) => (
            <div key={idx} onClick={() => setOpen(false)}>
              <SidebarLink
                link={link}
                className="hover:bg-[#083695]/10 dark:hover:bg-white/10 rounded-xl px-2 py-2 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* User avatar at bottom */}
      {userLogin && (
        <div onClick={() => setOpen(false)}>
          <SidebarLink
            className="hover:bg-[#083695]/10 dark:hover:bg-white/10 rounded-xl px-2 py-2 transition-colors"
            link={{
              label: userLogin?.name || "My Account",
              href: "/profile",
              icon: (
                <UserAvatar
                  photo={userLogin?.photo}
                  name={userLogin?.name}
                  className="h-7 w-7 shrink-0 text-xs border-0"
                />
              ),
            }}
          />
        </div>
      )}
    </SidebarBody>
    </>
  );
}
