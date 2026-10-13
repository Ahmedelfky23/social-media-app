import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, LogIn, UserPlus, Sparkles, MessagesSquare, Share2, Users, Loader2 } from "lucide-react";
import logo from "../../assets/route.png";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
};

const features = [
  { icon: Share2, title: "Share moments", desc: "Post photos & thoughts instantly" },
  { icon: MessagesSquare, title: "Chat live", desc: "Message friends in real-time" },
  { icon: Users, title: "Belong", desc: "Discover people & stories" },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<"signup" | "login" | null>(null);

  function go(to: "/signup" | "/login", which: "signup" | "login") {
    if (pending) return;
    setPending(which);
    setTimeout(() => navigate(to), 900);
  }

  return (
    <>
      {/* Full-screen loading overlay - like Login/Signup */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#083695] flex flex-col items-center justify-center p-6 text-white"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
              src={logo}
              alt="logo"
              className="w-44 sm:w-56 max-w-full object-contain mb-6"
            />
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="mt-4 text-base sm:text-lg font-medium text-blue-100">
              {pending === "signup" ? "Taking you to create your account..." : "Taking you to login..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    <div className="min-h-screen lg:h-screen w-full font-sans bg-[#083695] flex flex-col lg:flex-row overflow-x-hidden">
      <Helmet>
        <title>Welcome to Route | Connect & Share</title>
      </Helmet>

      {/* Left Branding Panel - matches Login/Signup */}
      <div className="hidden lg:flex lg:w-[38%] xl:w-[36%] min-w-90 bg-[#083695] text-white px-10 xl:px-12 pt-12 pb-8 flex-col justify-between relative overflow-hidden shrink-0">
        {/* decorative glows to fill empty space */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-black/20 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#4a7fd4]/30 blur-[100px]" />

        <div className="relative mt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-semibold text-blue-50 mb-6">
            <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" /> Route Community
          </div>
          <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-black leading-[1.02] tracking-tight mb-5">Welcome</h1>
          <h3 className="text-xl xl:text-2xl 2xl:text-[1.7rem] font-light leading-relaxed text-blue-100 max-w-md">
            Please login or sign up to continue using our app
          </h3>
        </div>
        <div className="relative my-auto py-6 flex flex-col items-center justify-center gap-7">
          <img src={logo} alt="Route logo" className="w-72 xl:w-80 2xl:w-88 object-contain max-w-full drop-shadow-2xl scale-110" />
          <div className="flex items-center gap-8 text-blue-100">
            <div className="text-center">
              <p className="text-2xl xl:text-3xl font-black text-white">10K+</p>
              <p className="text-xs xl:text-sm text-blue-200">Members</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl xl:text-3xl font-black text-white">50K+</p>
              <p className="text-xs xl:text-sm text-blue-200">Posts shared</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl xl:text-3xl font-black text-white">24/7</p>
              <p className="text-xs xl:text-sm text-blue-200">Live chat</p>
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-2.5 text-sm text-blue-100/80 pb-2">
          <img src={logo} alt="Route" className="h-7 w-7 rounded-md object-cover" />
          <span>© {new Date().getFullYear()} Route Social App. All rights reserved. Created by Ahmed Elfky.</span>
        </div>
      </div>

      {/* Right Content Panel - matches Login/Signup */}
      <div className="flex-1 w-full min-h-screen lg:min-h-0 bg-white dark:bg-[#0f172a] relative z-10 lg:-ml-8 lg:rounded-l-[40px] shadow-2xl flex flex-col px-6 sm:px-10 lg:px-14 xl:px-16 py-6 overflow-y-auto transition-colors duration-300">
        <motion.header
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl mx-auto flex items-center justify-between py-3"
        >
          
          
         
        </motion.header>
        <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center py-10 text-center lg:text-left">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="inline-flex self-center lg:self-start items-center gap-2 rounded-full border border-[#083695]/15 bg-[#083695]/5 px-5 py-2 text-sm sm:text-base font-semibold text-[#083695] dark:bg-white/10 dark:text-blue-200 dark:border-white/10">
            <Sparkles size={17} /> Welcome to Route
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }} className="mt-6 text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-black leading-[1.05] sm:leading-[1.02] tracking-tight text-[#083695] dark:text-white wrap-break-word">
            Welcome to <span className="bg-linear-to-br from-[#083695] to-[#4a7fd4] bg-clip-text text-transparent">Route</span><br /><span className="text-gray-900 dark:text-gray-100">Share. Chat. Belong.</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ duration: 0.55, delay: 0.18 }} className="mt-5 max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg lg:text-xl xl:text-2xl font-medium leading-relaxed text-gray-500 dark:text-gray-400">
            Hello, friend — glad you are here. Post your moments, chat instantly and discover stories. Choose how to continue, your feed is waiting.
          </motion.p>
          <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.26 }} className="mt-8 flex flex-col sm:flex-row items-stretch justify-center lg:justify-start gap-3 sm:gap-4">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => go("/signup", "signup")}
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#083695] px-6 sm:px-10 min-h-14 lg:h-16 py-3.5 text-base sm:text-lg lg:text-xl font-bold text-white shadow-xl hover:bg-[#0a347e] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending === "signup" ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <UserPlus size={22} />
              )}
              {pending === "signup" ? "Loading..." : "Create account"}{" "}
              {pending === "signup" ? null : (
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => go("/login", "login")}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] px-6 sm:px-10 min-h-14 lg:h-16 py-3.5 text-base sm:text-lg lg:text-xl font-bold text-[#083695] dark:text-white hover:border-[#083695] hover:bg-[#083695]/5 dark:hover:bg-white/5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending === "login" ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <LogIn size={22} />
              )}
              {pending === "login" ? "Loading..." : "I have an account"}
            </button>
          </motion.div>
          <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.32 }} className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 text-left">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#083695] text-white mb-3.5">
                  <f.icon size={22} />
                </div>
                <p className="text-base lg:text-lg xl:text-xl font-bold text-gray-900 dark:text-white">{f.title}</p>
                <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </main>
       
      </div>
    </div>
    </>
  );
}