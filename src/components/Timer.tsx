import React from "react";
import { useTimer } from "react-timer-hook";
import { useState } from "react";
import { toast } from "react-toastify";

function MyTimer({ expiryTimestamp }: any) {
  const {
    totalSeconds,
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp,
    onExpire: () => console.warn("onExpire called"),
    interval: 20,
  });
  const [Timerminutes, setTimerMinutes] = useState<number>(0);
  return (
    <div style={{ textAlign: "center" }}>
      <div>
        <label className="px-2 mx-2 font-semibold text-2xl " htmlFor="Minutes">
          Minutes
        </label>
        <input
          className="border-2 border-gray-300 py-4 px-2 mx-2 rounded-2xl"
          type="number"
          placeholder="Enter"
          value={Timerminutes}
          // Setting e.target.value as a number
          onChange={(e) => setTimerMinutes(Number(e.target.value))}
        />
        <div>
          <p>
            Set the number of minutes you would like to work on an item click
            restart
          </p>
        </div>
      </div>
      <div style={{ fontSize: "100px" }}>
        {/* <span>{days}</span>:<span>{hours}</span>: */}
        <span>{minutes}</span>:<span>{seconds}</span>
      </div>
      <p>{isRunning ? "Running" : "Not running"}</p>

      <button
        className="px-4 py-2 mx-4 my-2 bg-blue-400 rounded-3xl "
        onClick={pause}
      >
        Pause
      </button>
      <button
        className="px-4 py-2 mx-4 my-2 bg-blue-400 rounded-3xl "
        onClick={resume}
      >
        Resume
      </button>
      <button
        className="px-4 py-2 mx-4 my-2 bg-blue-400 rounded-3xl "
        onClick={() => {
          // Restarts to 5 minutes timer
          const time = new Date();
          if (Timerminutes === 0) {
            toast.error("Minutes cannot be 0.");
          }
          time.setSeconds(time.getSeconds() + Timerminutes * 60);
          restart(time);
        }}
      >
        Start timer
      </button>
    </div>
  );
}

export default function TimerComponent() {
  const time = new Date();
  // time.setSeconds(time.getSeconds() + 600); // 10 minutes timer
  return (
    <div>
      <MyTimer expiryTimestamp={time} />
    </div>
  );
}
