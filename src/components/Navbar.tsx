import { MdOutlineAttractions } from "react-icons/md";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="flex flex-row  items-center justify-between border-2 border-gray-200 ">
      <div className=" flex flex-row justify-start items-start ">
        <div className="flex flex-row items-center justify-center px-1 py-2 mx-2 my-4 ">
          <MdOutlineAttractions size={45} color="#47b4ea" />
          <p className="font-bold font-mono text-2xl text-black-900">
            Habitual
          </p>
        </div>
      </div>
      <div className="flex flex-row items-end justify-end">
        <div className="flex flex-row items-center justify-center px-1 py-2 mx-2 my-4 ">
          <Link to={"/Home"} className="font-mono text-lg px-2 py-2 mx-2 my-4 ">
            Home
          </Link>
          <Link
            to={"/Focus"}
            className="font-mono text-lg px-1 py-2 mx-2 my-4 "
          >
            Focus
          </Link>
          <Link
            to={"/Goals"}
            className="font-mono text-lg px-1 py-2 mx-2 my-4 "
          >
            Goals
          </Link>
          <Link
            to={"/Profile"}
            className="font-mono text-lg px-1 py-2 mx-2 my-4 "
          >
            Profile
          </Link>
          <Link
            to={"/Progress-Analytics"}
            className="font-mono text-lg px-1 py-2 mx-2 my-4 "
          >
            Analytics
          </Link>
          <Link
            to={"/Friends"}
            className="font-mono text-lg px-1 py-2 mx-2 my-4 "
          >
            Friends
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
