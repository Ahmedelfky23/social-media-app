import { Sun, Moon, Menu } from 'lucide-react';
import logo from '../../assets/routebg.jpg';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../ui/sidebar';
import { Link } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import defaultAvatar from "../../assets/default.jpg";
import NotificationsMenu from "./NotificationsMenu";
import UserSearch from "./UserSearch";
import { UserAvatar } from "../PostCard/PostCard";
import FollowSuggestions from "#components/FollowSuggestions/FollowSuggestions";
import { UserPlus } from 'lucide-react';

export default function Navbar () {
  const { theme, toggleTheme } = useTheme();
  const { open, setOpen } = useSidebar();
  const { userLogin } = useContext(AuthContext);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    if (suggestionsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [suggestionsOpen]);

  return (
    <nav className="relative z-50 flex items-center justify-between gap-2 bg-[#f2f5fa]/90 dark:bg-[#0f172a]/85 backdrop-blur-xl px-2.5 sm:px-4 py-2 sm:py-3 mt-2.5 sm:mt-5 md:mt-8 rounded-2xl sm:rounded-3xl w-full sm:w-[94%] md:max-w-[90%] mx-auto shadow-sm dark:shadow-black/30 border border-[#083695]/10 dark:border-white/10 transition-colors duration-300">
      
      {/* 1. الجانب الأيسر: زر المنيو للشاشات الصغيرة + الشعار */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* زر فتح السايد بار على الموبايل */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-1.5 sm:p-2 rounded-xl text-[#083695] dark:text-white hover:bg-[#083695]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Menu size={22} />
        </button>

        <Link
          to="/home"
          className="relative z-20 flex items-center gap-2 py-1"
        >
          <img
            src={logo}
            alt="logo"
            className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 object-contain shrink-0 rounded-full"
          />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs sm:text-sm font-bold whitespace-pre text-[#083695] dark:text-white hidden sm:inline"
          >
            SocialApp
          </motion.span>
        </Link>
      </div>

      {/* 2. User search */}
      <UserSearch />

      {/* 3. الإجراءات وبروفايل المستخدم (Right Side) */}
      <div className="flex items-center gap-1 sm:gap-2.5 md:gap-4 shrink-0">
        
        {/* زر الدارك مود */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-1.5 sm:p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-[#083695] dark:hover:text-[#60a5fa] hover:bg-[#083695]/10 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-amber-400 sm:w-5 sm:h-5 transition-transform rotate-0" />
          ) : (
            <Moon size={18} className="text-[#083695] sm:w-5 sm:h-5 transition-transform rotate-0" />
          )}
        </button>

        {/* أيقونة الإشعارات */}
        <NotificationsMenu />

        {/* زر اقتراح الأصدقاء */}
        <div ref={suggestionsRef} className="relative hidden xl:block">
          <button
            onClick={() => setSuggestionsOpen(prev => !prev)}
            aria-label="People you may know"
            title="People you may know"
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 cursor-pointer ${
              suggestionsOpen
                ? "bg-[#083695]/15 dark:bg-blue-400/20 text-[#083695] dark:text-blue-400"
                : "text-gray-700 dark:text-gray-300 hover:text-[#083695] dark:hover:text-blue-400 hover:bg-[#083695]/10 dark:hover:bg-white/10"
            }`}
          >
            <UserPlus size={18} className="sm:w-5 sm:h-5 text-[#083695] dark:text-white" />
          </button>

          <AnimatePresence>
            {suggestionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-[320px] z-50 shadow-2xl shadow-black/20"
              >
                <FollowSuggestions />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* بروفايل المستخدم */}
        {userLogin ? (
        <Link
          to="/profile"
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-[#083695]/10 dark:hover:bg-white/10 p-1 sm:p-1.5 rounded-full transition-colors"
        >
          {/* صورة البروفايل */}
          <UserAvatar
            photo={userLogin?.photo}
            name={userLogin?.name}
            className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-xs border-2 border-white dark:border-gray-600"
          />
          {/* اسم المستخدم (يظهر على الشاشات الكبيرة فقط لتوفير المساحة) */}
          <div className="hidden lg:flex flex-col leading-none text-left">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{userLogin?.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{userLogin?.username || userLogin?.name?.toLowerCase().replace(/\s+/g, "") || "user"}
            </span>
          </div>
          
          {/* سهم القائمة المنسدلة */}
          {/* <ChevronDown size={14} className="text-gray-500 dark:text-gray-400 hidden sm:inline" /> */}
        </Link> ) :<>

        
        <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:bg-[#083695]/10 dark:hover:bg-white/10 p-1 sm:p-1.5 rounded-full transition-colors">
          {/* صورة البروفايل */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-gray-600 shrink-0">
            <img 
              src={defaultAvatar} 
              alt="User Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          {/* اسم المستخدم (يظهر على الشاشات الكبيرة فقط لتوفير المساحة) */}
          <div className="hidden lg:flex flex-col leading-none text-left">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">User</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">@username </span>
          </div>
          
          {/* سهم القائمة المنسدلة */}
          {/* <ChevronDown size={14} className="text-gray-500 dark:text-gray-400 hidden sm:inline" /> */}
        </div> 





        
        </>}
      </div> 
      

    </nav>
  );
}
