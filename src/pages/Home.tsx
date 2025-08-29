import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import { db } from "../utils/Firebase";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";

interface Quote {
  author: string;
  text: string;
}

interface newGoal {
  id?: string;
  title: string;
  Description: string;
}

export default function HomeScreen() {
  // Local fallback quotes (used when API quota is exhausted or config missing)
  const FALLBACK_QUOTES: Quote[] = [
    {
      author: "James Clear",
      text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    },
    {
      author: "Cal Newport",
      text: "Clarity about what matters provides clarity about what does not.",
    },
    {
      author: "Marcus Aurelius",
      text: "The happiness of your life depends upon the quality of your thoughts.",
    },
    {
      author: "Seneca",
      text: "It is not that we have a short time to live, but that we waste much of it.",
    },
    { author: "Epictetus", text: "No great thing is created suddenly." },
    { author: "Naval Ravikant", text: "Earn with your mind, not your time." },
    { author: "Ryan Holiday", text: "Stillness is the key to everything." },
    { author: "Maya Angelou", text: "Nothing will work unless you do." },
    {
      author: "Angela Duckworth",
      text: "Enthusiasm is common. Endurance is rare.",
    },
    {
      author: "Carol Dweck",
      text: "Why waste time proving over and over how great you are, when you could be getting better?",
    },
    {
      author: "Tony Robbins",
      text: "It is in your moments of decision that your destiny is shaped.",
    },
    { author: "Jocko Willink", text: "Discipline equals freedom." },
    {
      author: "Simon Sinek",
      text: "Dream big. Start small. But most of all, start.",
    },
    {
      author: "James Clear",
      text: "Habits are the compound interest of self‑improvement.",
    },
    { author: "Unknown", text: "Focus is a superpower—guard it relentlessly." },
  ];

  const [todaysQuote, setTodaysquote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goals, setGoals] = useState<newGoal[]>([]);
  const [userName, setUserName] = useState<string>("");
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const url = import.meta.env.VITE_URL;
  const x_rapidapi_key = import.meta.env.VITE_X_RAPID_API_KEY;
  const x_rapidapi_host = import.meta.env.VITE_X_RAPID_API_HOST;

  // Fallback persistence helpers
  const FALLBACK_STORAGE_KEY = "habitual_fallback_quote_v1";
  const DAY_MS = 24 * 60 * 60 * 1000;

  function getActiveFallback(): Quote | null {
    try {
      const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        text: string;
        author: string;
        activatedAt: number;
      };
      if (!parsed?.activatedAt) return null;
      const age = Date.now() - parsed.activatedAt;
      if (age < DAY_MS) {
        return { text: parsed.text, author: parsed.author };
      }
      // expired -> clear
      localStorage.removeItem(FALLBACK_STORAGE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  function persistFallback(quote: Quote) {
    try {
      localStorage.setItem(
        FALLBACK_STORAGE_KEY,
        JSON.stringify({ ...quote, activatedAt: Date.now() })
      );
    } catch {
      // ignore storage errors
    }
  }

  function GoalsComponent() {
    if (goalsLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white p-4 shadow-sm animate-pulse"
            >
              <div className="h-4 w-1/2 rounded bg-gray-200 mb-3" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      );
    }
    if (goals.length === 0) {
      return (
        <div className="rounded-xl border border-dashed bg-gray-50 p-8 text-center text-sm text-gray-500">
          No goals yet.
          <div className="mt-3">
            <Link
              to="/Goals"
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-blue-700"
            >
              Create your first goal
            </Link>
          </div>
        </div>
      );
    }
    return (
      <ul className="grid gap-5 sm:grid-cols-2">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="group relative rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-lg font-mono mb-1">
              {goal.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-3">
              {goal.Description || "No description"}
            </p>
            <Link
              to="/Goals"
              className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              View details
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  const fetchQuote = useCallback(async () => {
    // If a fallback quote is already active for this 24h window, use it and exit (no re-randomizing)
    const existingFallback = getActiveFallback();
    if (existingFallback) {
      if (!todaysQuote) setTodaysquote(existingFallback); // initial load
      // toast.info(
      //   "Using daily fallback inspiration (API quota previously exceeded).",
      //   { autoClose: 3000 }
      // );
      return;
    }
    // Validate config first so user knows why nothing appears
    if (!url) {
      toast.error(
        "Inspiration service not configured (missing VITE_URL env variable)."
      );
      // Use fallback immediately
      if (!todaysQuote) selectFallbackQuote("config-missing");
      return;
    }
    if (!x_rapidapi_key || !x_rapidapi_host) {
      toast.error(
        "Quote API credentials missing (VITE_X_RAPID_API_KEY / VITE_X_RAPID_API_HOST)."
      );
      if (!todaysQuote) selectFallbackQuote("credentials-missing");
      return;
    }
    try {
      setQuoteLoading(true);
      const response = await axios.request({
        method: "GET",
        url: `${url}`,
        params: { token: "ipworld.info" },
        headers: {
          "x-rapidapi-key": `${x_rapidapi_key}`,
          "x-rapidapi-host": `${x_rapidapi_host}`,
        },
        timeout: 8000,
      });
      setTodaysquote(response.data);
    } catch (error: any) {
      let reason = "Unknown error";
      // Axios specific diagnostics
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          if (status === 401 || status === 403)
            reason = `Auth failed (${status}) – check API key/host.`;
          else if (status === 404)
            reason = `Endpoint not found (404) – verify VITE_URL.`;
          else if (status === 429)
            reason = `Rate limited (429) – you've hit the request cap, retry later.`;
          else if (status >= 500)
            reason = `Server error (${status}) – provider issue, try again soon.`;
          else reason = `Request failed (${status}).`;
          // Use fallback for certain statuses
          if (status === 429) {
            // Quota exceeded -> set persistent fallback for rest of day
            selectFallbackQuote(`quota-exceeded-${status}`, true);
          } else if ([401, 403, 404, 500].includes(status) || status >= 500) {
            selectFallbackQuote(`status-${status}`);
          }
        } else if (error.request) {
          reason = "No response – network issue or CORS block.";
          selectFallbackQuote("no-response");
        } else if (error.code === "ECONNABORTED") {
          reason = "Request timed out ( >8s ).";
          selectFallbackQuote("timeout");
        } else {
          reason = error.message || reason;
          selectFallbackQuote("generic-error");
        }
      } else if (error instanceof Error) {
        reason = error.message;
        selectFallbackQuote("error-instance");
      }
      toast.error(
        `Couldn't load today's inspiration: ${reason} (Refresh to retry)`
      );
    } finally {
      setQuoteLoading(false);
    }
  }, [url, x_rapidapi_key, x_rapidapi_host, todaysQuote]);

  function selectFallbackQuote(tag: string, persist = false) {
    // If a persistent fallback is already stored, honor it
    const active = getActiveFallback();
    if (active) {
      setTodaysquote(active);
      return;
    }
    const pool = FALLBACK_QUOTES;
    if (pool.length === 0) return;
    const currentText = todaysQuote?.text;
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && candidate.text === currentText) {
      const filtered = pool.filter((q) => q.text !== currentText);
      if (filtered.length) candidate = filtered[0];
    }
    setTodaysquote(candidate);
    if (persist) persistFallback(candidate);
    toast.info(
      persist
        ? `Using fallback inspiration for the rest of today (${tag}).`
        : `Using fallback inspiration (${tag}).`
    );
  }

  const fetchGoals = useCallback(
    async (userId: string) => {
      try {
        setGoalsLoading(true);
        const docRef = collection(db, "Users", userId, "Goals");
        const docSnap = await getDocs(docRef);
        const userGoals: newGoal[] = [];
        docSnap.forEach((doc) => {
          userGoals.push({
            id: doc.id,
            title: doc.data().title,
            Description: doc.data().Description,
          });
        });
        setGoals(userGoals);
      } catch (error) {
        toast.error("Failed to load goals");
      } finally {
        setGoalsLoading(false);
      }
    },
    [db]
  );

  useEffect(() => {
    if (!currentUser) {
      toast.error("You must be logged in to view the homepage");
      navigate("/");
      return;
    }
    fetchQuote();
    fetchGoals(currentUser.uid);
    (async () => {
      try {
        const userDocRef = doc(db, "Users", currentUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const fullName = snap.data().fullName as string | undefined;
          if (fullName && fullName.trim()) {
            setUserName(fullName.split(" ")[0]);
            return;
          }
        }
        // fallback to auth displayName or email local part
        if (currentUser.displayName) {
          setUserName(currentUser.displayName.split(" ")[0]);
        } else if (currentUser.email) {
          setUserName(currentUser.email.split("@")[0]);
        }
      } catch {
        if (currentUser.email) setUserName(currentUser.email.split("@")[0]);
      }
    })();
  }, [currentUser, fetchQuote, fetchGoals, navigate]);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-12">
      <section className="rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm flex flex-col gap-4">
        <h1 className="text-2xl font-mono font-bold">
          {userName ? `Welcome, ${userName}!` : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-600 max-w-2xl">
          Stay consistent. Review your goals and set a clear focus for today.
        </p>
        <div className="flex gap-3">
          <Link
            to="/Goals"
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-blue-700"
          >
            View Goals
          </Link>
          <Link
            to="/Focus"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Start Focus
          </Link>
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.6),transparent_60%)]" />
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <h1 className="font-mono text-2xl font-bold">Today's Inspiration</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQuote}
              disabled={quoteLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {quoteLoading && <BeatLoader size={6} color="#fff" />}
              <span>{quoteLoading ? "Refreshing..." : "Refresh"}</span>
            </button>
            <Link
              to="/Focus"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-indigo-700"
            >
              Focus 🚀
            </Link>
          </div>
        </header>
        <div className="mt-6 relative z-10 min-h-[90px] flex items-center justify-center text-center px-2">
          {quoteLoading ? (
            <div className="w-full animate-pulse space-y-3">
              <div className="mx-auto h-4 w-3/4 rounded bg-gray-200" />
              <div className="mx-auto h-3 w-1/4 rounded bg-gray-100" />
            </div>
          ) : todaysQuote ? (
            <div className="space-y-3">
              <p className="text-lg italic font-medium text-gray-700 leading-relaxed">
                “{todaysQuote.text}”
              </p>
              <p className="text-sm font-semibold tracking-wide text-gray-500">
                — {todaysQuote.author || "Unknown"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No quote available</p>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-mono text-2xl font-bold">My Goals</h2>
          <div className="flex gap-3">
            <Link
              to="/Goals"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Manage Goals
            </Link>
            <Link
              to="/Focus"
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-blue-700"
            >
              Focus Mode
            </Link>
          </div>
        </header>
        <GoalsComponent />
      </section>
    </div>
  );
}
