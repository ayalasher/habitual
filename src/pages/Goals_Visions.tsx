import { useState, useEffect } from "react";
import { db } from "../utils/Firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";

interface Goal {
  id?: string;
  title: string;
  description: string;
  unitsToBeCompleted: number;
  unitsCompleted: number;
  createdAt?: any;
}

export default function GoalsVisionsScreen() {
  const [newGoal, setNewGoal] = useState<Goal>({
    title: "",
    description: "",
    unitsToBeCompleted: 0,
    unitsCompleted: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserData = auth.currentUser;
  const currentUserId = currentUserData?.uid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("User not authenticated");
      navigate("/");
      return;
    }
    if (!newGoal.title.trim()) {
      toast.error("Goal title required");
      return;
    }
    if (!newGoal.description.trim()) {
      toast.error("Goal description required");
      return;
    }
    if (newGoal.unitsToBeCompleted <= 0) {
      toast.error("Units to be completed must be > 0");
      return;
    }
    try {
      setSubmitting(true);
      if (editingGoalId) {
        await updateDoc(
          doc(db, "Users", currentUserId, "Goals", editingGoalId),
          {
            title: newGoal.title.trim(),
            Description: newGoal.description.trim(),
            unitsToBeCompleted: newGoal.unitsToBeCompleted,
            unitsCompleted: newGoal.unitsCompleted,
          }
        );
        toast.success("Goal updated");
      } else {
        await addDoc(collection(db, "Users", currentUserId, "Goals"), {
          title: newGoal.title.trim(),
          Description: newGoal.description.trim(),
          unitsToBeCompleted: newGoal.unitsToBeCompleted,
          unitsCompleted: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Goal added");
      }
      setNewGoal({
        title: "",
        description: "",
        unitsToBeCompleted: 0,
        unitsCompleted: 0,
      });
      setEditingGoalId(null);
      fetchGoals(currentUserId);
    } catch (e) {
      toast.error("Error saving goal");
    } finally {
      setSubmitting(false);
    }
  }

  function requestDelete(goal: Goal) {
    setGoalToDelete(goal);
  }

  async function confirmDeleteGoal() {
    if (!currentUserId || !goalToDelete?.id) {
      setGoalToDelete(null);
      return;
    }
    try {
      setDeleting(true);
      await deleteDoc(
        doc(db, "Users", currentUserId, "Goals", goalToDelete.id)
      );
      if (editingGoalId === goalToDelete.id) {
        setEditingGoalId(null);
        setNewGoal({
          title: "",
          description: "",
          unitsToBeCompleted: 0,
          unitsCompleted: 0,
        });
      }
      toast.success("Goal deleted");
      setGoalToDelete(null);
      fetchGoals(currentUserId);
    } catch (e) {
      toast.error("Error deleting goal");
    } finally {
      setDeleting(false);
    }
  }

  function cancelDeleteGoal() {
    if (deleting) return;
    setGoalToDelete(null);
  }

  function startEdit(goal: Goal) {
    setEditingGoalId(goal.id || null);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      unitsToBeCompleted: goal.unitsToBeCompleted,
      unitsCompleted: goal.unitsCompleted,
    });
  }

  function GoalsComponent() {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <BeatLoader />
        </div>
      );
    }
    if (goals.length === 0) {
      return (
        <div className="text-center py-10 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
          No goals yet. Add your first goal above.
        </div>
      );
    }
    return (
      <ul className="grid md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const pct = goal.unitsToBeCompleted
            ? Math.min(
                100,
                Math.round(
                  (goal.unitsCompleted / goal.unitsToBeCompleted) * 100
                )
              )
            : 0;
          const progressWidthClass = (() => {
            const steps = [
              0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
              85, 90, 95, 100,
            ];
            const nearest = steps.reduce(
              (prev, curr) =>
                Math.abs(curr - pct) < Math.abs(prev - pct) ? curr : prev,
              0
            );
            if (nearest === 100) return "w-full";
            return `w-[${nearest}%]`;
          })();
          return (
            <li
              key={goal.id}
              className="relative rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg font-mono">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {goal.description || goal.description === ""
                      ? goal.description
                      : goal.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {goal.unitsCompleted}/{goal.unitsToBeCompleted} units
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all ${progressWidthClass}`}
                  />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => startEdit(goal)}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => requestDelete(goal)}
                  className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }
  async function fetchGoals(userID: string) {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "Users", userID, "Goals"));
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
      toast.error("Error fetching goals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentUserId) {
      fetchGoals(currentUserId);
    }
  }, [currentUserId]);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-10">
      <header className="space-y-2">
        <h1 className="font-mono text-3xl font-bold">Goals</h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl">
          Set and manage measurable goals. Track your progress and stay aligned
          with your mission.
        </p>
      </header>

      <section className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <h2 className="font-mono font-semibold text-xl mb-2">
              {editingGoalId ? "Edit Goal" : "Add Goal"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="goalTitle" className="text-sm font-medium">
                  Goal Title
                </label>
                <input
                  id="goalTitle"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., Run 50 km this month"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, title: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="goalDesc" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="goalDesc"
                  className="w-full min-h-[90px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                  placeholder="Describe how you'll achieve it"
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, description: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="goalUnits" className="text-sm font-medium">
                    Total Units
                  </label>
                  <input
                    id="goalUnits"
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="100"
                    value={newGoal.unitsToBeCompleted}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        unitsToBeCompleted: Number(e.target.value),
                      })
                    }
                    disabled={submitting}
                  />
                </div>
                {editingGoalId && (
                  <div className="space-y-2">
                    <label
                      htmlFor="goalUnitsDone"
                      className="text-sm font-medium"
                    >
                      Units Done
                    </label>
                    <input
                      id="goalUnitsDone"
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={newGoal.unitsCompleted}
                      onChange={(e) =>
                        setNewGoal({
                          ...newGoal,
                          unitsCompleted: Number(e.target.value),
                        })
                      }
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <BeatLoader size={6} color="#fff" />}
                  <span>{editingGoalId ? "Update Goal" : "Add Goal"}</span>
                </button>
                {editingGoalId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGoalId(null);
                      setNewGoal({
                        title: "",
                        description: "",
                        unitsToBeCompleted: 0,
                        unitsCompleted: 0,
                      });
                    }}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="font-mono font-semibold text-xl">My Goals</h2>
          <GoalsComponent />
        </div>
      </section>

      {goalToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl bg-white shadow-lg p-6 space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold font-mono">Delete Goal</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-medium">"{goalToDelete.title}"</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelDeleteGoal}
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmDeleteGoal}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <BeatLoader size={6} color="#fff" />}
                <span>{deleting ? "Deleting..." : "Yes, delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
