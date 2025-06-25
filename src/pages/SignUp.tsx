import { Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../utils/Firebase";

interface UserdataInterface {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  termsAgreed: boolean;
}

export default function SignUpScreen() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserdataInterface>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    termsAgreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  function signUpHandler(e: React.FormEvent) {
    e.preventDefault();
    // Example validation
    if (userData.password !== userData.confirmPassword) {
      toast.error("Password do not match");
      return;
    }

    if (!userData.termsAgreed) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    if (
      userData.fullName === "" ||
      userData.email === "" ||
      userData.phoneNumber === "" ||
      userData.password === "" ||
      userData.confirmPassword === ""
    ) {
      toast.error("All fields must be filled out.");
      return;
    }

    createUserWithEmailAndPassword(auth, userData.email, userData.password)
      .then((userCredential) => {
        const user = userCredential.user;

        try {
          setDoc(doc(db, "Users", user.uid), {
            fullName: userData.fullName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            termsAgreed: userData.termsAgreed,
            createdAt: new Date().toISOString(), // Adding time
          });

          toast.success("Account created successfully !");
          navigate("/Home");
        } catch (error: any) {
          toast.error(`${error.message}`);
        }

        // ...
      })
      .catch((error) => {
        toast.error(`Error: ${error.message}`);
      });
  }

  function showPasswordHandler() {
    setShowPassword(!showPassword);
    toast.info("Password visibility toggled");
  }

  return (
    <div className="flex flex-col items-center w-12/12  ">
      <div className="mx-2 my-4">
        <p className="font-mono font-bold text-4xl ">Create Your Account</p>
      </div>

      <div className=" flex flex-col w-8/12 ">
        <form action="">
          <fieldset className="flex flex-col items-center">
            <div className="flex flex-col mx-1 my-2 w-5/12 ">
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                Full Name
              </label>
              <input
                className="  border-2 px-2 py-1 rounded-lg border-gray-300 "
                type="text"
                required
                placeholder="Enter your full name"
                value={userData.fullName}
                onChange={(e) =>
                  setUserData({ ...userData, fullName: e.target.value })
                }
              />
            </div>

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

            <div className="flex flex-col mx-1 my-2 w-5/12 ">
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                Phone Number
              </label>

              <input
                className="  border-2 px-2 py-1 rounded-lg border-gray-300 "
                type="text"
                required
                placeholder="Enter your Phone Number"
                value={userData.phoneNumber}
                onChange={(e) =>
                  setUserData({ ...userData, phoneNumber: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                Password
              </label>
              <div className="flex flex-row items-center">
                <input
                  className="  border-2 px-2 py-1 rounded-lg border-gray-300 w-12/12 "
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={userData.password}
                  required
                  onChange={(e) =>
                    setUserData({ ...userData, password: e.target.value })
                  }
                />
                <div onClick={showPasswordHandler}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                Confirm Password
              </label>
              <div className="flex flex-row items-center">
                <input
                  className="  border-2 px-2 py-1 rounded-lg border-gray-300 w-12/12  "
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={userData.confirmPassword}
                  required
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      confirmPassword: e.target.value,
                    })
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
                checked={userData.termsAgreed}
                required
                onChange={(e) =>
                  setUserData({ ...userData, termsAgreed: e.target.checked })
                }
              />
              <label className="mx-1 my-2 font-bold text-xl " htmlFor="">
                I agree to the Terms & Conditions
              </label>
            </div>

            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <button
                type="submit"
                onClick={signUpHandler}
                className=" bg-blue-400 rounded-4xl px-2 py-2 hover:bg-blue-700 "
              >
                Sign Up
              </button>
            </div>

            <div className="flex flex-col mx-1 my-2 w-5/12  ">
              <Link
                to={"/"}
                className="text-gray-500 text-center  hover:text-blue-500 "
              >
                Already have an account? Log in
              </Link>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
