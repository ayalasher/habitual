import { MdOutlineAttractions } from "react-icons/md";
import React, { useState, useEffect } from "react";
import { db } from "../utils/Firebase";
import { doc, collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Timer from "../components/Timer";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";

interface focusItem {
  title: string;
  done?: boolean;
  createdAt?: string;
}

export default function FocusScreen() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const [todaysFocusTask, setTodaysFocusTask] = useState<focusItem[]>([]);
  const [tommorowsFocusTask, setTommorrowsFocusTask] = useState<focusItem[]>(
    []
  );
  const navigate = useNavigate();
  const [newFocus, setNewFocus] = useState<focusItem>({
    title: "",
    done: false,
  });
  const [dayOftask, setDayOfTask] = useState<"Today" | "Tommorrow" | "">("");
  const [loading, setLoading] = useState<boolean>(true);

  async function addNewTodayTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (newFocus.title === "") {
        toast.error("The task cannot be empty");
        return;
      }

      if (dayOftask !== "Today" && dayOftask !== "Tommorrow") {
        toast.error("Set the task as a today or tommorrow one.");
        return;
      }

      if (!currentUserId) {
        toast.error("User not authenticated");
        navigate("/");
        return;
      }

      const focusTaskReffernce = collection(
        db,
        "Users",
        currentUserId,
        `${dayOftask}`
      );
      const taskRef = await addDoc(focusTaskReffernce, newFocus);
      if (taskRef) {
        toast.success("Task succesfully added");
        setDayOfTask("");
        setNewFocus({ title: "", done: false });
      }
    } catch (error: unknown) {
      toast.error("An error occurred when adding a focus task.");
    }
  }

  function TodaysTasksComponent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center w-11/12 justify-center">
          <BeatLoader />
        </div>
      );
    }

    if (todaysFocusTask.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">
            No Focus Tasks for Today.Set your first 👉🏼
          </p>
        </div>
      );
    }
    return (
      <div>
        {todaysFocusTask.map((Todaytask, index) => (
          <div
            key={index}
            className="border-2 border-gray-300 rounded-md p-4 my-2"
          >
            <h3 className="font-bold text-lg">{Todaytask.title}</h3>
            <p className="text-gray-600">
              {Todaytask.done ? "Task completed." : "Task is incomplete."}
            </p>
          </div>
        ))}
      </div>
    );
  }

  function TommorrowsTasksComponent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center w-11/12 justify-center">
          <BeatLoader />
        </div>
      );
    }

    if (tommorowsFocusTask.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">
            No Focus Tasks for Tommorrow.Set your first 👆🏼
          </p>
        </div>
      );
    }
    return (
      <div>
        {tommorowsFocusTask.map((TommorrowTask, index) => (
          <div
            key={index}
            className="border-2 border-gray-300 rounded-md p-4 my-2"
          >
            <h3 className="font-bold text-lg">{TommorrowTask.title}</h3>
            <p className="text-gray-600">
              {TommorrowTask.done ? "Task completed." : "Task is incomplete."}
            </p>
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    // Fetchinf today's and tommorrow's focus tasks
    async function FetchTodaysAndTommorowsFocusTasks() {
      try {
        setLoading(true);
        if (!currentUser) {
          toast.error("Current user is not defined.");
          navigate("/");
          return;
        }
        if (!currentUserId) {
          toast.error("The user is not authenticated to be here.");
          navigate("/");
          return;
        }
        const TodayDocsRef = collection(db, "Users", currentUserId, "Today");
        const TommorrowDocsref = collection(
          db,
          "Users",
          currentUserId,
          "Tommorrow"
        );
        const TodaysDocsSnap = await getDocs(TodayDocsRef);
        const TommorowsDocsSnap = await getDocs(TommorrowDocsref);
        const TodayGoals: focusItem[] = [];
        const TommorowsGoals: focusItem[] = [];
        TodaysDocsSnap.forEach((doc) => {
          TodayGoals.push({
            title: doc.data().title,
            done: doc.data().done,
          } as focusItem);
        });

        TommorowsDocsSnap.forEach((doc) => {
          TommorowsGoals.push({
            title: doc.data().title,
            done: doc.data().done,
          });
        });
        setTodaysFocusTask(TodayGoals);
        setTommorrowsFocusTask(TommorowsGoals);
        setLoading(false);
      } catch (error: unknown) {
        toast.error("An error occurred when fechting set Focus Tasks.");
      }
    }

    FetchTodaysAndTommorowsFocusTasks();
  }, [currentUserId]);
  return (
    <div className="flex flex-col items-center h-screen w-12/12 ">
      <div className="flex flex-col w-8/12">
        <p className="font-bold text-3xl py-2 my-2 font-mono ">Focus</p>
        <p className="text-gray-400 font-medium font-mono">
          Set your daily tasks and use the task timer to manage work sessions
          effectively.
        </p>
      </div>
      <div className="flex flex-row w-8/12">
        <div className="flex flex-col w-6/12">
          <p className="font-bold text-xl py-4 my-4 font-mono ">
            Today's Tasks
          </p>
          <TodaysTasksComponent />
        </div>
        <div className="flex flex-col w-6/12">
          <p className="font-semibold text-xl py-4 my-4 font-mono ">
            Add focus Item for this day.
          </p>
          <form action="">
            <fieldset>
              <div className="py-3 my-3 mx-2 flex flex-col ">
                <label className="px-2 mx-2" htmlFor="">
                  Task Focus
                </label>
                <input
                  className="border-2 border-gray-300 py-4 px-2 mx-2 rounded-2xl"
                  type="text"
                  placeholder="Enter a task you want to focus on."
                  value={newFocus.title}
                  onChange={(e) =>
                    setNewFocus({
                      ...newFocus,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="py-3 my-3 mx-2 flex flex-col ">
                <label className="px-2 mx-2" htmlFor="">
                  Choose the day of the task
                </label>
                <select
                  className="border-2 border-gray-300 py-4 px-2 mx-2 rounded-2xl"
                  name="days"
                  id="days"
                  title="Select day of the task"
                  value={dayOftask}
                  defaultValue={""}
                  onChange={(e) =>
                    setDayOfTask(
                      (e.target.value as "Today") || "Tommorrow" || ""
                    )
                  }
                >
                  <option value="" disabled>
                    Select a day
                  </option>
                  <option value="Today">Today</option>
                  <option value="Tommorrow">Tommorrow</option>
                </select>
              </div>
              <div className="py-3 my-3 mx-2 flex flex-col ">
                <button
                  className="py-3 my-3 px-4 text-center bg-blue-400 rounded-lg"
                  type="submit"
                  onClick={addNewTodayTask}
                >
                  Add task
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
      <div>
        <p>The Timer going to be here.</p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <p className="font-bold text-xl py-4 my-4 font-mono ">
          Tommorrows tasks
        </p>
        <TommorrowsTasksComponent />
      </div>
    </div>
  );
}
