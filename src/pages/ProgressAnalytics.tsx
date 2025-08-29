import { useEffect, useState, useMemo } from "react";
import { db } from "../utils/Firebase";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { BeatLoader } from "react-spinners";
import { toast } from "react-toastify";

interface Goal {
  id?: string;
  title: string;
  description?: string;
  unitsToBeCompleted: number;
  unitsCompleted: number;
}

export default function ProgressAnalyticsScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeFilter, setRangeFilter] = useState<
    "all" | "active" | "completed"
  >("all");

  useEffect(() => {
    async function fetchGoals() {
      if (!userId) return;
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "Users", userId, "Goals"));
        const list: Goal[] = [];
        snap.forEach((d) =>
          list.push({
            id: d.id,
            title: d.data().title,
            description: d.data().Description,
            unitsToBeCompleted: d.data().unitsToBeCompleted || 0,
            unitsCompleted: d.data().unitsCompleted || 0,
          })
        );
        setGoals(list);
      } catch (e) {
        toast.error("Failed to load goals");
      } finally {
        setLoading(false);
      }
    }
    fetchGoals();
  }, [userId]);

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (rangeFilter === "active") {
        return g.unitsCompleted < g.unitsToBeCompleted;
      }
      if (rangeFilter === "completed") {
        return (
          g.unitsToBeCompleted > 0 && g.unitsCompleted >= g.unitsToBeCompleted
        );
      }
      return true;
    });
  }, [goals, rangeFilter]);

  function goalComment(pct: number) {
    if (pct >= 90)
      return "Elite execution. Maintain your rhythm and lock it in.";
    if (pct >= 75)
      return "Strong performance—you're ahead of pace, keep pressing smart.";
    if (pct >= 50)
      return "Halfway milestone reached—steady momentum compounds.";
    if (pct >= 25)
      return "Foundation set—each focused block accelerates progress.";
    if (pct > 0)
      return "Good start—consistency will push this past critical mass.";
    return "Ready to begin—one intentional step activates momentum.";
  }

  // Per-goal pct for rendering progress visuals
  const perGoalData = useMemo(
    () =>
      filteredGoals.map((g) => {
        const pct = g.unitsToBeCompleted
          ? Math.min(100, (g.unitsCompleted / g.unitsToBeCompleted) * 100)
          : 0;
        return { ...g, pct };
      }),
    [filteredGoals]
  );

  // Data for aggregate visual chart (per goal bars) – purely visual, not combined stats
  const chartData = perGoalData; // alias for clarity

  function CircularProgress({ pct }: { pct: number }) {
    const size = 78;
    const stroke = 8;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    return (
      <svg
        width={size}
        height={size}
        className="shrink-0"
        role="img"
        aria-label={`Goal ${pct}% complete`}
      >
        <defs>
          <linearGradient id="gradPct" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradPct)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="font-mono fill-gray-700 text-[11px]"
        >
          {Math.round(pct)}%
        </text>
      </svg>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-10">
      <header className="space-y-2">
        <h1 className="font-mono text-3xl font-bold">Progress & Analytics</h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl">
          Visualize how your measurable goals are advancing and get uplifting
          feedback.
        </p>
      </header>

      <section className="space-y-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="font-mono font-semibold text-2xl">
            Goal Analytics (Per Goal)
          </h2>
          <select
            aria-label="Filter goals"
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value as any)}
            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Goals</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Visual multi-goal bar chart */}
        {!loading && chartData.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-semibold tracking-wide">
                Visual Progress Map
              </h3>
              <span className="text-[10px] text-gray-400">
                Scroll if overflowing
              </span>
            </div>
            <div className="w-full overflow-x-auto pb-2">
              <div className="min-w-[560px]">
                <svg
                  viewBox={`0 0 ${chartData.length * 70} 220`}
                  className="w-full h-56 select-none"
                  role="img"
                  aria-label="Bar chart of individual goal completion percentages"
                >
                  <defs>
                    <linearGradient
                      id="barGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <g key={y}>
                      <line
                        x1={0}
                        x2={chartData.length * 70}
                        y1={180 - (y / 100) * 140}
                        y2={180 - (y / 100) * 140}
                        stroke="#e5e7eb"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <text
                        x={0}
                        y={184 - (y / 100) * 140}
                        className="fill-gray-400 text-[9px] font-mono"
                      >
                        {y}%
                      </text>
                    </g>
                  ))}
                  {/* Axis */}
                  <line
                    x1={0}
                    x2={chartData.length * 70}
                    y1={180}
                    y2={180}
                    stroke="#cbd5e1"
                    strokeWidth={2}
                  />
                  {/* Bars */}
                  {chartData.map((g, i) => {
                    const barHeight = (g.pct / 100) * 140;
                    return (
                      <g key={g.id || i}>
                        <rect
                          x={i * 70 + 18}
                          y={180 - barHeight}
                          width={40}
                          height={barHeight}
                          rx={8}
                          fill="url(#barGrad)"
                          className="opacity-90 hover:opacity-100 transition"
                        ></rect>
                        <text
                          x={i * 70 + 38}
                          y={170 - barHeight}
                          textAnchor="middle"
                          className="fill-gray-700 text-[10px] font-mono"
                        >
                          {Math.round(g.pct)}%
                        </text>
                        <text
                          x={i * 70 + 38}
                          y={194}
                          textAnchor="middle"
                          className="fill-gray-500 text-[9px] font-mono"
                        >
                          {g.title.length > 9
                            ? g.title.slice(0, 8) + "…"
                            : g.title}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              Each bar displays an individual goal's completion percentage with
              faint grid lines at 25% intervals.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <BeatLoader />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            No goals yet. Create goals to see analytics.
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            No goals match this filter.
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {perGoalData.map((g) => {
              const steps = [
                0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75,
                80, 85, 90, 95, 100,
              ];
              const nearest = steps.reduce(
                (prev, curr) =>
                  Math.abs(curr - g.pct) < Math.abs(prev - g.pct) ? curr : prev,
                0
              );
              const widthClass = nearest === 100 ? "w-full" : `w-[${nearest}%]`;
              return (
                <li
                  key={g.id}
                  className="relative rounded-3xl border bg-white/90 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg transition space-y-5"
                >
                  <div className="flex items-start gap-4">
                    <CircularProgress pct={g.pct} />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="space-y-1">
                        <h3
                          className="font-mono font-semibold text-base truncate"
                          title={g.title}
                        >
                          {g.title}
                        </h3>
                        {g.description && (
                          <p className="text-[12px] text-gray-500 line-clamp-3 leading-snug">
                            {g.description}
                          </p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[11px] text-gray-500 tracking-wide">
                          <span className="font-mono">
                            {g.unitsCompleted}/{g.unitsToBeCompleted} units
                          </span>
                          <span className="font-mono">
                            {Math.round(g.pct)}%
                          </span>
                        </div>
                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full ${widthClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4">
                    <p className="text-[12px] text-blue-700 leading-relaxed">
                      {goalComment(Math.round(g.pct))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
