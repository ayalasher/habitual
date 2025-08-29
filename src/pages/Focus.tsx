import React, { useState, useEffect, useCallback } from "react";
import { db } from "../utils/Firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import TimerComponent from "../components/Timer";

interface FocusItem {
  id?: string;
  title: string;
  done?: boolean;
  createdAt?: any;
  day?: "Today" | "Tomorrow";
}

type DayChoice = "Today" | "Tomorrow" | "";

export default function FocusScreen() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const navigate = useNavigate();

  const [todayTasks, setTodayTasks] = useState<FocusItem[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<FocusItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dayOfTask, setDayOfTask] = useState<DayChoice>("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [taskToDelete, setTaskToDelete] = useState<FocusItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Map the displayed day to the actual (legacy) collection key used in Firestore.
  const collectionKey = (day: "Today" | "Tomorrow") =>
    day === "Tomorrow" ? "Tommorrow" : "Today"; // preserve existing misspelling in DB

  const fetchTasks = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const [todaySnap, tomorrowSnap] = await Promise.all([
        getDocs(collection(db, "Users", currentUserId, "Today")),
        getDocs(collection(db, "Users", currentUserId, "Tommorrow")),
      ]);
      const today: FocusItem[] = [];
      todaySnap.forEach((d) =>
        today.push({
          id: d.id,
          title: d.data().title,
          done: d.data().done,
          day: "Today",
        })
      );
      const tomorrow: FocusItem[] = [];
      tomorrowSnap.forEach((d) =>
        tomorrow.push({
          id: d.id,
          title: d.data().title,
          done: d.data().done,
          day: "Tomorrow",
        })
      );
      setTodayTasks(today);
      setTomorrowTasks(tomorrow);
    } catch (e) {
      toast.error("Failed to load focus tasks");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchTasks();
  }, [currentUserId, fetchTasks]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("User not authenticated");
      navigate("/");
      return;
    }
    if (!newTaskTitle.trim()) {
      toast.error("Task title required");
      return;
    }
    if (dayOfTask !== "Today" && dayOfTask !== "Tomorrow") {
      toast.error("Select a day for the task");
      return;
    }
    try {
      setSubmitting(true);
      const ref = collection(
        db,
        "Users",
        currentUserId,
        collectionKey(dayOfTask)
      );
      await addDoc(ref, {
        title: newTaskTitle.trim(),
        done: false,
        createdAt: serverTimestamp(),
      });
      toast.success("Task added");
      setNewTaskTitle("");
      setDayOfTask("");
      fetchTasks();
    } catch (e) {
      toast.error("Error adding task");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: FocusItem) {
    if (!currentUserId || !task.id || !task.day) return;
    try {
      await updateDoc(
        doc(db, "Users", currentUserId, collectionKey(task.day), task.id),
        { done: !task.done }
      );
      fetchTasks();
    } catch (e) {
      toast.error("Failed to update task");
    }
  }

  function requestDelete(task: FocusItem) {
    setTaskToDelete(task);
  }

  async function confirmDelete() {
    if (!currentUserId || !taskToDelete?.id || !taskToDelete.day) {
      setTaskToDelete(null);
      return;
    }
    try {
      setDeleting(true);
      await deleteDoc(
        doc(
          db,
          "Users",
          currentUserId,
          collectionKey(taskToDelete.day),
          taskToDelete.id
        )
      );
      toast.success("Task deleted");
      setTaskToDelete(null);
      fetchTasks();
    } catch (e) {
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    if (deleting) return; // prevent closing while in flight
    setTaskToDelete(null);
  }

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      {message}
    </div>
  );

  const TaskList = ({
    title,
    tasks,
  }: {
    title: string;
    tasks: FocusItem[];
  }) => (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold font-mono">
        {title}
        <span className="text-xs font-normal bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <BeatLoader size={10} />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState message={`No tasks for ${title.toLowerCase()}.`} />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`group relative rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                t.done ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTask(t)}
                  aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                  className={`mt-1 h-5 w-5 rounded border flex items-center justify-center text-xs font-bold transition ${
                    t.done
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {t.done && "✓"}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${t.done ? "line-through" : ""}`}>
                    {t.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.done ? "Completed" : "Pending"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => requestDelete(t)}
                  aria-label="Delete task"
                  className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-600 p-1 rounded focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <span className="text-xs font-semibold">✕</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-10">
      <header className="space-y-2">
        <h1 className="font-mono text-3xl font-bold">Focus</h1>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl">
          Set your daily focus tasks and track them with the integrated timer to
          optimize your productivity.
        </p>
      </header>

      <section className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-10">
          <TaskList title="Today" tasks={todayTasks} />
          <TaskList title="Tomorrow" tasks={tomorrowTasks} />
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <h2 className="font-mono font-semibold text-xl mb-2">
              Add Focus Task
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Choose a day and add one clear task you intend to complete.
            </p>
            <form onSubmit={handleAddTask} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="taskTitle" className="text-sm font-medium">
                  Task Title
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., Deep work session"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="taskDay" className="text-sm font-medium">
                  Day
                </label>
                <select
                  id="taskDay"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={dayOfTask}
                  onChange={(e) => setDayOfTask(e.target.value as DayChoice)}
                  disabled={submitting}
                >
                  <option value="">Select day</option>
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                </select>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <BeatLoader size={6} color="#fff" />}
                  <span>{submitting ? "Adding..." : "Add Task"}</span>
                </button>
              </div>
            </form>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <h2 className="font-mono font-semibold text-xl mb-4">Timer</h2>
            <TimerComponent />
          </div>
        </div>
      </section>

      {taskToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl bg-white shadow-lg p-6 space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold font-mono">Delete Task</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-medium">"{taskToDelete.title}"</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
