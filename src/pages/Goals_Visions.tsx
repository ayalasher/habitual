import { useState, useEffect } from "react";
import { db } from "../utils/Firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";

interface newGoal {
  title: string;
  Description: string;
  unitsToBeCompleted?: number;
  unitsCompleted?: number;
}

export default function GoalsVisionsScreen() {
  const [newGoal, setNewGoal] = useState<newGoal>({
    title: "",
    Description: "",
    unitsToBeCompleted: 0,
    unitsCompleted: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [goals, setGoals] = useState<newGoal[]>([]);
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserData = auth.currentUser;
  const currentUserId = currentUserData?.uid;

  function addNewGoalHandler() {
    async function addnewGoalAccodrdingToTheUid(
      userId: string,
      habitData: newGoal
    ) {
      if (!userId) {
        toast.error("Users is not authenticated");
        navigate("/");
      }
      try {
        const goals_reference = collection(db, "Users", userId, "Goals");
        const docRef = await addDoc(goals_reference, habitData);
        if (docRef) {
          toast.success("New goal added succesfully.");
          setNewGoal({
            title: "",
            Description: "",
            unitsToBeCompleted: 0,
            unitsCompleted: 0,
          });
        }
      } catch (error: any) {
        toast.error("Error adding a new goal Goal.Try again.");
      }
    }
    if (currentUserId) {
      addnewGoalAccodrdingToTheUid(currentUserId, newGoal);
    } else {
      toast.error("User is not authenticated");
      navigate("/");
    }
  }

  function GoalsComponent() {
    if (loading) {
      return (
        <div className="flex flex-col items-center w-11/12 justify-center">
          <BeatLoader />
        </div>
      );
    }

    if (goals.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No Goals yet. Add your first goal 👆🏼</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div
            key={index}
            className="border-2 border-gray-300 rounded-md p-4 my-2"
          >
            <h3 className="font-bold text-lg">{goal.title}</h3>
            <p className="text-gray-600">{goal.Description}</p>
          </div>
        ))}
      </div>
    );
  }
  useEffect(() => {
    setLoading(true);
    async function getUserGoals(userID: string) {
      try {
        const docRef = collection(db, "Users", userID, "Goals");
        const docSnap = await getDocs(docRef);
        const userGoals: newGoal[] = [];
        docSnap.forEach((doc) => {
          userGoals.push({
            title: doc.data().title,
            Description: doc.data().Description,
          } as newGoal);
        });
        setGoals(userGoals);
        setLoading(false);
        // console.log(userGoals);
      } catch (error) {
        toast.error("Error fetching user goals . Please try again later.");
      }
    }
    if (currentUserId) {
      getUserGoals(currentUserId);
    } else {
      toast.error("User is not authenticated");
    }
  }, [currentUserId]);
  return (
    <div className="h-screen  flex flex-col items-center ">
      <div className="w-10/12 ">
        <p className="font-bold text-3xl font-mono  py-1.5  my-1 ">Goals</p>
        <p className="text-gray-400 font-medium font-mono">
          Set and manage your goals to achieve your mission
        </p>

        <p className="font-bold text-xl font-mono  py-1.5  my-1 ">
          Set new goal
        </p>
        <form action="post">
          <fieldset>
            <div>
              <div className="flex flex-col ">
                <label
                  className="font-bold text-lg font-mono  py-1.5  my-1 "
                  htmlFor=""
                >
                  Goal title
                </label>
                <input
                  className="rounded-md border-2 border-gray-300 px-2 py-1.5 font-mono w-6/12 "
                  type="text"
                  placeholder="e.g., Learn a new language "
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, title: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col ">
                <label
                  className="font-bold text-lg font-mono  py-1.5  my-1 "
                  htmlFor=""
                >
                  Goal description
                </label>
                <input
                  className="rounded-md border-2 border-gray-300 px-2 py-1.5 font-mono w-6/12 "
                  type="text"
                  placeholder="Describe your goal in detail.  "
                  value={newGoal.Description}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, Description: e.target.value })
                  }
                />
              </div>

              <div>
                <button
                  className="py-3 my-3 px-4 text-center bg-blue-400 rounded-lg"
                  onClick={addNewGoalHandler}
                  type="button"
                >
                  Add goal
                </button>
              </div>

              <div className="flex flex-col  ">
                <p className="font-bold text-2xl font-mono py-2 my-4 ">
                  My goals
                </p>
                <GoalsComponent />
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
