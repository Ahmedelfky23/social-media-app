import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  CalendarDays,
  FileText,
  Heart,
  ImagePlus,
  KeyRound,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
  Upload,
  Users,
  UserCheck,
  UserMinus,
  Check,
  X,
} from "lucide-react";
import type { PostType } from "../../types/Post.type";
import PostCard, { UserAvatar } from "../../components/PostCard/PostCard";
import { FollowButton } from "#components/FollowButton/FollowButton";
import { AuthContext, fetchMyProfile } from "../../context/AuthContext";
import type { User } from "../../context/AuthContext";
import ChangePassword from "#components/ChangePassword/ChangePassword";
import { toast } from "#components/ui/toast";
import CreatePost from "#components/CreatePost/CreatePost";
import { Helmet } from "react-helmet";

interface OtherUserProfile {
  user: User | null;
  isFollowing: boolean;
}

async function getUserProfile(userId: string): Promise<OtherUserProfile> {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `https://route-posts.routemisr.com/users/${userId}/profile`,
    {
      headers: {
        token: token || "",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return {
    user: response.data?.data?.user ?? null,
    isFollowing: response.data?.data?.isFollowing ?? false,
  };
}

async function getUserPosts(userId?: string): Promise<PostType[]> {
  if (!userId) return [];
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `https://route-posts.routemisr.com/users/${userId}/posts`,
    {
      headers: {
        token: token || "",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data?.data?.posts ?? response.data?.posts ?? [];
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { userLogin, setUserLogin } = useContext(AuthContext);
  const [copied, setCopied] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !userId || userId === userLogin?._id;
  const targetUserId = isOwnProfile ? userLogin?._id : userId;

  // ── Fetch fresh profile data from API (own profile) ───────────────────
  const { data: myProfileData } = useQuery<User | null>({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
    enabled: isOwnProfile,
    staleTime: 1000 * 60 * 5, 
    retry: 2,
  });

  // ── Fetch other user profile data ) ───────────────
  const {
    data: otherProfile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery<OtherUserProfile>({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfile(userId as string),
    enabled: Boolean(userId && !isOwnProfile),
    retry: 2,
  });

  const otherUserProfile = otherProfile?.user ?? null;
  const isFollowing = otherProfile?.isFollowing ?? false;

  const [liveIsFollowing, setLiveIsFollowing] = useState<boolean | null>(null);
  const currentIsFollowing = liveIsFollowing !== null ? liveIsFollowing : isFollowing;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveIsFollowing(null);
  }, [userId]);

  const myId = userLogin?._id;
  const targetFollowingList =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((otherUserProfile as any)?.following as Array<{ _id?: string } | string> | undefined) || [];
  const theyFollowMe = Boolean(
    myId &&
      targetFollowingList.some((u) => (typeof u === "string" ? u === myId : u._id === myId)),
  );

  useEffect(() => {
    if (isOwnProfile && myProfileData && myProfileData._id) {
      setUserLogin((prev) => ({ ...prev, ...myProfileData }));
    }
  }, [isOwnProfile, myProfileData, setUserLogin]);

  const profile: User = isOwnProfile
    ? { ...myProfileData, ...userLogin }
    : (otherUserProfile || {});

  const currentUserId = isOwnProfile ? (profile._id || userLogin?._id) : targetUserId;

  const [followersOverride, setFollowersOverride] = useState<{
    id: string;
    count: number;
  } | null>(null);
  const followersCount =
    followersOverride && followersOverride.id === targetUserId
      ? followersOverride.count
      : (profile.followersCount ?? 0);

  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery<PostType[]>({
    queryKey: ["user-posts", currentUserId],
    queryFn: () => getUserPosts(currentUserId),
    enabled: Boolean(currentUserId),
    retry: 2,
  });

  const isLoading = isOwnProfile ? isPostsLoading : (isProfileLoading || isPostsLoading);

  const totalLikes = userPosts.reduce(
    (sum, post) => sum + (post.likesCount ?? post.likes?.length ?? 0),
    0,
  );
  const totalComments = userPosts.reduce(
    (sum, post) => sum + (post.commentsCount ?? 0),
    0,
  );

  const userInitial = profile.name?.charAt(0).toUpperCase() || "U";

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.add({
        title: "Link copied",
        description: "Your profile link was copied to the clipboard.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Could not copy",
        description: "Something went wrong while copying the link.",
        type: "error",
      });
    }
  }

  function openPhotoModal() {
    setSelectedPhoto(null);
    setPhotoModalOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.add({
        title: "Invalid file",
        description: "Please choose an image file.",
        type: "error",
      });
      return;
    }
    setSelectedPhoto(URL.createObjectURL(file));
    setSelectedPhotoFile(file);
  }

  async function handleSavePhoto() {
    if (!selectedPhotoFile) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedPhotoFile);
      const token = localStorage.getItem("token") || "";
      await axios.put(
        "https://route-posts.routemisr.com/users/upload-photo",
        formData,
        {
          headers: {
            token,
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const freshProfile = await fetchMyProfile();
      if (freshProfile) {
        setUserLogin((prev) => ({ ...prev, ...freshProfile }));
      } else if (selectedPhoto) {
        setUserLogin((prev) => (prev ? { ...prev, photo: selectedPhoto } : prev));
      }
      setPhotoModalOpen(false);
      toast.add({
        title: "Photo updated",
        description: "Your profile picture was changed successfully.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Upload failed",
        description: "Could not upload photo. Please try again.",
        type: "error",
      });
    } finally {
      setUploadingPhoto(false);
      setSelectedPhoto(null);
      setSelectedPhotoFile(null);
    }
  }

  function handleRemovePhoto() {
    setUserLogin((prev) => (prev ? { ...prev, photo: "" } : prev));
    setPhotoModalOpen(false);
    toast.add({
      title: "Photo removed",
      description: "Your profile picture was removed.",
      type: "info",
    });
  }

  return (
    <div className="w-full text-[#083695] dark:text-white transition-colors duration-300 pb-8">
      <Helmet>
        <title>
          {profile.name
            ? `${profile.name} (@${profile.username || "profile"}) | SocialApp`
            : "Profile | SocialApp"}
        </title>
        <meta
          name="description"
          content={`View ${profile.name || "user"}'s profile, posts, and activity on SocialApp.`}
        />
      </Helmet>

      {isLoading && !profile.name ? (
        <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto flex flex-col items-center justify-center py-28 gap-3">
          <Loader2 className="animate-spin h-9 w-9 text-[#083695] dark:text-blue-400" />
          <span className="text-sm text-gray-400">Loading profile...</span>
        </div>
      ) : isProfileError || (!isOwnProfile && !otherUserProfile && !isProfileLoading) ? (
        <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto flex flex-col items-center justify-center py-16 sm:py-24 px-4 sm:px-6 bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-100 dark:border-white/8 shadow-sm text-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            This profile does not exist or may have been deleted.
          </p>
          <Link
            to="/home"
            className="rounded-full bg-[#083695] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#092f70] transition-colors"
          >
            Back to feed
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* ====== Profile header card ====== */}
          <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden transition-colors duration-300">
            {/* Cover banner */}
            <div className="relative h-32 sm:h-52 md:h-56 bg-linear-to-r from-[#072458] via-[#083695] to-[#1e5bbd] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-300/20 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 right-4 h-48 w-48 rounded-full bg-blue-300/15 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-black/25 to-transparent pointer-events-none" />

              {/* Share button */}
              <button
                onClick={handleShare}
                aria-label="Share profile"
                className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              >
                <Share2 size={14} />
                {copied ? "Link Copied!" : "Share"}
              </button>
            </div>

            <div className="px-4 sm:px-8 pb-5 sm:pb-7">
              {/* avatar + actions */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 -mt-12 sm:-mt-20 mb-4 sm:mb-5">
                <div className="relative inline-block self-start">
                  <UserAvatar
                    photo={profile.photo}
                    name={profile.name}
                    className="h-20 w-20 sm:h-36 sm:w-36 ring-4 ring-white dark:ring-[#0f172a] shadow-xl border-0"
                  />
                  {isOwnProfile && (
                    <button
                      onClick={openPhotoModal}
                      aria-label="Change profile picture"
                      title="Change profile picture"
                      className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-[#083695] dark:bg-blue-600 hover:bg-[#082b68] dark:hover:bg-blue-500 text-white flex items-center justify-center ring-3 ring-white dark:ring-[#0f172a] shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 sm:mb-2">
                  {isOwnProfile ? (
                    <>
                      <Link
                        to="/settings"
                        className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#083695] hover:bg-[#083695]/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 min-h-10 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Pencil size={15} />
                        Edit profile
                      </Link>
                      <button
                        onClick={() => setPasswordModalOpen(true)}
                        className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-[#083695] hover:border-[#083695]/40 hover:bg-[#083695]/5 dark:hover:bg-white/5 dark:hover:text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 min-h-10 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <KeyRound size={15} />
                        Change password
                      </button>
                    </>
                  ) : (
                    <>
                      <FollowButton
                        userId={targetUserId as string}
                        initialIsFollowing={currentIsFollowing}
                        followBackText={theyFollowMe ? "Follow back" : "Follow"}
                        onChange={(following, count) => {
                          setLiveIsFollowing(following);
                          setFollowersOverride({ id: targetUserId as string, count });
                        }}
                      />
                      <Link
                        to="/home"
                        className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-[#083695] hover:border-[#083695]/40 hover:bg-[#083695]/5 dark:hover:bg-white/5 dark:hover:text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 min-h-10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Back to feed
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* name + handle */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white wrap-break-word">
                    {profile.name || "User"}
                  </h1>

                  {/* Self badge */}
                  {isOwnProfile && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#083695] bg-[#083695]/10 dark:bg-blue-400/15 dark:text-blue-300 rounded-full px-2.5 py-0.5 border border-[#083695]/15 dark:border-blue-400/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#083695] dark:bg-blue-400" />
                      You
                    </span>
                  )}

                  {/* Relationship state badge when viewing someone else */}
                  {!isOwnProfile && (
                    <>
                      {currentIsFollowing && theyFollowMe && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                          <Users size={13} className="shrink-0" />
                          Follow each other
                        </span>
                      )}
                      {!currentIsFollowing && theyFollowMe && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-xs">
                          <UserCheck size={13} className="shrink-0" />
                          Follows you
                        </span>
                      )}
                      {currentIsFollowing && !theyFollowMe && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-[#083695] dark:text-blue-300 border border-blue-500/20 shadow-xs">
                          <Check size={13} className="shrink-0" />
                          Following
                        </span>
                      )}
                      {!currentIsFollowing && !theyFollowMe && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-white/6 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 shadow-xs">
                          <UserMinus size={13} className="shrink-0" />
                          Not following each other
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    @{profile.username || profile.name?.toLowerCase().replace(/\s+/g, "") || "username"}
                  </p>
                  {!isOwnProfile && currentIsFollowing && !theyFollowMe && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-medium">
                      Not following you
                    </span>
                  )}
                </div>

                {/* Followers & Following counts */}
                <div className="flex items-center gap-4 pt-1 text-xs">
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {((profile as any).followingCount ?? (profile as any).following?.length ?? 0)}{" "}
                    <span className="font-normal text-gray-400 dark:text-gray-500">Following</span>
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {followersCount}{" "}
                    <span className="font-normal text-gray-400 dark:text-gray-500">Followers</span>
                  </span>
                </div>

                {/* bio (only if the user has one) */}
                {profile.bio && (
                  <p className="max-w-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 pt-1 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                )}

                {/* meta info */}
                <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-2 pt-1 text-xs text-gray-500 dark:text-gray-400">
                  {profile.email && (
                    <span className="flex items-center gap-1.5 min-w-0 max-w-full">
                      <Mail size={14} className="text-[#083695] dark:text-blue-400 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CalendarDays
                      size={14}
                      className="text-[#083695] dark:text-blue-400 shrink-0"
                    />
                    Joined{" "}
                    {profile.createdAt
                      ? new Date(profile.createdAt as string).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })
                      : new Date().toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })}
                  </span>
                </div>
              </div>

              {/* stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100 dark:border-white/8">
                <div className="group bg-slate-50/80 dark:bg-white/4 hover:bg-[#083695]/5 dark:hover:bg-white/7 border border-gray-100 dark:border-white/8 rounded-2xl p-3 sm:p-4 transition-all duration-200 flex items-center gap-3 sm:gap-3.5">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#083695]/10 dark:bg-blue-400/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText size={18} className="text-[#083695] dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-tight">
                      {isLoading ? "—" : userPosts.length}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Posts
                    </p>
                  </div>
                </div>

                <div className="group bg-slate-50/80 dark:bg-white/4 hover:bg-emerald-500/5 dark:hover:bg-white/7 border border-gray-100 dark:border-white/8 rounded-2xl p-3 sm:p-4 transition-all duration-200 flex items-center gap-3 sm:gap-3.5">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-tight">
                      {isLoading ? "—" : followersCount}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Followers
                    </p>
                  </div>
                </div>

                <div className="group bg-slate-50/80 dark:bg-white/4 hover:bg-rose-500/5 dark:hover:bg-white/7 border border-gray-100 dark:border-white/8 rounded-2xl p-3 sm:p-4 transition-all duration-200 flex items-center gap-3 sm:gap-3.5">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Heart size={18} className="text-rose-500 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-tight">
                      {isLoading ? "—" : totalLikes}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Likes
                    </p>
                  </div>
                </div>

                <div className="group bg-slate-50/80 dark:bg-white/4 hover:bg-sky-500/5 dark:hover:bg-white/7 border border-gray-100 dark:border-white/8 rounded-2xl p-3 sm:p-4 transition-all duration-200 flex items-center gap-3 sm:gap-3.5">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle
                      size={18}
                      className="text-sky-500 dark:text-sky-400"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white leading-tight">
                      {isLoading ? "—" : totalComments}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Comments
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====== Posts section ====== */}
          <div className="flex flex-col gap-4">
            {/* Create Post Box */}
            {isOwnProfile && <CreatePost />}

            {/* Section header */}
            <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto flex items-center justify-between px-1 pt-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isOwnProfile ? "My Posts" : `${profile.name || "User"}'s Posts`}
                </h2>
                {!isLoading && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#083695]/10 dark:bg-blue-400/15 text-[#083695] dark:text-blue-300">
                    {userPosts.length}
                  </span>
                )}
              </div>

              {isOwnProfile && (
                <Link
                  to="/bookmarks"
                  className="text-xs font-medium text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  Saved Posts →
                </Link>
              )}
            </div>

            {/* Post Feed */}
            {isLoading ? (
              <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin h-8 w-8 text-[#083695] dark:text-blue-400" />
                <span className="text-sm text-gray-400">Loading posts...</span>
              </div>
            ) : userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={userLogin?._id}
                />
              ))
            ) : (
              <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto flex flex-col items-center justify-center py-20 px-4 sm:px-6 gap-4 bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-100 dark:border-white/8 shadow-sm text-center">
                <div className="h-20 w-20 rounded-full bg-[#083695]/10 dark:bg-blue-400/15 flex items-center justify-center text-3xl font-bold text-[#083695] dark:text-blue-400">
                  {userInitial}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {isOwnProfile
                      ? "No posts published yet"
                      : `${profile.name || "This user"} hasn't published any posts yet`}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
                    {isOwnProfile
                      ? "What's on your mind? Share your first post above to see it here!"
                      : "Check back later to see new updates and posts from this user."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== Change photo modal ====== */}
      {photoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 pb-safe"
          onClick={() => setPhotoModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#0f172a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 sm:p-6 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Change profile photo
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Upload a new picture for your account.
                </p>
              </div>
              <button
                onClick={() => setPhotoModalOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* preview */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="h-28 w-28 rounded-full overflow-hidden bg-linear-to-br from-[#083695] to-[#4a7fd4] flex items-center justify-center text-white text-3xl font-bold ring-4 ring-[#083695]/10 dark:ring-white/10 shadow-lg">
                {selectedPhoto ? (
                  <img
                    src={selectedPhoto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile.photo ? (
                  <img
                    src={profile.photo}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitial
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-[#083695] hover:border-[#083695]/40 dark:hover:text-white text-sm font-medium px-4 py-2 transition-colors cursor-pointer"
              >
                <ImagePlus size={16} />
                Choose image
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRemovePhoto}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-300 dark:hover:text-red-400 text-sm font-medium px-4 py-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={!selectedPhotoFile || uploadingPhoto}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#083695] hover:bg-[#092f70] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingPhoto ? "Uploading..." : "Save photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Change password modal ====== */}
      <ChangePassword
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}
