import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Eye,
  Globe,
  Heart,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext, fetchMyProfile, type User } from "../../context/AuthContext";
import { Input } from "#components/ui/input";
import { Field, FieldLabel, FieldDescription } from "#components/ui/field";
import { toast } from "#components/ui/toast";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Helmet } from "react-helmet";
import { useQueryClient } from "@tanstack/react-query";

type TabId = "account" | "appearance" | "notifications" | "privacy";

export function Setting() {
  const { theme, setTheme } = useTheme();
  const { userLogin, setUserLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [active, setActive] = useState<TabId>("account");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: userLogin?.name || "",
    username: userLogin?.username || "",
    email: userLogin?.email || "",
    bio: (userLogin as { bio?: string })?.bio || "",
  });

  useEffect(() => {
    if (userLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: userLogin.name || "",
        username: userLogin.username || "",
        email: userLogin.email || "",
        bio: (userLogin as { bio?: string })?.bio || "",
      });
    }
  }, [userLogin]);

  const [notif, setNotif] = useState({
    email: true,
    push: true,
    comments: true,
    likes: false,
    mentions: true,
  });

  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    showActivity: true,
    showEmail: false,
  });

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: "Account", icon: <UserRound className="h-5 w-5" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="h-5 w-5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { id: "privacy", label: "Privacy", icon: <ShieldCheck className="h-5 w-5" /> },
  ];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview immediately in UI
    const url = URL.createObjectURL(file);
    setUserLogin((prev) => (prev ? { ...prev, photo: url } : prev));
    // Upload to server
    const formData = new FormData();
    formData.append("photo", file);
    const token = localStorage.getItem("token") || "";
    axios
      .put("https://route-posts.routemisr.com/users/upload-photo", formData, {
        headers: { token, Authorization: `Bearer ${token}` },
      })
      .then(() => {
        return fetchMyProfile();
      })
      .then((freshProfile) => {
        if (freshProfile) {
          setUserLogin((prev) => ({ ...prev, ...freshProfile }));
          queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        }
        toast.add({
          title: "Photo updated",
          description: "Your profile picture has been updated.",
          type: "success",
        });
      })
      .catch(() => {
        toast.add({
          title: "Upload failed",
          description: "Could not save photo to server. Please try again.",
          type: "error",
        });
      });
  }

  function handleSave() {
    setSaving(true);
    setUserLogin((prev) => (prev ? { ...prev, ...form } : prev));
    queryClient.setQueryData(["my-profile"], (old: User | null | undefined) =>
      old ? { ...old, ...form } : { ...form },
    );
    setSaving(false);
    toast.add({
      title: "Changes saved",
      description: "Your account details were updated successfully.",
      type: "success",
    });
  }

  function handleLogout() {
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUserLogin(null);
      navigate("/login");
    }, 600);
  }

  return (
    <div className="w-full text-[#083695] dark:text-white transition-colors duration-300">
      <Helmet>
        <title>Settings | SocialApp</title>
        <meta
          name="description"
          content="Manage your SocialApp profile, appearance, notifications, and privacy preferences."
        />
      </Helmet>
      <div className="w-full sm:w-[92%] mx-auto flex flex-col gap-4">
        {/* ====== Header ====== */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#083695] dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account, appearance, and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* ====== Sidebar nav ====== */}
          <aside className="lg:w-60 shrink-0">
            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto scroll-x lg:overflow-visible bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-white/8 p-2 shadow-sm transition-colors">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    active === tab.id
                      ? "bg-[#083695] text-white shadow-sm dark:bg-[#2563eb]"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-[#083695] dark:hover:text-white"
                  }`}
                >
                  <span
                    className={
                      active === tab.id
                        ? "text-white"
                        : "text-[#083695] dark:text-blue-400"
                    }
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                  <ChevronRight className="ml-auto h-4 w-4 hidden lg:block opacity-50" />
                </button>
              ))}
            </nav>
          </aside>

          {/* ====== Content ====== */}
          <div className="flex-1 min-w-0">
            {/* ---- Account ---- */}
            {active === "account" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 p-5 sm:p-6 transition-colors">
                  <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-100 dark:border-white/8">
                    <div className="relative">
                      <UserAvatar
                        photo={userLogin?.photo}
                        name={userLogin?.name}
                        className="h-16 w-16 ring-4 ring-[#083695]/10 dark:ring-white/10 border-0"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        aria-label="Upload photo"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#083695] dark:bg-blue-600 text-white flex items-center justify-center ring-2 ring-white dark:ring-[#0f172a] hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Camera size={12} />
                      </button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                        {userLogin?.name || "User"}
                      </h2>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        @{userLogin?.username || "username"}
                      </p>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="text-xs text-[#083695] dark:text-blue-400 hover:underline mt-1 font-medium cursor-pointer"
                      >
                        Change photo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel className="text-[#083695] dark:text-blue-200">
                        Full name
                      </FieldLabel>
                      <Input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="h-11 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                      />
                    </Field>

                    <Field>
                      <FieldLabel className="text-[#083695] dark:text-blue-200">
                        Username
                      </FieldLabel>
                      <div className="relative">
                        <AtSign
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          name="username"
                          value={form.username}
                          onChange={handleChange}
                          placeholder="username"
                          className="h-11 pl-9 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                        />
                      </div>
                    </Field>

                    <Field className="sm:col-span-2">
                      <FieldLabel className="text-[#083695] dark:text-blue-200">
                        Email
                      </FieldLabel>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="h-11 pl-9 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                        />
                      </div>
                      <FieldDescription>
                        This email is used for account recovery.
                      </FieldDescription>
                    </Field>

                    <Field className="sm:col-span-2">
                      <FieldLabel className="text-[#083695] dark:text-blue-200">
                        Bio
                      </FieldLabel>
                      <Input
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        placeholder="Tell people a little about yourself"
                        className="h-11 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end mt-5 pt-5 border-t border-gray-100 dark:border-white/8">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-[#083695] hover:bg-[#092f70] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Appearance ---- */}
            {active === "appearance" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 p-5 sm:p-6 transition-colors">
                  <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                    Theme
                  </h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
                    Choose how SocialApp looks to you.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                        theme === "light"
                          ? "border-[#083695] bg-[#083695]/5 dark:border-[#60a5fa] dark:bg-blue-400/10"
                          : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                        <Sun className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          Light
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Bright and clean
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${
                        theme === "dark"
                          ? "border-[#083695] bg-[#083695]/5 dark:border-[#60a5fa] dark:bg-blue-400/10"
                          : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-[#1e293b] text-blue-300 flex items-center justify-center shrink-0">
                        <Moon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          Dark
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Easy on the eyes
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 p-5 sm:p-6 flex items-center gap-4 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-[#083695]/10 dark:bg-white/10 flex items-center justify-center text-[#083695] dark:text-blue-400 shrink-0">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      Match system appearance
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Automatically switch based on your device settings.
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                </div>
              </div>
            )}

            {/* ---- Notifications ---- */}
            {active === "notifications" && (
              <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 p-5 sm:p-6 transition-colors">
                <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                  Notifications
                </h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                  Choose what you want to be notified about.
                </p>

                <div className="divide-y divide-gray-100 dark:divide-white/8">
                  <Toggle
                    icon={<Mail className="h-5 w-5" />}
                    title="Email notifications"
                    desc="Get a summary of activity in your inbox."
                    checked={notif.email}
                    onChange={(v) => setNotif((p) => ({ ...p, email: v }))}
                  />
                  <Toggle
                    icon={<Bell className="h-5 w-5" />}
                    title="Push notifications"
                    desc="Receive alerts on your devices."
                    checked={notif.push}
                    onChange={(v) => setNotif((p) => ({ ...p, push: v }))}
                  />
                  <Toggle
                    icon={<MessageCircle className="h-5 w-5" />}
                    title="Comments"
                    desc="When someone comments on your post."
                    checked={notif.comments}
                    onChange={(v) => setNotif((p) => ({ ...p, comments: v }))}
                  />
                  <Toggle
                    icon={<Heart className="h-5 w-5" />}
                    title="Likes"
                    desc="When someone likes your post."
                    checked={notif.likes}
                    onChange={(v) => setNotif((p) => ({ ...p, likes: v }))}
                  />
                </div>
              </div>
            )}
            {/* ---- Privacy ---- */}
            {active === "privacy" && (
              <div className="flex flex-col gap-4">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 p-5 sm:p-6 transition-colors">
                  <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                    Privacy
                  </h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                    Control who can see your content.
                  </p>

                  <div className="divide-y divide-gray-100 dark:divide-white/8">
                    <Toggle
                      icon={<Lock className="h-5 w-5" />}
                      title="Private account"
                      desc="Only approved followers can see your posts."
                      checked={privacy.privateAccount}
                      onChange={(v) =>
                        setPrivacy((p) => ({ ...p, privateAccount: v }))
                      }
                    />
                    <Toggle
                      icon={<Eye className="h-5 w-5" />}
                      title="Show activity status"
                      desc="Let others see when you were last active."
                      checked={privacy.showActivity}
                      onChange={(v) =>
                        setPrivacy((p) => ({ ...p, showActivity: v }))
                      }
                    />
                    <Toggle
                      icon={<Globe className="h-5 w-5" />}
                      title="Show email on profile"
                      desc="Display your email address publicly."
                      checked={privacy.showEmail}
                      onChange={(v) =>
                        setPrivacy((p) => ({ ...p, showEmail: v }))
                      }
                    />
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-red-100 dark:border-red-500/20 p-5 sm:p-6 transition-colors">
                  <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
                    Danger zone
                  </h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                    These actions are irreversible, proceed with care.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-[#083695] hover:border-[#083695]/40 dark:hover:text-white text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                    <button
                      onClick={() =>
                        toast.add({
                          title: "Delete account",
                          description:
                            "This feature is not available in the demo yet.",
                          type: "info",
                        })
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-10 w-10 rounded-xl bg-[#083695]/10 dark:bg-white/10 flex items-center justify-center text-[#083695] dark:text-blue-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white">
          {title}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
          checked
            ? "bg-[#083695] dark:bg-[#2563eb]"
            : "bg-gray-200 dark:bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

