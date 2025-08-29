import { useEffect, useState, useCallback } from "react";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "../utils/Firebase";
import { toast } from "react-toastify";
import { BeatLoader } from "react-spinners";

interface UserSummary {
  id: string;
  displayName?: string;
  interests?: string[];
}

// Local starter suggestions (could later move to remote config)
const SUGGESTED = [
  "productivity",
  "fitness",
  "reading",
  "meditation",
  "coding",
  "writing",
  "design",
  "finance",
  "study",
  "nutrition",
  "language-learning",
];

const MAX_INTERESTS = 25; // assumption for MVP

export default function FriendsScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<UserSummary[]>([]);
  const [fetchingError, setFetchingError] = useState<string | null>(null);

  // Normalize interest slug
  function normalizeInterest(raw: string) {
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const ref = doc(db, "Users", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setInterests(Array.isArray(data.interests) ? data.interests : []);
      } else {
        // create shell (optional)
        await setDoc(
          ref,
          { interests: [], createdAt: new Date() },
          { merge: true }
        );
        setInterests([]);
      }
    } catch (e) {
      setFetchingError("Failed to load your interests");
      toast.error("Failed to load interests");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function saveInterests(updated: string[]) {
    if (!userId) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "Users", userId), { interests: updated });
      setInterests(updated);
      toast.success("Interests updated");
    } catch (e) {
      toast.error("Error saving interests");
    } finally {
      setSaving(false);
    }
  }

  function addInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!newInterest.trim()) return;
    const normalized = normalizeInterest(newInterest);
    if (!normalized) return;
    if (interests.includes(normalized)) {
      toast.info("Already added");
      setNewInterest("");
      return;
    }
    if (interests.length >= MAX_INTERESTS) {
      toast.error(`Max ${MAX_INTERESTS} interests`);
      return;
    }
    saveInterests([...interests, normalized]);
    setNewInterest("");
  }

  function removeInterest(tag: string) {
    const filtered = interests.filter((i) => i !== tag);
    saveInterests(filtered);
  }

  const fetchRecommendations = useCallback(async () => {
    if (!userId || interests.length === 0) {
      setRecommendations([]);
      return;
    }
    try {
      setRecsLoading(true);
      // 1. Try precomputed recommendations subcollection
      try {
        const precomputedSnap = await getDocs(
          query(
            collection(db, "Users", userId, "Recommendations"),
            orderBy("weightedScore", "desc"),
            limit(10)
          )
        );
        const preList: UserSummary[] = [];
        for (const d of precomputedSnap.docs) {
          // fetch minimal user info for display
          const uSnap = await getDoc(doc(db, "Users", d.id));
          if (uSnap.exists()) {
            const uData = uSnap.data();
            preList.push({
              id: d.id,
              displayName: uData.displayName,
              interests: uData.interests || [],
            });
          }
        }
        if (preList.length > 0) {
          setRecommendations(preList);
          return;
        }
      } catch (e) {
        // fall through silently; will use client-side fallback
        console.warn("Precomputed recommendations load failed", e);
      }
      // naive approach: pick up to first 10 interests for array-contains-any ( Firestore limit is 10 )
      const sample = interests.slice(0, 10);
      const q = query(
        collection(db, "Users"),
        where("interests", "array-contains-any", sample),
        limit(25)
      );
      const snap = await getDocs(q);
      const list: UserSummary[] = [];
      snap.forEach((d) => {
        if (d.id === userId) return; // skip self
        const data = d.data();
        const candidateInterests = Array.isArray(data.interests)
          ? data.interests
          : [];
        // basic overlap count
        const overlap = candidateInterests.filter((c: string) =>
          interests.includes(c)
        ).length;
        if (overlap > 0) {
          list.push({
            id: d.id,
            displayName: data.displayName,
            interests: candidateInterests,
          });
        }
      });
      // simple sort by overlap descending then name
      list.sort((a, b) => {
        const overlapA = (a.interests || []).filter((x) =>
          interests.includes(x)
        ).length;
        const overlapB = (b.interests || []).filter((x) =>
          interests.includes(x)
        ).length;
        if (overlapB !== overlapA) return overlapB - overlapA;
        return (a.displayName || "").localeCompare(b.displayName || "");
      });
      setRecommendations(list.slice(0, 10));
    } catch (e) {
      toast.error("Failed to load recommendations");
    } finally {
      setRecsLoading(false);
    }
  }, [userId, interests]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-10">
      <header className="space-y-2">
        <h1 className="font-mono text-3xl font-bold">Friends & Community</h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl">
          Add your interests to get matched with like‑minded people and build
          accountability connections.
        </p>
      </header>

      <section className="grid lg:grid-cols-5 gap-10">
        {/* Interests Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-mono font-semibold text-xl">
                Your Interests
              </h2>
              <span className="text-xs text-gray-500">
                {interests.length}/{MAX_INTERESTS}
              </span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <BeatLoader />
              </div>
            ) : (
              <>
                {fetchingError && (
                  <p className="text-xs text-red-500">{fetchingError}</p>
                )}
                <form onSubmit={addInterest} className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="interestInput" className="sr-only">
                      Add interest
                    </label>
                    <input
                      id="interestInput"
                      type="text"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="e.g., Yoga, UI design"
                      disabled={saving}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !newInterest.trim()}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving" : "Add"}
                  </button>
                </form>
                {interests.length === 0 && (
                  <p className="text-xs text-gray-500">
                    You haven't added any interests yet—start with 3–5 that
                    define your focus.
                  </p>
                )}
                {interests.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {interests.map((i) => (
                      <li
                        key={i}
                        className="group inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-medium"
                      >
                        <span>{i}</span>
                        <button
                          type="button"
                          onClick={() => removeInterest(i)}
                          className="text-blue-500 hover:text-red-600 focus:outline-none"
                          aria-label={`Remove ${i}`}
                          disabled={saving}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED.filter((s) => !interests.includes(s))
                      .slice(0, 8)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (interests.length >= MAX_INTERESTS)
                              return toast.error(`Max ${MAX_INTERESTS}`);
                            saveInterests([...interests, s]);
                          }}
                          className="rounded-full border px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          disabled={saving}
                        >
                          {s}
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recommendations & Connections */}
        <div className="lg:col-span-3 space-y-8">
          <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-mono font-semibold text-xl">
                Recommended People
              </h2>
              <button
                type="button"
                onClick={fetchRecommendations}
                disabled={recsLoading}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {recsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {recsLoading ? (
              <div className="flex justify-center py-8">
                <BeatLoader />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                {interests.length === 0
                  ? "Add interests to start seeing matches."
                  : "No matches yet—try adding or refining interests."}
              </div>
            ) : (
              <ul className="space-y-4">
                {recommendations.map((r) => {
                  const overlap = (r.interests || []).filter((x) =>
                    interests.includes(x)
                  );
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border p-4 bg-white shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <p className="font-mono font-semibold text-sm truncate">
                            {r.displayName || "Anonymous"}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            Shared: {overlap.join(", ") || "None"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            toast.info("Connection requests to be implemented")
                          }
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700"
                        >
                          Connect
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-[11px] text-gray-400">
              Matching is prototype-level (simple overlap). Will evolve to
              weighted scoring + caching.
            </p>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
            <h2 className="font-mono font-semibold text-xl">Messages</h2>
            <p className="text-xs text-gray-500">
              Chat will appear here after a connection is accepted. (Next
              phase.)
            </p>
            <div className="h-40 flex items-center justify-center border border-dashed border-gray-300 rounded-lg text-gray-400 text-xs">
              No active conversations.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
