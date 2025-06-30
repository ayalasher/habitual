import { MdOutlineAttractions } from "react-icons/md";

export default function FocusScreen() {
  return (
    <div className="flex flex-col items-center h-screen w-12/12 ">
      <div className="flex flex-col w-8/12">
        <p className="font-bold text-3xl py-2 my-2 font-mono ">Focus</p>
        <p className="text-gray-400 font-medium font-mono">
          Set your daily tasks and use the task timer to manage work sessions
          effectively.
        </p>
      </div>
      <div className="flex flex-col w-8/12">
        <p className="font-bold text-xl py-4 my-4 font-mono ">Today's Tasks</p>
      </div>
    </div>
  );
}
