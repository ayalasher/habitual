import { Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
export default function LogInScreen() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const auth = getAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  function loginHandler(e: React.FormEvent) {
    e.preventDefault();

    if (userData.email === "" || userData.password === "") {
      toast.error("Email and password must be filled out.");
      return;
    }

    signInWithEmailAndPassword(auth, userData.email, userData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        navigate("/Home");
      })
      .catch((error) => {
        toast.error(`Error:${error.message}`);
      });
  }

  function showPasswordHandler() {
    setShowPassword(!showPassword);
    toast.info("Password visibility toggled");
  }
  return (
    <div className="flex flex-col items-center">
      <div className="mx-2 my-4">
        <p className="font-mono font-bold text-4xl ">Welcome back</p>
      </div>

      <div className="w-12/12 flex flex-col ">
        <form action="">
          <fieldset className="flex flex-col items-center">
            <div className="flex flex-col mx-1 my-2 w-5/12 ">
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                Email
              </label>
              <input
                className="  border-2 px-2 py-1 rounded-lg border-gray-300 "
                type="email"
                required
                placeholder="Enter your email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                password
              </label>

              <div className="flex flex-row items-center ">
                <input
                  className="  border-2 px-2 py-1 rounded-lg border-gray-300 w-12/12 "
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={userData.password}
                  onChange={(e) =>
                    setUserData({ ...userData, password: e.target.value })
                  }
                />
                <div onClick={showPasswordHandler}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <div className="flex flex-row mx-1 my-2 w-5/12  ">
              <input
                className="mx-1 my-2 font-bold text-2xl "
                type="checkbox"
                required
                checked={userData.rememberMe}
                onChange={(e) =>
                  setUserData({ ...userData, rememberMe: e.target.checked })
                }
              />
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                Remember Me
              </label>
            </div>

            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <button
                type="submit"
                onClick={loginHandler}
                className=" bg-blue-200 rounded-4xl px-2 py-2 hover:bg-blue-400 "
              >
                Login
              </button>
            </div>

            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <Link
                to={"/recover-password"}
                className="text-gray-500 text-center  hover:text-blue-500 "
              >
                Forgot password.
              </Link>
              <Link
                to={"/SignUp"}
                className="text-gray-500 text-center  hover:text-blue-500 "
              >
                Don't have an account ? Sign up
              </Link>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
