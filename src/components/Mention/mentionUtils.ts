import type { QueryClient } from "@tanstack/react-query";
import type { ExtendedSearchUser } from "#components/Navbar/UserSearch";

const USER_CACHE_KEY = "app_known_users";

export interface MentionUser extends ExtendedSearchUser {
  isFollower?: boolean;
  isFollowing?: boolean;
  priorityScore?: number;
}

/**
 * Returns a deduplicated list of all known users across:
 * 1. LocalStorage cached users ("app_known_users")
 * 2. Currently logged in user ("user") and their followers/following
 * 3. Any users stored in React Query cache (suggestions, feed posts, search-pool)
 *
 * Automatically prioritizes followers and people you follow at the top!
 */
export function getAllKnownUsers(queryClient?: QueryClient): MentionUser[] {
  const userMap = new Map<string, MentionUser>();
  const followersSet = new Set<string>();
  const followingSet = new Set<string>();

  // Determine current logged-in user ID and follower/following sets
  let currentUserId: string | null = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      currentUserId = u._id || u.id;
      if (Array.isArray(u.followers)) {
        u.followers.forEach((f: unknown) => {
          const id = typeof f === "string" ? f : (f as { _id?: string })?._id;
          if (id) followersSet.add(id);
        });
      }
      if (Array.isArray(u.following)) {
        u.following.forEach((f: unknown) => {
          const id = typeof f === "string" ? f : (f as { _id?: string })?._id;
          if (id) followingSet.add(id);
        });
      }
    }
  } catch {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addUser = (raw: any, isExplicitFollower = false, isExplicitFollowing = false) => {
    if (!raw || typeof raw !== "object") return;
    const id = raw._id || raw.id;
    if (!id || typeof id !== "string") return;

    // Do not self-suggest
    if (currentUserId && id === currentUserId) return;

    const existing = userMap.get(id);
    const name = raw.name || existing?.name || "";
    const username =
      raw.username ||
      existing?.username ||
      (name ? name.toLowerCase().replace(/\s+/g, "") : "");
    const photo = raw.photo || existing?.photo;
    const followersCount =
      typeof raw.followersCount === "number"
        ? raw.followersCount
        : existing?.followersCount;

    const isFollower = isExplicitFollower || followersSet.has(id) || existing?.isFollower;
    const isFollowing = isExplicitFollowing || followingSet.has(id) || existing?.isFollowing;

    let score = 0;
    if (isFollower && isFollowing) score = 15;
    else if (isFollower) score = 12;
    else if (isFollowing) score = 10;
    else score = 1;

    userMap.set(id, {
      _id: id,
      name,
      username,
      photo,
      followersCount,
      email: raw.email || existing?.email,
      isFollower,
      isFollowing,
      priorityScore: score,
    });
  };

  // 1. Check current user's followers & following from cache
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (Array.isArray(u.followers)) {
        u.followers.forEach((f: unknown) => {
          if (f && typeof f === "object") addUser(f, true, false);
        });
      }
      if (Array.isArray(u.following)) {
        u.following.forEach((f: unknown) => {
          if (f && typeof f === "object") addUser(f, false, true);
        });
      }
    }
  } catch {
    //
  }

  // 2. From persistent storage
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        for (const u of list) addUser(u);
      }
    }
  } catch {
    // Ignore cache parse errors
  }

  // 3. React Query cache
  if (queryClient) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cachedQueries = queryClient.getQueriesData<any>({});
      for (const [, data] of cachedQueries) {
        if (!data) continue;
        if (data.user) {
          addUser(data.user);
          if (Array.isArray(data.user.followers)) {
            data.user.followers.forEach((f: unknown) => {
              if (f && typeof f === "object") addUser(f, true, false);
            });
          }
          if (Array.isArray(data.user.following)) {
            data.user.following.forEach((f: unknown) => {
              if (f && typeof f === "object") addUser(f, false, true);
            });
          }
        }
        if (data.data?.user) addUser(data.data.user);

        if (Array.isArray(data.suggestions)) {
          for (const s of data.suggestions) addUser(s);
        }
        if (Array.isArray(data.data?.suggestions)) {
          for (const s of data.data.suggestions) addUser(s);
        }

        // Check posts
        const posts = Array.isArray(data)
          ? data
          : data.posts || data.data?.posts || (Array.isArray(data.pages) ? data.pages.flatMap((p: any) => p?.posts || p?.data?.posts || []) : []);

        if (Array.isArray(posts)) {
          for (const p of posts) {
            if (p?.user) addUser(p.user);
            if (p?.sharedPost?.user) addUser(p.sharedPost.user);
            if (Array.isArray(p?.comments)) {
              for (const c of p.comments) {
                if (c?.commentCreator) addUser(c.commentCreator);
                if (c?.user) addUser(c.user);
              }
            }
          }
        }
      }
    } catch {
      //
    }
  }

  // Sort by priorityScore (followers/following first) then followersCount
  const result = Array.from(userMap.values()).sort((a, b) => {
    const scoreDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.followersCount || 0) - (a.followersCount || 0);
  });

  // Keep persistent storage updated with discovered users (max 200)
  try {
    if (result.length > 0) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.slice(0, 200)));
    }
  } catch {
    //
  }

  return result;
}

/**
 * Searches for a user matching a mention handle (e.g. "mentor_user", "ahmed", "abofeky").
 */
export function findUserByMention(
  mention: string,
  queryClient?: QueryClient,
): ExtendedSearchUser | null {
  const clean = mention.replace(/^@/, "").trim().toLowerCase();
  if (!clean) return null;

  const users = getAllKnownUsers(queryClient);

  // 1. Direct ID match
  const byId = users.find((u) => u._id.toLowerCase() === clean);
  if (byId) return byId;

  // 2. Exact username match
  const byUsername = users.find(
    (u) => (u.username || "").toLowerCase() === clean,
  );
  if (byUsername) return byUsername;

  // 3. Exact name without spaces
  const byCompactName = users.find(
    (u) => (u.name || "").toLowerCase().replace(/\s+/g, "") === clean,
  );
  if (byCompactName) return byCompactName;

  // 4. Exact name with underscores
  const byUnderscoreName = users.find(
    (u) => (u.name || "").toLowerCase().replace(/\s+/g, "_") === clean,
  );
  if (byUnderscoreName) return byUnderscoreName;

  // 5. First name match or substring match
  const byPrefix = users.find((u) => {
    const uName = (u.name || "").toLowerCase();
    const uHandle = (u.username || "").toLowerCase();
    return (
      uHandle.startsWith(clean) ||
      uName.startsWith(clean) ||
      uName.replace(/\s+/g, "").startsWith(clean)
    );
  });
  if (byPrefix) return byPrefix;

  return null;
}

