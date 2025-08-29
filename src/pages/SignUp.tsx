import { Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaEye, FaCheckCircle } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa6";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../utils/Firebase";
import { BeatLoader } from "react-spinners";

interface UserdataInterface {
  email: string;
  password: string;
  confirmPassword: string;
  termsAgreed: boolean;
}

export default function SignUpScreen() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserdataInterface>({
    email: "",
    password: "",
    confirmPassword: "",
    termsAgreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  async function signUpHandler(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // guard

    // Validation BEFORE enabling loading
    if (userData.password !== userData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!userData.termsAgreed) {
      toast.error("You must agree to the terms and conditions");
      return;
    }
    if (!userData.email || !userData.password || !userData.confirmPassword) {
      toast.error("All fields must be filled out.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        userData.email.trim(),
        userData.password
      );
      const userId = cred.user.uid;

      await setDoc(
        doc(db, "Users", userId),
        {
          uid: userId,
          email: userData.email.trim(),
          termsAgreed: userData.termsAgreed,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success("Account created successfully!");
      navigate("/Home");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function togglePasswordVisibility() {
    setShowPassword((p) => !p);
    toast.info("Password visibility toggled");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(circle_at_75%_75%,rgba(99,102,241,0.25),transparent_55%)]" />
      <div className="relative w-full max-w-lg">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 md:p-10 space-y-8 text-slate-100">
          <header className="space-y-2 text-center">
            <h1 className="font-mono font-bold text-3xl tracking-tight">
              Create your account
            </h1>
            <p className="text-sm text-slate-300">
              Start tracking goals, focus sessions & progress analytics.
            </p>
          </header>
          <form onSubmit={signUpHandler} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                disabled={loading}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold tracking-wide"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Create password"
                    value={userData.password}
                    onChange={(e) =>
                      setUserData({ ...userData, password: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 pr-10 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold tracking-wide"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Repeat password"
                    value={userData.confirmPassword}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 pr-10 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/40"
                checked={userData.termsAgreed}
                required
                onChange={(e) =>
                  setUserData({ ...userData, termsAgreed: e.target.checked })
                }
                disabled={loading}
              />
              <label
                htmlFor="terms"
                className="text-xs leading-relaxed text-slate-300"
              >
                I agree to the{" "}
                <span className="text-slate-100 underline underline-offset-2">
                  Terms
                </span>{" "}
                and
                <span className="ml-1 text-slate-100 underline underline-offset-2">
                  Privacy Policy
                </span>
                . I understand my data will be used to personalize goal & focus
                analytics.
              </label>
            </div>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {loading && <BeatLoader size={8} color="#fff" />}
                <span>
                  {loading ? "Creating account..." : "Create Account"}
                </span>
              </button>
              <p className="text-center text-xs text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="text-blue-300 hover:text-blue-200 font-medium"
                >
                  Log in
                </Link>
              </p>
            </div>
          </form>
          <div className="grid grid-cols-3 gap-4 text-center text-[10px] text-slate-400 pt-2">
            <div className="flex items-center justify-center gap-1">
              <FaCheckCircle className="text-blue-400" /> Track goals
            </div>
            <div className="flex items-center justify-center gap-1">
              <FaCheckCircle className="text-blue-400" /> Focus tasks
            </div>
            <div className="flex items-center justify-center gap-1">
              <FaCheckCircle className="text-blue-400" /> Progress insights
            </div>
          </div>
        </div>
        {loading && (
          <div className="absolute inset-0 rounded-3xl backdrop-blur-sm bg-slate-900/20 flex items-center justify-center">
            <BeatLoader color="#fff" />
          </div>
        )}
      </div>
    </div>
  );
}
