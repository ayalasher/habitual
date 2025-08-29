import { Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaEyeSlash } from "react-icons/fa6";
import { FaEye, FaCheckCircle } from "react-icons/fa";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";

interface userDataInterface {
  email: string;
  password: string;
  rememberMe: boolean;
}
export default function LogInScreen() {
  const [userData, setUserData] = useState<userDataInterface>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const auth = getAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  function loginHandler(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (userData.email === "" || userData.password === "") {
      toast.error("Email and password must be filled out.");
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, userData.email, userData.password)
      .then(() => {
        navigate("/Home");
      })
      .catch((error) => {
        toast.error(error.message || "Login failed");
      })
      .finally(() => setLoading(false));
  }

  function showPasswordHandler() {
    setShowPassword(!showPassword);
    toast.info("Password visibility toggled");
  }
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.25),transparent_55%)]" />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 md:p-10 space-y-8 text-slate-100">
          <header className="space-y-2 text-center">
            <h1 className="font-mono font-bold text-3xl tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-300">
              Sign in to continue your progress journey.
            </p>
          </header>
          <form onSubmit={loginHandler} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="loginEmail"
                className="text-sm font-semibold tracking-wide"
              >
                Email
              </label>
              <input
                id="loginEmail"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="loginPassword"
                className="text-sm font-semibold tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={userData.password}
                  onChange={(e) =>
                    setUserData({ ...userData, password: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 pr-10 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={showPasswordHandler}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/40"
                  checked={userData.rememberMe}
                  onChange={(e) =>
                    setUserData({ ...userData, rememberMe: e.target.checked })
                  }
                  disabled={loading}
                />
                <span className="text-slate-300">Remember me</span>
              </label>
              <Link
                to="/recover-password"
                className="text-blue-300 hover:text-blue-200"
              >
                Forgot password?
              </Link>
            </div>
            <div className="space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {loading && <BeatLoader size={8} color="#fff" />}
                <span>{loading ? "Signing in..." : "Sign In"}</span>
              </button>
              <p className="text-center text-xs text-slate-400">
                No account?{" "}
                <Link
                  to="/SignUp"
                  className="text-blue-300 hover:text-blue-200 font-medium"
                >
                  Create one
                </Link>
              </p>
            </div>
          </form>
          <div className="grid grid-cols-3 gap-4 text-center text-[10px] text-slate-400 pt-2">
            <div className="flex items-center justify-center gap-1">
              <FaCheckCircle className="text-blue-400" /> Goals
            </div>
            <div className="flex items-center justify-center gap-1">
              <FaCheckCircle className="text-blue-400" /> Focus
            </div>
            <div className="flex items-center justify-center gap-1">
              <FaCheckCircle className="text-blue-400" /> Insights
            </div>
          </div>
          {loading && (
            <div className="absolute inset-0 rounded-3xl backdrop-blur-sm bg-slate-900/20 flex items-center justify-center">
              <BeatLoader color="#fff" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
