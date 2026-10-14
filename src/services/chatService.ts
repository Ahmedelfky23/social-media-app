import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { db, auth } from "../lib/firebase";
import type { User } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatParticipant {
  id: string;        // Social app user ID
  firebaseUid?: string;
  name: string;
  username?: string;
  photo?: string;
  email?: string;
}

export interface FirebaseChatMessage {
  id: string;
  senderId: string;   // Firebase UID of sender
  text: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | null;
  time?: string;
  isMe?: boolean;
}

export interface FirebaseChatDoc {
  id: string;
  members: string[];                          // Firebase UIDs (size 2)
  memberDetails?: Record<string, ChatParticipant>; // keyed by Firebase UID or social ID
  lastMessage?: string;
  lastSenderId?: string;
  lastMessageTime?: Timestamp | { seconds: number; nanoseconds: number } | null;
  lastReadAt?: Record<string, { seconds: number; nanoseconds: number } | Timestamp | null>;
  deletedFor?: Record<string, boolean>;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// ─── Timestamp helpers ─────────────────────────────────────────────────────────

export function formatChatTimestamp(
  ts?: Timestamp | { seconds: number; nanoseconds: number } | string | null,
): string {
  if (!ts) return "";
  let date: Date;
  if (typeof ts === "object" && "seconds" in ts) {
    date = new Date(ts.seconds * 1000);
  } else if (typeof ts === "string") {
    date = new Date(ts);
  } else {
    date = new Date();
  }
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function tsToMillis(
  ts?: Timestamp | { seconds: number; nanoseconds: number } | string | null,
): number {
  if (!ts) return 0;
  if (typeof ts === "object" && "seconds" in ts) return ts.seconds * 1000;
  if (typeof ts === "string") {
    const ms = new Date(ts).getTime();
    return isNaN(ms) ? 0 : ms;
  }
  return 0;
}

// ─── Firebase Auth ────────────────────────────────────────────────────────────

export function getDeterministicCredentials(currentUser: User): { email: string; password: string } {
  const email =
    currentUser.email && currentUser.email.includes("@")
      ? currentUser.email.toLowerCase().trim()
      : `user_${currentUser._id || "member"}@socialapp.local`;

  // Deterministic password shared across app sessions for this user
  const password = `SocialApp_${currentUser._id || currentUser.email}_SafePass!2026`;
  return { email, password };
}

/**
 * Ensure user is authenticated in Firebase Auth.
 * Automatically synchronizes with the social app login.
 * If another user was previously authenticated, it signs them out first.
 */
export async function ensureFirebaseAuth(currentUser?: User | null): Promise<FirebaseUser> {
  if (!currentUser) {
    if (auth.currentUser) return auth.currentUser;
    throw new Error("No user to authenticate");
  }

  const { email, password } = getDeterministicCredentials(currentUser);

  // If already logged in, check if it matches the current social user's email
  if (auth.currentUser) {
    if (auth.currentUser.email?.toLowerCase() === email.toLowerCase()) {
      return auth.currentUser;
    }
    // Account mismatch: sign out previous user session first
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }

  // 1. Try sign-in with deterministic credentials
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    const isUserNotFound =
      code === "auth/user-not-found" ||
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/invalid-login-credentials";

    if (isUserNotFound) {
      // 2. User doesn't exist yet: create deterministic account
      try {
        const createRes = await createUserWithEmailAndPassword(auth, email, password);
        if (currentUser.name || currentUser.photo) {
          await updateProfile(createRes.user, {
            displayName: currentUser.name || "User",
            photoURL: currentUser.photo || "",
          }).catch(() => {});
        }
        return createRes.user;
      } catch (createErr: unknown) {
        const createCode = (createErr as { code?: string })?.code;
        if (createCode === "auth/email-already-in-use") {
          // Account was created with older password format — try fallback password
          const oldPw = `SocialApp_${currentUser._id ?? currentUser.email}_SafePass!`;
          const fallbackRes = await signInWithEmailAndPassword(auth, email, oldPw);
          return fallbackRes.user;
        }
        throw createErr;
      }
    }
    throw err;
  }
}

// ─── User Registry ────────────────────────────────────────────────────────────

/**
 * Register current user's profile in Firestore (both "users" and "chatUsers").
 * This allows other users to look up this user's Firebase UID for chatting.
 */
export async function registerChatUser(
  socialId: string,
  firebaseUid: string,
  userInfo: { name?: string; username?: string; photo?: string; email?: string },
): Promise<void> {
  if (!socialId || !firebaseUid) return;
  const payload = {
    firebaseUid,
    socialId,
    name: userInfo.name ?? "",
    username: userInfo.username ?? "",
    photo: userInfo.photo ?? "",
    email: userInfo.email ?? "",
    updatedAt: serverTimestamp(),
  };

  await Promise.allSettled([
    setDoc(doc(db, "users", socialId), payload, { merge: true }),
    setDoc(doc(db, "chatUsers", socialId), payload, { merge: true }),
    setDoc(doc(db, "users", firebaseUid), payload, { merge: true }),
  ]);
}

/**
 * Look up another user's Firebase UID from their social app ID.
 */
export async function getFirebaseUidBySocialId(socialId: string): Promise<string | null> {
  if (!socialId) return null;

  try {
    const snap1 = await getDoc(doc(db, "users", socialId));
    if (snap1.exists()) {
      const data = snap1.data();
      if (data?.firebaseUid) return data.firebaseUid as string;
    }
  } catch {
    //
  }

  try {
    const snap2 = await getDoc(doc(db, "chatUsers", socialId));
    if (snap2.exists()) {
      const data = snap2.data();
      if (data?.firebaseUid) return data.firebaseUid as string;
    }
  } catch {
    //
  }

  return null;
}

// ─── Chat creation ────────────────────────────────────────────────────────────

export function getChatDocId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("__");
}

/**
 * Create or get a 1-on-1 chat between current user and target user.
 * Conforms to security rule:
 *   members is list, members.size() == 2, request.auth.uid in members
 */
export async function getOrCreateChat(
  currentUser: User,
  targetUser: { _id: string; name: string; username?: string; photo?: string; email?: string },
  currentFirebaseUid: string,
): Promise<{ chatId: string; isNew: boolean; targetNotRegistered?: boolean }> {
  if (!currentFirebaseUid) throw new Error("Not authenticated to Firebase");

  // 1. Look up target's Firebase UID
  let targetFirebaseUid = await getFirebaseUidBySocialId(targetUser._id);

  // If target user is current user
  if (targetUser._id === currentUser._id) {
    targetFirebaseUid = currentFirebaseUid;
  }

  if (!targetFirebaseUid) {
    // Target user hasn't registered in Firebase chat yet
    return {
      chatId: "",
      isNew: false,
      targetNotRegistered: true,
    };
  }

  // 2. Check if chat already exists
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("members", "array-contains", currentFirebaseUid));
  const snap = await getDocs(q);

  for (const d of snap.docs) {
    const data = d.data();
    const members: string[] = Array.isArray(data.members) ? data.members : [];
    if (members.includes(targetFirebaseUid)) {
      // Also update memberDetails to ensure names and photos are fresh
      await updateDoc(doc(db, "chats", d.id), {
        [`memberDetails.${currentFirebaseUid}`]: {
          id: currentUser._id ?? currentFirebaseUid,
          firebaseUid: currentFirebaseUid,
          name: currentUser.name ?? "Me",
          username: currentUser.username ?? "",
          photo: currentUser.photo ?? "",
          email: currentUser.email ?? "",
        },
        [`memberDetails.${targetFirebaseUid}`]: {
          id: targetUser._id,
          firebaseUid: targetFirebaseUid,
          name: targetUser.name ?? "User",
          username: targetUser.username ?? "",
          photo: targetUser.photo ?? "",
          email: targetUser.email ?? "",
        },
      }).catch(() => {});

      return { chatId: d.id, isNew: false };
    }
  }

  // 3. Create new chat doc
  const chatId = getChatDocId(currentFirebaseUid, targetFirebaseUid);
  const chatRef = doc(db, "chats", chatId);

  await setDoc(
    chatRef,
    {
      members: [currentFirebaseUid, targetFirebaseUid],
      memberDetails: {
        [currentFirebaseUid]: {
          id: currentUser._id ?? currentFirebaseUid,
          firebaseUid: currentFirebaseUid,
          name: currentUser.name ?? "Me",
          username: currentUser.username ?? "",
          photo: currentUser.photo ?? "",
          email: currentUser.email ?? "",
        },
        [targetFirebaseUid]: {
          id: targetUser._id,
          firebaseUid: targetFirebaseUid,
          name: targetUser.name ?? "User",
          username: targetUser.username ?? "",
          photo: targetUser.photo ?? "",
          email: targetUser.email ?? "",
        },
      },
      lastMessage: "",
      lastSenderId: "",
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { chatId, isNew: true };
}

// ─── Real-time subscriptions ──────────────────────────────────────────────────

export function subscribeToUserChats(
  firebaseUid: string,
  onUpdate: (chats: FirebaseChatDoc[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    where("members", "array-contains", firebaseUid),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats: FirebaseChatDoc[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FirebaseChatDoc, "id">),
      }));

      // Sort by most recent activity
      chats.sort((a, b) => tsToMillis(b.updatedAt ?? b.lastMessageTime) - tsToMillis(a.updatedAt ?? a.lastMessageTime));
      onUpdate(chats);
    },
    (err) => {
      console.error("subscribeToUserChats error:", err);
      onError?.(err);
    },
  );
}

export function subscribeToChatMessages(
  chatId: string,
  onUpdate: (messages: FirebaseChatMessage[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const myUid = auth.currentUser?.uid;
      const msgs: FirebaseChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          senderId: data.senderId as string,
          text: data.text as string,
          createdAt: data.createdAt,
          time: formatChatTimestamp(data.createdAt),
          isMe: data.senderId === myUid,
        };
      });
      onUpdate(msgs);
    },
    (err) => {
      console.error("subscribeToChatMessages error:", err);
      onError?.(err);
    },
  );
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

/**
 * Record when the current user read this chat.
 * Updates only lastReadAt.{uid} to preserve updatedAt message order.
 */
export async function markChatAsRead(chatId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !chatId) return;
  try {
    await updateDoc(doc(db, "chats", chatId), {
      [`lastReadAt.${uid}`]: serverTimestamp(),
    });
  } catch {
    // Non-critical
  }
}

/**
 * Check if a message has been read by the OTHER user.
 * Returns true ONLY if the other user has updated their lastReadAt past this message's timestamp.
 */
export function isMessageSeen(
  msgCreatedAt: Timestamp | { seconds: number; nanoseconds: number } | null | undefined,
  chat: FirebaseChatDoc,
  myUid: string,
): boolean {
  if (!chat.members || chat.members.length < 2) return false;

  // Find the other participant in this 2-member chat
  const otherUid = chat.members.find((m) => m !== myUid);
  if (!otherUid) return false;

  const otherReadAt = chat.lastReadAt?.[otherUid];
  if (!otherReadAt) return false;

  const msgMs = tsToMillis(msgCreatedAt ?? null);
  const readMs = tsToMillis(otherReadAt);

  // If message timestamp is not yet confirmed by the server (local write), it cannot be seen yet
  if (msgMs === 0) return false;

  return readMs >= msgMs;
}

// ─── Send message ─────────────────────────────────────────────────────────────

/**
 * Send a message conforming strictly to the security rules:
 *   keys().hasOnly(["text", "senderId", "createdAt"])
 *   senderId == request.auth.uid
 *   text is string, 1 <= size <= 2000
 */
export async function sendChatMessage(chatId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Message must be 1–2000 characters");
  }

  const senderId = auth.currentUser?.uid;
  if (!senderId) throw new Error("Not authenticated to Firebase");

  // Message doc — ONLY these 3 keys as required by rule
  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: trimmed,
    senderId,
    createdAt: serverTimestamp(),
  });

  // Update chat metadata (members unchanged → passes rule)
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: trimmed,
    lastSenderId: senderId,
    lastMessageTime: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((err) => console.warn("chat metadata update failed:", err));
}

// ─── Delete chat ──────────────────────────────────────────────────────────────

/**
 * Close and delete a chat.
 * Attempts permanent deletion first; if Firestore security rules prohibit delete,
 * falls back to soft-deleting/hiding for the current user via updateDoc.
 */
export async function deleteChat(chatId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!chatId || !uid) return;

  // 1. Try hard delete of the chat document
  try {
    await deleteDoc(doc(db, "chats", chatId));
    return;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // If permission-denied (due to rules lacking 'allow delete'), fallback to soft hide
    if (code === "permission-denied") {
      try {
        await updateDoc(doc(db, "chats", chatId), {
          [`deletedFor.${uid}`]: true,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    }
  }
}

