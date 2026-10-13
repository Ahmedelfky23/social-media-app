import { useState, useContext } from "react";
import logo from "../../assets/route.png";
import { useForm, Controller } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import { Button } from "#components/ui/button";
import { RadioGroup, RadioGroupItem } from "#components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Signupschema } from "../../components/schemas/auth.schema";
import type { Signupschematype } from "../../components/schemas/auth.schema";
import axios from "axios";
import { toast } from "#components/ui/toast";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthContext } from "../../context/AuthContext";
import type { User } from "../../context/AuthContext";
import { signInWithGoogle } from "../../lib/googleAuth";

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { setUserLogin } = useContext(AuthContext);
  const form = useForm<Signupschematype>({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      dateOfBirth: "",
      gender: "male",
      password: "",
      rePassword: "",
    },
    resolver: zodResolver(Signupschema),
    mode: "onChange",
  });
  const { register, handleSubmit, formState } = form;
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  function handelSignup(values: Signupschematype) {
    setIsLoading(true);
    axios
      .post("https://route-posts.routemisr.com/users/signup", values)
      .then((res) => {
        console.log(res.data);
        if (res.data.success) {
          toast.add({
            title: "Account Created!",
            description: "Your account has been created successfully.",
            type: "success",
          });
          navigate("/login");
        }
      })
      .catch((err) => {
        console.log(err);
        toast.add({
          title: "Error",
          description: err?.response?.data?.message ?? "User already exists",
          type: "error",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function handelGoogleSignup() {
    setIsGoogleLoading(true);
    try {
      const profile = await signInWithGoogle();
      const user: User = {
        _id: profile.sub,
        name: profile.name,
        username: profile.email?.split("@")[0],
        email: profile.email,
        photo: profile.picture,
      };
      
      localStorage.setItem("token", `google-${profile.sub}`);
      setUserLogin(user);
      toast.add({
        title: "Account Created!",
        description: `Welcome, ${profile.name}. You're signed in with Google.`,
        type: "success",
      });
      navigate("/home");
    } catch (err) {
      toast.add({
        title: "Google Sign-up Error",
        description:
          err instanceof Error
            ? err.message
            : "Could not sign up with Google. Please try again.",
        type: "error",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <>
      {/* Full-screen Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#083695] flex flex-col items-center justify-center p-6 text-white"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
              src={logo}
              alt="logo"
              className="w-44 sm:w-56 max-w-full object-contain mb-6"
            />
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="mt-4 text-base sm:text-lg font-medium text-blue-100">
              Creating your account...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen lg:h-screen w-full font-sans bg-[#083695] flex flex-col lg:flex-row overflow-x-hidden">
        {/* ================= Left Branding Panel (Desktop Only) ================= */}
        <div className="hidden lg:flex lg:w-[32%] xl:w-[28%] min-w-75 bg-[#083695] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden shrink-0">
          <div className="mt-4">
            <h1 className="text-3xl xl:text-4xl font-bold mb-4">Welcome</h1>
            <h3 className="text-lg xl:text-xl font-light leading-relaxed text-blue-100">
              Please login or sign up to continue using our app
            </h3>
          </div>

          {/* Logo Area */}
          <div className="my-auto py-8 flex items-center justify-center">
            <img
              src={logo}
              alt="logo"
              className="w-52 xl:w-60 object-contain max-w-full drop-shadow-md"
            />
          </div>

          <div className="text-xs text-blue-200/60 pb-2">
            © 2026 SocialApp. All rights reserved.
          </div>
        </div>

        {/* ================= Right Form Panel ================= */}
        <div className="flex-1 w-full min-h-screen lg:min-h-0 bg-white dark:bg-[#0f172a] relative z-10 lg:-ml-8 lg:rounded-l-[40px] shadow-2xl flex flex-col items-center justify-start lg:justify-center px-4 sm:px-8 lg:px-12 py-8 overflow-y-auto transition-colors duration-300">
          <form
            className="flex flex-col gap-3 w-full max-w-xl my-auto py-2"
            onSubmit={handleSubmit(handelSignup)}
          >
            {/* Mobile Branding Header */}
            <div className="lg:hidden flex flex-col items-center gap-1 mb-2">
              <img
                src={logo}
                alt="logo"
                className="h-14 w-auto object-contain"
              />
            </div>

            <FieldGroup className="gap-2.5">
              <div className="flex flex-col items-center gap-0.5 text-center mb-1">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] moul text-[#083695] dark:text-white font-bold leading-tight">
                  Sign Up
                </h1>
                <p className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">
                  Fill in the form below to create your account
                </p>
              </div>

              {/* Full Name & Username in 2 columns on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field className="gap-1">
                  <FieldLabel
                    className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200"
                    htmlFor="name"
                  >
                    Full Name
                  </FieldLabel>
                  <Input
                    {...register("name")}
                    className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                    id="name"
                    type="text"
                    placeholder="Abofeky"
                  />
                  {formState.errors.name?.message &&
                    formState.touchedFields.name && (
                      <p className="text-red-500 text-xs">
                        {formState.errors.name.message}
                      </p>
                    )}
                </Field>

                <Field className="gap-1">
                  <FieldLabel
                    className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200"
                    htmlFor="username"
                  >
                    Username
                  </FieldLabel>
                  <Input
                    {...register("username")}
                    className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                    id="username"
                    type="text"
                    placeholder="Abofeky235"
                  />
                  {formState.errors.username?.message &&
                    formState.touchedFields.username && (
                      <p className="text-red-500 text-xs">
                        {formState.errors.username.message}
                      </p>
                    )}
                </Field>
              </div>

              {/* Email & Date of Birth in 2 columns on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field className="gap-1">
                  <FieldLabel
                    className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200"
                    htmlFor="email"
                  >
                    Email
                  </FieldLabel>
                  <Input
                    {...register("email")}
                    className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                  />
                  {formState.errors.email?.message &&
                    formState.touchedFields.email && (
                      <p className="text-red-500 text-xs">
                        {formState.errors.email.message}
                      </p>
                    )}
                </Field>

                <Field className="gap-1">
                  <FieldLabel
                    className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200"
                    htmlFor="dateOfBirth"
                  >
                    Date of Birth
                  </FieldLabel>
                  <Input
                    {...register("dateOfBirth")}
                    className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all"
                    id="dateOfBirth"
                    type="date"
                  />
                  {formState.errors.dateOfBirth?.message &&
                    formState.touchedFields.dateOfBirth && (
                      <p className="text-red-500 text-xs">
                        {formState.errors.dateOfBirth.message}
                      </p>
                    )}
                </Field>
              </div>

              {/* Password & Confirm Password in 2 columns on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field className="gap-1">
                  <FieldLabel
                    className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200"
                    htmlFor="password"
                  >
                    Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all pr-11"
                      id="password"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3d7b] dark:hover:text-gray-200 transition-colors cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formState.errors.password?.message &&
                    formState.touchedFields.password && (
                      <p className="text-red-500 text-xs">
                        {formState.errors.password.message}
                      </p>
                    )}
                </Field>

                <Field className="gap-1">
                  <FieldLabel
                    className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      {...register("rePassword")}
                      className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 hover:border-[#083695] focus-visible:border-[#083695] dark:focus-visible:border-[#60a5fa] transition-all pr-11"
                      name="rePassword"
                      id="confirm-password"
                      type={showRePassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRePassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3d7b] dark:hover:text-gray-200 transition-colors cursor-pointer"
                      aria-label={
                        showRePassword ? "Hide password" : "Show password"
                      }
                    >
                      {showRePassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="size-4.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formState.errors.rePassword?.message &&
                    formState.touchedFields.rePassword && (
                      <p className="text-red-500 text-xs">
                        {formState.errors.rePassword.message}
                      </p>
                    )}
                </Field>
              </div>

              {/* Gender Selection */}
              <Controller
                {...register("gender")}
                control={form.control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="w-full gap-1.5"
                  >
                    <div className="text-sm sm:text-base poppins-semibold text-[#083695] dark:text-blue-200">
                      Choose your gender
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        htmlFor="male"
                        className="flex items-center justify-between px-3.5 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] hover:border-[#083695] hover:bg-[#083695]/5 has-data-checked:border-[#083695] has-data-checked:bg-[#083695]/10 has-data-checked:ring-1 has-data-checked:ring-[#083695] dark:has-data-checked:border-[#60a5fa] dark:has-data-checked:bg-[#60a5fa]/15 cursor-pointer transition-all shadow-xs"
                      >
                        <span className="text-sm sm:text-base poppins-medium text-gray-800 dark:text-gray-200 select-none">
                          Male
                        </span>
                        <RadioGroupItem value="male" id="male" />
                      </label>
                      <label
                        htmlFor="female"
                        className="flex items-center justify-between px-3.5 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] hover:border-[#083695] hover:bg-[#083695]/5 has-data-checked:border-[#083695] has-data-checked:bg-[#083695]/10 has-data-checked:ring-1 has-data-checked:ring-[#083695] dark:has-data-checked:border-[#60a5fa] dark:has-data-checked:bg-[#60a5fa]/15 cursor-pointer transition-all shadow-xs"
                      >
                        <span className="text-sm sm:text-base poppins-medium text-gray-800 dark:text-gray-200 select-none">
                          Female
                        </span>
                        <RadioGroupItem value="female" id="female" />
                      </label>
                    </div>
                    {formState.errors.gender?.message &&
                      formState.touchedFields.gender && (
                        <p className="text-red-500 text-xs">
                          {formState.errors.gender.message}
                        </p>
                      )}
                  </RadioGroup>
                )}
              />

              {/* Submit Button */}
              <Field className="mt-1">
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="disabled:cursor-not-allowed w-full h-11 sm:h-12 text-base sm:text-lg cursor-pointer font-semibold bg-[#083695] hover:bg-[#092f70] text-white rounded-xl transition-all shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-6 h-6" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </Field>

              <FieldSeparator className="text-sm sm:text-base text-gray-400 my-1">
                Or continue with
              </FieldSeparator>

              {/* Social Buttons */}
              <Field className="grid grid-cols-2 gap-3 w-full">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handelGoogleSignup}
                  disabled={isGoogleLoading}
                  aria-label="Sign up with Google"
                  className="w-full cursor-pointer h-11 sm:h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] hover:border-[#083695] hover:bg-[#083695]/5 dark:hover:bg-white/5 transition-all shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="size-5 animate-spin text-[#083695] dark:text-[#60a5fa]" />
                  ) : (
                    <svg
                      className="size-5 text-[#083695] dark:text-[#60a5fa]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  <span className="sr-only">Sign up with Google</span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full cursor-pointer h-11 sm:h-12 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] hover:border-[#083695] hover:bg-[#083695]/5 dark:hover:bg-white/5 transition-all shadow-xs"
                >
                  <svg
                    className="size-5 text-[#083695] dark:text-[#60a5fa]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Sign up with Meta</span>
                </Button>
              </Field>

              <FieldDescription className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                Already have an account?{" "}
                <Link
                  className="text-[#083695] dark:text-[#60a5fa] font-semibold hover:underline"
                  to="/login"
                >
                  Login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </div>
      </div>
    </>
  );
}
