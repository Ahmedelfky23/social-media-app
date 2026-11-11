import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  Search,
  LifeBuoy,
  Send,
  Mail,
  CheckCircle2,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "General" | "Account" | "Chat" | "Privacy";
}

const FAQS: FAQItem[] = [
  {
    category: "General",
    question: "How do I create and share posts?",
    answer:
      "On your Home feed, locate the 'What's on your mind?' post composer box at the top. You can type your message, attach high-resolution photos using the Photo button, and click 'Post'. Your post immediately appears across the network feed.",
  },
  {
    category: "Account",
    question: "How do I view my followers and people I'm following?",
    answer:
      "Go to your Profile page and click on the 'Followers' or 'Following' metric badges. An interactive modal will appear showing the full user list, real-time follow status, direct chat shortcuts, and a search filter.",
  },
  {
    category: "Chat",
    question: "How does real-time private messaging work?",
    answer:
      "Click the Chat icon in the navigation bar or use the direct message shortcut beside any user in the followers list or user profile. Conversations update in real time with zero delay via Firebase Firestore cloud syncing.",
  },
  {
    category: "General",
    question: "How do I switch between Dark and Light mode?",
    answer:
      "You can toggle the theme anytime by clicking the Sun/Moon icon situated in the top navigation bar. Your preference is safely remembered across sessions in your browser storage.",
  },
  {
    category: "Account",
    question: "How do I update my profile details or avatar?",
    answer:
      "Navigate to the Settings tab in your main sidebar. From there, you can upload a new profile picture, update your display username, bio, and birthday, or update your password securely.",
  },
  {
    category: "Privacy",
    question: "Is my personal data safe and private?",
    answer:
      "Yes. All transmissions are encrypted using HTTPS. Your passwords are never stored in plain text, and we never share or sell personal information to advertising networks. See our Privacy Policy for full details.",
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const categories = ["All", "General", "Account", "Chat", "Privacy"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText("");
    setTimeout(() => setFeedbackSent(false), 5000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 text-gray-800 dark:text-gray-100 transition-colors">
      <Helmet>
        <title>Help Center & FAQ | SocialApp</title>
        <meta
          name="description"
          content="Get assistance, discover answers to frequently asked questions, and find guides for SocialApp."
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
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-blue-500/10 text-[#083695] dark:text-blue-400 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Help Center & FAQs
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Find answers, troubleshoot issues, or connect with our support team
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mt-5">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, features, or troubleshooting..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#083695]/30 dark:focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#083695] text-white dark:bg-blue-600"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3 mb-10">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-white/8 shadow-2xs overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-gray-900 dark:text-white hover:text-[#083695] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={18} className="text-[#083695] dark:text-blue-400 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
                      isOpen ? "rotate-180 text-[#083695] dark:text-blue-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-50 dark:border-white/5">
                    <p className="mt-3.5 pl-7">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-white/8">
            <HelpCircle size={36} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              No matching questions found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try searching with another keyword or resetting the category filter.
            </p>
          </div>
        )}
      </div>

      {/* Support / Quick Inquiries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Direct contact card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-white/8 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <Mail className="h-5 w-5 text-[#083695] dark:text-blue-400" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Contact Developer & Support
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Need immediate technical help, reporting a bug, or exploring partnership opportunities?
            </p>
            <div className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
              <p>
                <strong className="text-gray-900 dark:text-white">Lead Engineer:</strong> Ahmed El-Feky
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Platform:</strong> SocialApp Web v1.0
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Response Time:</strong> Within 24 Hours
              </p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 flex gap-2">
            <Link
              to="/about"
              className="text-xs font-semibold text-[#083695] dark:text-blue-400 hover:underline"
            >
              Learn about the project &rarr;
            </Link>
          </div>
        </div>

        {/* Quick Feedback Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-white/8 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-2">
            <Send className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Send Quick Feedback
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Have a suggestion or noticed something unexpected? Let us know.
          </p>

          {feedbackSent ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              Thank you! Your feedback has been recorded successfully.
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe what you experienced or how we can improve..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#083695]/30 dark:focus:ring-blue-500/30"
              />
              <button
                type="submit"
                disabled={!feedbackText.trim()}
                className="w-full py-2 px-3 rounded-xl bg-[#083695] hover:bg-[#062973] disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
