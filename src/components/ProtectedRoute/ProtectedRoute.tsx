import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export function Protectedroute({ children }: { children: ReactNode }) {
  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AuthProtectedroute({ children }: { children: ReactNode }) {
  if (localStorage.getItem("token")) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

