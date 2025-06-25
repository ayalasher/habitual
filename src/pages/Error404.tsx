import { Link } from "react-router-dom";
export default function Error404Screen() {
  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-center font-bold text-4xl font-mono">
        Ooops ! page not found
      </p>
      <p className="text-center">
        The page you are looking for does not exist or has been moved .
      </p>
      <Link
        className="  flex flex-col items-center justify-center text-center rounded-lg bg-blue-400 px-3 py-1.5 mx-3 my-1.5"
        to={"/Home"}
      >
        Go to home
      </Link>
    </div>
  );
}
