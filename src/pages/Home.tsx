import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import { db } from "../utils/Firebase";
import { collection, getDocs } from "firebase/firestore";

interface Quote {
  author: string;
  text: string;
}

interface newGoal {
  title: string;
  Description: string;
}

export default function HomeScreen() {
  const [todaysQuote, setTodaysquote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<newGoal[]>([]);
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const url = import.meta.env.VITE_URL;
  const x_rapidapi_key = import.meta.env.VITE_X_RAPID_API_KEY;
  const x_rapidapi_host = import.meta.env.VITE_X_RAPID_API_HOST;

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
    if (currentUser) {
      async function getapi() {
        const options = {
          method: "GET",
          url: `${url}`,
          params: {
            token: "ipworld.info",
          },
          headers: {
            "x-rapidapi-key": `${x_rapidapi_key}`,
            "x-rapidapi-host": `${x_rapidapi_host}`,
          },
        };
        try {
          setLoading(true);
          const response = await axios.request(options);
          setTodaysquote(response.data);
          setLoading(false);
        } catch (error: any) {
          setLoading(false);
          toast.error(`An error occured getting today's inspiration.`);
        }
      }

      async function getGoals(userID: string) {
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
        } catch (error) {
          toast.error(
            "An error occurred when fetching goals . Refresh the page to try again ."
          );
        }
      }
      getapi();
      getGoals(currentUser.uid);
    } else {
      toast.error("You must be logged in to view the homepage");
      navigate("/");
    }
  }, []);
  return (
    <div className="flex flex-col w-12/12  h-screen  ">
      <div>
        <p className="text-center font-bold text-3xl font-mono my-3 px-2 py-2 ">
          Today's Inspiration
        </p>
        {loading ? (
          <div className="flex flex-col items-center w-11/12 justify-center">
            <BeatLoader />
          </div>
        ) : todaysQuote ? (
          <div>
            <p className="text-center"> " {todaysQuote.text} " </p>
            <p className="text-center font-semibold italic   ">
              {todaysQuote.author}
            </p>
          </div>
        ) : (
          <p className="text-center">No quote available</p>
        )}
      </div>
      <div className="flex flex-col items-center">
        <div className=" w-8/12  ">
          <div className="flex flex-row items-center justify-between">
            <p className="font-bold text-3xl font-mono ">My goals</p>
            <Link to={"/Focus"}>
              <button className="py-3 my-3 px-4 text-center bg-blue-400 rounded-lg">
                Focus 🚀
              </button>
            </Link>
          </div>
          <div>
            <GoalsComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
