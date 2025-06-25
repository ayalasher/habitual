import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import ReactLoading from "react-loading";
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

  useEffect(() => {
    if (currentUser) {
      async function getapi() {
        const options = {
          method: "GET",
          url: "https://quotes-inspirational-quotes-motivational-quotes.p.rapidapi.com/quote",
          params: {
            token: "ipworld.info",
          },
          headers: {
            "x-rapidapi-key":
              "4f2abe3dc3msh815fb3afb4ca166p167c42jsna2f5bc555856",
            "x-rapidapi-host":
              "quotes-inspirational-quotes-motivational-quotes.p.rapidapi.com",
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

      // const api_url = "https://zenquotes.io/api/today/";
      getapi();
      toast.info(`UUID${currentUser.uid}`);
    } else {
      toast.error("You must be logged in to view the homepage");
      navigate("/");
    }
  }, []);
  return (
    <div className="flex flex-col">
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
              {" "}
              {todaysQuote.author}{" "}
            </p>
          </div>
        ) : (
          <p className="text-center">No quote available</p>
        )}
      </div>

      <div>
        <div>
          <p>My goals</p>
        </div>
        <div>
          <p>Goals set here</p>
        </div>
      </div>
    </div>
  );
}
