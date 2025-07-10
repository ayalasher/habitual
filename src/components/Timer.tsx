import React, { useState, useEffect, useRef } from "react";

const Timer = () => {
  const [minutes, setMinutes] = useState<number>(25); // default value
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(25);
    setSeconds(0);
  };

  const handleCustomTime = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customMinutes = Number(formData.get("customMinutes"));
    setMinutes(customMinutes);
    setSeconds(0);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 0) {
            if (minutes === 0) {
              clearInterval(intervalRef.current!);
              setIsRunning(false);
              return 0;
            } else {
              setMinutes((prev) => prev - 1);
              return 59;
            }
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, minutes]);

  return (
    <div className="p-4 text-center">
      <h2 className="text-4xl font-bold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </h2>

      <div className="space-x-2 mt-4">
        <button
          onClick={handleStart}
          className="bg-green-500 px-4 py-2 rounded text-white"
        >
          Start
        </button>
        <button
          onClick={handlePause}
          className="bg-yellow-500 px-4 py-2 rounded text-white"
        >
          Pause
        </button>
        <button
          onClick={handleReset}
          className="bg-red-500 px-4 py-2 rounded text-white"
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleCustomTime} className="mt-4">
        <input
          name="customMinutes"
          type="number"
          min={1}
          className="border px-2 py-1"
          placeholder="Minutes"
        />
        <button
          type="submit"
          className="ml-2 bg-blue-500 px-4 py-1 rounded text-white"
        >
          Set
        </button>
      </form>
    </div>
  );
};

export default Timer;
