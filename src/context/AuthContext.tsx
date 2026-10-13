import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";

export interface User {
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  photo?: string;
  createdAt?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  [key: string]: unknown;
}

interface AuthContextType {
  userLogin: User | null;
  setUserLogin: React.Dispatch<React.SetStateAction<User | null>>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  userLogin: null,
  setUserLogin: () => {},
});

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export async function fetchMyProfile(): Promise<User | null> {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const res = await axios.get(
      "https://route-posts.routemisr.com/users/profile-data",
      {
        headers: {
          token,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const user: User =
      res.data?.user ??
      res.data?.data?.user ??
      res.data?.data ??
      res.data;
    return user && typeof user === "object" ? user : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userLogin, setUserLogin] = useState<User | null>(getStoredUser);

  useEffect(() => {
    if (userLogin) {
      localStorage.setItem("user", JSON.stringify(userLogin));
    } else {
      localStorage.removeItem("user");
    }
  }, [userLogin]);

  return (
    <AuthContext.Provider value={{ userLogin, setUserLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}