import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import axios from "axios";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Input } from "#components/ui/input";
import { Field, FieldLabel } from "#components/ui/field";
import { toast } from "#components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext, fetchMyProfile } from "../../context/AuthContext";


function extractToken(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = extractToken(item);
      if (found) return found;
    }
    return null;
  }
  const record = obj as Record<string, unknown>;
  for (const key of ["token", "accessToken", "newToken"]) {
    const v = record[key];
    if (typeof v === "string" && v.length > 10) return v;
  }
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" && /token/i.test(key) && value.length > 10) {
      return value;
    }
  }
  for (const value of Object.values(record)) {
    const found = extractToken(value);
    if (found) return found;
  }
  return null;
}

const changePasswordSchema = zod
  .object({
    password: zod.string().nonempty("Current password is required"),
    newPassword: zod
      .string()
      .nonempty("New password is required")
      .regex(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
      ),
    rePassword: zod.string().nonempty("Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.rePassword, {
    error: "Passwords do not match",
    path: ["rePassword"],
  });

type ChangePasswordType = zod.infer<typeof changePasswordSchema>;

interface ChangePasswordProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePassword({ open, onClose }: ChangePasswordProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { setUserLogin } = useContext(AuthContext);
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const form = useForm<ChangePasswordType>({
    defaultValues: { password: "", newPassword: "", rePassword: "" },
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });
  const { register, handleSubmit, formState, reset } = form;

  if (!open) return null;

  function onSubmit(values: ChangePasswordType) {
    setIsLoading(true);
    axios
      .patch(
        "https://route-posts.routemisr.com/users/change-password",
        { password: values.password, newPassword: values.newPassword },
        {
          headers: {
            token: localStorage.getItem("token") || "",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      .then(async (res) => {
       
        let newToken = extractToken(res.data);
        if (newToken) {
          localStorage.setItem("token", newToken);
        } else {
          
          try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}") as {
              email?: string;
              _id?: string;
            };
            
            const email =
              (storedUser?.email as string | undefined) || undefined;
            if (email) {
              const loginRes = await axios.post(
                "https://route-posts.routemisr.com/users/signin",
                { email, password: values.newPassword },
              );
              newToken =
                extractToken(loginRes.data) ??
                (typeof loginRes.data?.token === "string"
                  ? loginRes.data.token
                  : null) ??
                (typeof loginRes.data?.data?.token === "string"
                  ? loginRes.data.data.token
                  : null);
              if (newToken) localStorage.setItem("token", newToken);
            }
          } catch {
            // Silent fallback failed — keep the old token; don't log out.
          }
        }
       
        try {
          const freshProfile = await fetchMyProfile();
          if (freshProfile) setUserLogin((prev) => ({ ...prev, ...freshProfile }));
        } catch {
          // keep current context — stay logged in regardless
        }
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        toast.add({
          title: "Password updated",
          description:
            "Your password has been changed successfully. You are still logged in.",
          type: "success",
        });
        reset();
        onClose();
      })
      .catch((err) => {
        toast.add({
          title: "Error",
          description:
            err?.response?.data?.message ??
            "Could not change your password, please try again.",
          type: "error",
        });
      })
      .finally(() => setIsLoading(false));
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-6 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[#083695]/10 dark:bg-white/10 flex items-center justify-center text-[#083695] dark:text-blue-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Change password
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Keep your account secure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* current password */}
          <Field>
            <FieldLabel className="text-[#083695] dark:text-blue-200">
              Current password
            </FieldLabel>
            <div className="relative">
              <Input
                {...register("password")}
                type={show.current ? "text" : "password"}
                placeholder="Enter current password"
                className="h-11 pr-11 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((p) => ({ ...p, current: !p.current }))}
                aria-label={show.current ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#083695] dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {show.current ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {formState.errors.password?.message && (
              <p className="text-red-500 text-xs">
                {formState.errors.password.message}
              </p>
            )}
          </Field>

          {/* new password */}
          <Field>
            <FieldLabel className="text-[#083695] dark:text-blue-200">
              New password
            </FieldLabel>
            <div className="relative">
              <Input
                {...register("newPassword")}
                type={show.next ? "text" : "password"}
                placeholder="Enter new password"
                className="h-11 pr-11 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((p) => ({ ...p, next: !p.next }))}
                aria-label={show.next ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#083695] dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {show.next ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {formState.errors.newPassword?.message && (
              <p className="text-red-500 text-xs">
                {formState.errors.newPassword.message}
              </p>
            )}
          </Field>

          {/* confirm password */}
          <Field>
            <FieldLabel className="text-[#083695] dark:text-blue-200">
              Confirm new password
            </FieldLabel>
            <div className="relative">
              <Input
                {...register("rePassword")}
                type={show.confirm ? "text" : "password"}
                placeholder="Re-enter new password"
                className="h-11 pr-11 rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
              />
              <button
                type="button"
                onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                aria-label={
                  show.confirm ? "Hide password" : "Show password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#083695] dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                {show.confirm ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {formState.errors.rePassword?.message && (
              <p className="text-red-500 text-xs">
                {formState.errors.rePassword.message}
              </p>
            )}
          </Field>

          <div className="flex items-center gap-2 rounded-xl bg-[#083695]/5 dark:bg-blue-400/10 px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#083695] dark:text-blue-400" />
            Use at least 8 characters with uppercase, lowercase, a number and a
            special character.
          </div>

          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#083695] hover:bg-[#092f70] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


