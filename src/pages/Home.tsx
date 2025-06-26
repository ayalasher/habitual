import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface Quote {
  author: string;
  text: string;
}

export default function HomeScreen() {
  const [todaysQuote, setTodaysquote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const url = import.meta.env.VITE_URL;
  const x_rapidapi_key = import.meta.env.VITE_X_RAPID_API_KEY;
  const x_rapidapi_host = import.meta.env.VITE_X_RAPID_API_HOST;

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
      getapi();
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
          <p className="text-center">Loading...</p>
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
          <div>
            <p className="font-bold text-3xl font-mono ">My goals</p>
          </div>
          <div>
            <p>Goals set here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
