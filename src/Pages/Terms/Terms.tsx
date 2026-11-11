import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By creating an account, browsing, or utilizing the services provided by SocialApp, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from accessing or using the platform.",
    },
    {
      title: "2. User Registration & Account Security",
      content:
        "You agree to provide accurate, current, and complete registration information. You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. SocialApp reserves the right to suspend or terminate accounts that violate platform integrity.",
    },
    {
      title: "3. User Conduct & Community Guidelines",
      content:
        "SocialApp thrives on positive, constructive interaction. You agree not to post content that is illegal, defamatory, harassing, sexually explicit, hateful, or infringing on intellectual property rights. Spamming, impersonation, automated scraping, or attempts to disrupt system security are strictly prohibited.",
    },
    {
      title: "4. User Content & Intellectual Property",
      content:
        "You retain all ownership rights to the photos, text, and media you submit to SocialApp. By publishing content, you grant SocialApp a non-exclusive, worldwide, royalty-free license to display, distribute, and format your content strictly within the platform's social network features.",
    },
    {
      title: "5. Real-Time Chat & Communications",
      content:
        "Our direct messaging service operates through secure, cloud-synchronized databases. Users are expected to maintain courteous and lawful communication. We do not monitor private messages routinely, but we act promptly upon reported abuse or harassment.",
    },
    {
      title: "6. Limitation of Liability & Disclaimers",
      content:
        "SocialApp is provided on an 'as-is' and 'as-available' basis without warranties of any kind. We do not guarantee uninterrupted or error-free service and are not liable for any indirect, punitive, or consequential damages resulting from your use of the platform.",
    },
    {
      title: "7. Modifications to Terms",
      content:
        "We reserve the right to revise or replace these Terms at any time. Changes become effective immediately upon posting. Your continued use of SocialApp following any revisions indicates your acceptance of the updated terms.",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 text-gray-800 dark:text-gray-100 transition-colors">
      <Helmet>
        <title>Terms of Service | SocialApp</title>
        <meta
          name="description"
          content="Review the terms, guidelines, and conditions for using the SocialApp social media network."
        />
      </Helmet>

      {/* Navigation back */}
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-4 sm:mb-6 group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to feed
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 dark:border-white/8 shadow-xs mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#083695]/10 dark:bg-blue-400/15 text-[#083695] dark:text-blue-400 flex items-center justify-center">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              Effective Date: November 2026 · Version 2.0
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Please read these terms carefully before using SocialApp. By accessing or using our platform, you agree to comply with all guidelines outlined below.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4 mb-10">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-white/8 shadow-2xs"
          >
            <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">
              {section.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-gray-100 dark:border-white/8">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © 2026 SocialApp. Developed by Ahmed El-Feky. All rights reserved.
        </p>
      </div>
    </div>
  );
}

