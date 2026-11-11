import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Users,
  Code2,
  Heart,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import logo from "../../assets/routebg.jpg";

export default function About() {
  const highlights = [
    {
      icon: <MessageCircle className="h-6 w-6 text-[#083695] dark:text-blue-400" />,
      title: "Real-Time Direct Messaging",
      description:
        "Instant, zero-latency 1-on-1 private messaging backed by Firebase Firestore with delivery receipts and multi-tab isolation.",
    },
    {
      icon: <Users className="h-6 w-6 text-emerald-500" />,
      title: "Social Graph & Community",
      description:
        "Connect with creators, friends, and colleagues. Follow accounts, explore mutual connections, and stay updated with live feeds.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-purple-500" />,
      title: "Enterprise-Grade Security",
      description:
        "Protected by industry-standard JWT authentication, Google OAuth 2.0 integration, and strict client-side Zod validations.",
    },
    {
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      title: "Next-Gen UI / UX",
      description:
        "Designed with Tailwind CSS v4, smooth Motion spring animations, and native dark/light mode that respects your preference.",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 text-gray-800 dark:text-gray-100 transition-colors">
      <Helmet>
        <title>About Us | SocialApp</title>
        <meta
          name="description"
          content="Learn about SocialApp, our mission, cutting-edge technology, and passionate development team."
        />
      </Helmet>

      {/* Navigation back */}
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to feed
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-10 border border-gray-100 dark:border-white/8 shadow-xs mb-6 sm:mb-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <img
            src={logo}
            alt="SocialApp Logo"
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-[#083695]/15 dark:ring-white/10 shadow-md shrink-0"
          />
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#083695]/10 text-[#083695] dark:bg-blue-400/15 dark:text-blue-300 mb-2">
              <Sparkles size={13} /> The Future of Social Networking
            </span>
            <h1 className="text-xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              About SocialApp
            </h1>
            <p className="mt-2 text-xs sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
              SocialApp is a high-performance, real-time social networking platform engineered to connect people seamlessly through rich media feeds, threaded discussions, and live conversations.
            </p>
          </div>
        </div>
      </div>

      {/* Features Matrix */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Code2 size={22} className="text-[#083695] dark:text-blue-400" />
          Engineered for Performance & Speed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-gray-100 dark:border-white/8 shadow-2xs hover:shadow-sm hover:border-gray-200 dark:hover:border-white/15 transition-all duration-200"
            >
              <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Creator & Tech Details */}
      <div className="bg-linear-to-br from-[#083695]/5 to-[#4a7fd4]/10 dark:from-[#083695]/15 dark:to-blue-950/20 border border-[#083695]/15 dark:border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Heart size={20} className="text-rose-500 fill-rose-500" />
          Created with Passion
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          Crafted and maintained by <span className="font-semibold text-[#083695] dark:text-blue-400">Ahmed El-Feky</span> as a full-featured showcase of modern frontend engineering, utilizing React 19, TypeScript, Tailwind CSS v4, TanStack Query v5, and Firebase Firestore.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {["React 19", "TypeScript", "Tailwind CSS v4", "Firebase Firestore", "TanStack Query v5", "Vite 8"].map(
            (tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white dark:bg-[#0f172a] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-2xs"
              >
                <CheckCircle2 size={12} className="text-emerald-500" />
                {tech}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-4 border-t border-gray-100 dark:border-white/8">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © 2026 SocialApp. Developed by Ahmed El-Feky. All rights reserved.
        </p>
      </div>
    </div>
  );
}

