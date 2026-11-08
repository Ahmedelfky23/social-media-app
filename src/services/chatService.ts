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
  members: string[];                          
  memberDetails?: Record<string, ChatParticipant>; 
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
  ts?: Timestamp | { seconds: number; nanoseconds: number } | Date | string | null,
): string {
  if (!ts) return "";
  let date: Date;
  if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === "string") {
    date = new Date(ts);
  } else if ("seconds" in ts) {
    date = new Date(ts.seconds * 1000);
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

function normalizeEmail(email?: string | null): string {
  const value = (email ?? "").toLowerCase().trim();
  return value.includes("@") ? value : "";
}

export function getFallbackChatEmail(socialId?: string): string {
  return `user_${socialId || "member"}@socialapp.local`;
}


export function getPasswordCandidates(socialId?: string, email?: string): string[] {
  const key = socialId || email || "member";
  const passwords = [`SocialApp_${key}_SafePass!2026`, `SocialApp_${key}_SafePass!`];
  const emailKey = normalizeEmail(email);
  if (emailKey && emailKey !== key) {
    passwords.push(`SocialApp_${emailKey}_SafePass!2026`, `SocialApp_${emailKey}_SafePass!`);
  }
  return passwords;
}


const CHAT_EMAIL_HINT_PREFIX = "chat_fb_email:";

function getChatEmailHint(socialId?: string): string {
  if (!socialId) return "";
  try {
    return localStorage.getItem(CHAT_EMAIL_HINT_PREFIX + socialId) ?? "";
  } catch {
    return "";
  }
}

function setChatEmailHint(socialId: string | undefined, email?: string | null): void {
  if (!socialId || !email) return;
  try {
    localStorage.setItem(CHAT_EMAIL_HINT_PREFIX + socialId, email.toLowerCase());
  } catch {
  }
}


export function getEmailCandidates(user: { _id?: string; email?: string }): string[] {
  const candidates: string[] = [];
  const hinted = getChatEmailHint(user._id);
  if (hinted) candidates.push(hinted);
  const primary = normalizeEmail(user.email);
  if (primary && !candidates.includes(primary)) candidates.push(primary);
  const fallback = getFallbackChatEmail(user._id);
  if (!candidates.includes(fallback)) candidates.push(fallback);
  return candidates;
}

export function getDeterministicCredentials(currentUser: User): { email: string; password: string } {
  return {
    email: normalizeEmail(currentUser.email) || getFallbackChatEmail(currentUser._id),
    password: getPasswordCandidates(currentUser._id, currentUser.email)[0],
  };
}


async function waitForAuthReady(ms = 8000): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      auth.authStateReady(),
      new Promise<void>((resolve) => {
        timer = setTimeout(() => {
          console.warn("Firebase Auth did not finish restoring state in time; continuing.");
          resolve();
        }, ms);
      }),
    ]);
  } catch {
    // Ignore: the sign-in attempts below establish the real state anyway.
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function trySignInAll(emails: string[], passwords: string[]): Promise<FirebaseUser | null> {
  
  await waitForAuthReady();

  
  for (const password of passwords) {
    for (const email of emails) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        return res.user;
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === "auth/too-many-requests") {
          console.warn("Firebase is rate limiting sign-in attempts; stopping.");
          return null;
        }
      }
    }
  }
  return null;
}


const inFlightEnsure = new Map<string, Promise<FirebaseUser>>();


export function ensureFirebaseAuth(currentUser?: User | null): Promise<FirebaseUser> {
  if (!currentUser) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return Promise.reject(new Error("No user to authenticate"));
  }

  const key = currentUser._id || normalizeEmail(currentUser.email) || "current";
  const existing = inFlightEnsure.get(key);
  if (existing) return existing;

  const task = doEnsureFirebaseAuth(currentUser).finally(() => {
    inFlightEnsure.delete(key);
  });
  inFlightEnsure.set(key, task);
  return task;
}

async function doEnsureFirebaseAuth(currentUser: User): Promise<FirebaseUser> {
  await waitForAuthReady();

  const emailCandidates = getEmailCandidates(currentUser);
  const passwordCandidates = getPasswordCandidates(currentUser._id, currentUser.email);

  const currentEmail = auth.currentUser?.email?.toLowerCase();
  if (currentEmail && emailCandidates.includes(currentEmail)) {
    setChatEmailHint(currentUser._id, currentEmail);
    return auth.currentUser as FirebaseUser;
  }

  if (auth.currentUser) {
    try {
      await signOut(auth);
    } catch {
      // 
    }
  }

  const signedIn = await trySignInAll(emailCandidates, passwordCandidates);
  if (signedIn) {
    setChatEmailHint(currentUser._id, signedIn.email);
    return signedIn;
  }

  let lastCreateError: unknown = null;
  for (const email of emailCandidates) {
    try {
      const createRes = await createUserWithEmailAndPassword(auth, email, passwordCandidates[0]);
      setChatEmailHint(currentUser._id, createRes.user.email);
      if (currentUser.name || currentUser.photo) {
        await updateProfile(createRes.user, {
          displayName: currentUser.name || "User",
          photoURL: currentUser.photo || "",
        }).catch(() => {});
      }
      return createRes.user;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        
        const raced = await trySignInAll([email], [passwordCandidates[0]]);
        if (raced) {
          setChatEmailHint(currentUser._id, raced.email);
          return raced;
        }
      }
      lastCreateError = err;
      if (code === "auth/too-many-requests") break;
    }
  }
  throw lastCreateError ?? new Error("Could not authenticate with Firebase Chat");
}

// ─── User Registry ────────────────────────────────────────────────────────────


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

  const results = await Promise.allSettled([
    setDoc(doc(db, "users", socialId), payload, { merge: true }),
    setDoc(doc(db, "chatUsers", socialId), payload, { merge: true }),
    setDoc(doc(db, "users", firebaseUid), payload, { merge: true }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("Chat registry write failed (users/" + socialId + "):", result.reason);
    }
  }
}


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

// ─── On-demand chat profile provisioning ──────────────────────────────────────

interface ChatTargetUser {
  _id: string;
  name?: string;
  username?: string;
  photo?: string;
  email?: string;
}

const inFlightProvisions = new Map<string, Promise<string | null>>();


/**
 * Create (or recover) another user's Firebase chat profile on demand.
 *
 * A chat document can only be opened once both members' Firebase UIDs exist,
 * but a user's UID is normally only created on their own first login. Because
 * this app derives credentials deterministically, we can safely provision their
 * profile ahead of time instead of forcing the conversation to dead-end:
 *
 *  1. Re-check the registry (they may have logged in since we last looked).
 *  2. Try signing in with their known/fallback addresses — the account may
 *     already exist even if the registry write failed.
 *  3. Otherwise create the account for them.
 *  4. While authenticated AS them, register their chat profile so owner-scoped
 *     Firestore rules accept the write.
 *  5. Restore the original user's session before returning control.
 *
 * Returns the target's Firebase UID, or null when provisioning isn't possible.
 */
export function provisionTargetChatUser(
  targetUser: ChatTargetUser,
  currentSocialUser: User,
  currentFirebaseUid: string,
): Promise<string | null> {
  if (!targetUser._id) return Promise.resolve(null);

  const pending = inFlightProvisions.get(targetUser._id);
  if (pending) return pending;

  const task = runProvisionTargetChatUser(targetUser, currentSocialUser, currentFirebaseUid).finally(() => {
    inFlightProvisions.delete(targetUser._id);
  });
  inFlightProvisions.set(targetUser._id, task);
  return task;
}

async function runProvisionTargetChatUser(
  targetUser: ChatTargetUser,
  currentSocialUser: User,
  currentFirebaseUid: string,
): Promise<string | null> {
  // 1. They may have logged in since the caller last checked
  const registered = await getFirebaseUidBySocialId(targetUser._id);
  if (registered) return registered;

  const emailCandidates = getEmailCandidates(targetUser);
  const passwordCandidates = getPasswordCandidates(targetUser._id, targetUser.email);

  // 2. The account may already exist (e.g. a previous registry write failed)
  let targetFbUser = await trySignInAll(emailCandidates, passwordCandidates);

  // 3. No account yet → create one for them
  for (let i = 0; !targetFbUser && i < emailCandidates.length; i++) {
    try {
      const res = await createUserWithEmailAndPassword(auth, emailCandidates[i], passwordCandidates[0]);
      targetFbUser = res.user;
    } catch (err: unknown) {
      // Address taken or invalid → try the next candidate (the deterministic
      // fallback) so this person still gets a usable chat profile.
      console.warn(`Chat provisioning: could not use "${emailCandidates[i]}" for "${targetUser._id}".`, err);
    }
  }

  if (!targetFbUser) {
    console.warn(`Chat provisioning: could not create Firebase profile for "${targetUser._id}".`);
    return null;
  }

  const targetUid = targetFbUser.uid;
  setChatEmailHint(targetUser._id, targetFbUser.email);

  // 4. We are authenticated AS the target — register their chat profile now
  await updateProfile(targetFbUser, {
    displayName: targetUser.name || "User",
    photoURL: targetUser.photo || "",
  }).catch(() => {});

  await registerChatUser(targetUser._id, targetUid, {
    name: targetUser.name,
    username: targetUser.username,
    photo: targetUser.photo,
    email: targetUser.email,
  });

  // 5. Restore the original user's session before returning control — messages
  //    and read receipts must be attributed to the current user, not the target.
  try {
    const restored = await ensureFirebaseAuth(currentSocialUser);
    if (restored.uid !== currentFirebaseUid) {
      console.error("Chat provisioning restored a different Firebase session:", restored.uid);
      return null;
    }
  } catch (err) {
    console.error("Failed to restore Firebase session after chat provisioning:", err);
    return null;
  }

  return targetUid;
}

// ─── Chat creation ────────────────────────────────────────────────────────────

export function getChatDocId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("__");
}


export async function getOrCreateChat(
  currentUser: User,
  targetUser: ChatTargetUser,
  currentFirebaseUid: string,
): Promise<{ chatId: string; isNew: boolean; targetNotRegistered?: boolean }> {
  if (!currentFirebaseUid) throw new Error("Not authenticated to Firebase");

  let targetFirebaseUid: string | null =
    targetUser._id === currentUser._id
      ? currentFirebaseUid
      : await getFirebaseUidBySocialId(targetUser._id);

  
  if (!targetFirebaseUid) {
    targetFirebaseUid = await provisionTargetChatUser(targetUser, currentUser, currentFirebaseUid);
  }

  if (!targetFirebaseUid) {
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

  if (msgMs === 0) return false;

  return readMs >= msgMs;
}

// ─── Send message ─────────────────────────────────────────────────────────────


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


export async function deleteChat(chatId: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!chatId || !uid) return;

  try {
    await deleteDoc(doc(db, "chats", chatId));
    return;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
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

