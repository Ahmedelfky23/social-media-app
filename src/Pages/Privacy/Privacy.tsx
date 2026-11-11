import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  EyeOff,
  Database,
  KeyRound,
  FileCheck2,
  Mail,
} from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      icon: <Database className="h-5 w-5 text-blue-500" />,
      title: "1. Information We Collect",
      content:
        "When you register and interact with SocialApp, we collect information you directly provide: your name, email address, password hash, profile avatar, bio, and birthday. We also store the posts, images, comments, likes, and follows you create on the network, along with real-time direct chat messages exchanged between users.",
    },
    {
      icon: <EyeOff className="h-5 w-5 text-emerald-500" />,
      title: "2. How We Use Your Data",
      content:
        "We utilize your data solely to operate, improve, and protect our platform. This includes rendering your personalized feed, powering live peer-to-peer chats via Firestore, sending notification alerts, enforcing security verifications, and preventing unauthorized spam or malicious activity.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-purple-500" />,
      title: "3. Third-Party Integrations & Storage",
      content:
        "To deliver high-speed media and real-time experiences, SocialApp integrates trusted enterprise third parties: Cloudinary for secure media & image hosting, Firebase (Google Cloud) for real-time messaging databases, and Google Identity Services for optional OAuth sign-in. We do not sell your personal data to data brokers or advertising networks.",
    },
    {
      icon: <KeyRound className="h-5 w-5 text-amber-500" />,
      title: "4. Cookies & Local Browser Storage",
      content:
        "We use browser LocalStorage and secure cookies strictly for session authentication (JWT token caching) and user interface preferences, such as your dark/light theme choice and collapsed sidebar states. We do not deploy invasive third-party cross-site tracking cookies.",
    },
    {
      icon: <Lock className="h-5 w-5 text-rose-500" />,
      title: "5. Data Security & Encryption",
      content:
        "We employ industry-standard transport layer security (HTTPS/TLS) across all client-server communications. Passwords are cryptographically hashed using salted bcrypt before database persistence, and tokens are signed with strict expiry intervals.",
    },
    {
      icon: <FileCheck2 className="h-5 w-5 text-indigo-500" />,
      title: "6. Your Rights & Data Control",
      content:
        "You hold full ownership and control over your personal presence. You can modify your profile details, edit or delete your posts and comments at any time, toggle notification preferences, or request full account termination through your settings dashboard.",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 text-gray-800 dark:text-gray-100 transition-colors">
      <Helmet>
        <title>Privacy Policy | SocialApp</title>
        <meta
          name="description"
          content="Learn how SocialApp collects, safeguards, and respects your personal data and privacy."
        />
      </Helmet>

      {/* Back button */}
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-4 sm:mb-6 group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to feed
      </Link>

      {/* Hero Header */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 dark:border-white/8 shadow-xs mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last updated: November 2026 • Effective immediately
            </p>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4 mt-2">
          Your privacy and digital safety are core pillars of SocialApp. This Privacy Policy details the data we process, why we need it, and how we protect your rights and sensitive information.
        </p>
      </div>

      {/* Core Privacy Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-gray-100 dark:border-white/8 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            Zero Data Selling
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            We never sell or rent your personal information to third-party advertisers.
          </p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-gray-100 dark:border-white/8 shadow-2xs">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            End-To-End Integrity
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Encrypted transit for all API calls and secure Firestore database rules.
          </p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-gray-100 dark:border-white/8 shadow-2xs">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            Full Data Rights
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            You retain absolute ownership and control over your posted content and account.
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-4 mb-10">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-white/8 shadow-2xs"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 shrink-0">
                {section.icon}
              </div>
              <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                {section.title}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed pl-1 sm:pl-11">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Contact & Inquiries */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/60 dark:border-white/10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#083695]/10 dark:bg-blue-400/10 text-[#083695] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
              Have privacy questions or requests?
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Our engineering & compliance team is available to assist you.
            </p>
          </div>
        </div>
        <Link
          to="/help"
          className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#083695] hover:bg-[#062973] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors shadow-xs"
        >
          Contact Help Center
        </Link>
      </div>
    </div>
  );
}

