import { getAuth, signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { db } from "../utils/Firebase";
import { getDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { BeatLoader } from "react-spinners";
import ProfileImage from "../assets/images/userProfileImage.jpg";
import { useNavigate } from "react-router-dom";

interface UserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  termsAgreed?: boolean;
  CreatedAt?: string;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const currentUser = getAuth().currentUser;
  const [newUserData, setNewUserData] = useState<UserData | null>(
    loading ? null : userData
  );
  const navigate = useNavigate();
  const auth = getAuth();

  async function ChangeUserDataHandler() {
    try {
      const userDocref = doc(db, "Users", currentUser?.uid || "");
      await setDoc(userDocref, {
        fullName: newUserData?.fullName || "",
        email: newUserData?.email || "",
        phoneNumber: newUserData?.phoneNumber || "",
      });
      toast.success("User data updated successfully.");
    } catch (error) {
      toast.error(
        "An error occurred when updating user data. Try again later."
      );
    }
  }

  async function logoutHandler() {
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
      navigate("/");
    } catch (error) {
      toast.error("An error occurred while logging out. Try again later.");
    }
  }

  async function deleteAccountHandler() {
    try {
      const currentUserId = currentUser?.uid;
      const docRef = doc(db, "Users", currentUserId || "");
      deleteDoc(docRef)
        .then(() => {
          console.log("Document successfully deleted!");
        })
        .catch((error) => {
          console.error("Error deleting document: ", error);
        });
    } catch (error) {
      toast.error("An error occured while deleting the user. Try again later.");
    }
  }

  useEffect(() => {
    async function fetchUserData() {
      try {
        if (currentUser) {
          // Getting the document of the curent User according tp their UID
          const userDocRef = doc(db, "Users", currentUser.uid);
          const currentUserData = await getDoc(userDocRef);

          if (currentUserData.exists()) {
            setUserData(currentUserData.data() as UserData);
            setNewUserData(currentUserData.data() as UserData);
            console.log(currentUserData.data());
          } else {
            toast.error(
              "An error occured while fetching the user data . try again later."
            );
          }
          setLoading(false);
        } else {
          setLoading(false);
          toast.error("No user is currently logged in. Navigate to Home page.");
        }
      } catch (error) {
        toast.error("An error occured while fetching user data.");
      }
    }
    fetchUserData();
  }, [currentUser]);
  return (
    <div className="flex flex-col h-screen w-12/12 items-center ">
      <div className="flex flex-col w-9/12">
        <p className="font-bold text-3xl py-2 my-2 font-mono ">User profile</p>
      </div>

      <div className="flex flex-col w-9/12 items-center justify-center ">
        <img className="" src={ProfileImage} alt="User Profile Image" />
        {loading ? (
          <BeatLoader />
        ) : (
          <div>
            <p>
              <strong>Name : </strong>
              {userData?.fullName}
            </p>
            <p>
              <strong>Email : </strong>
              {userData?.email}
            </p>
            <p>
              <strong>Phone Number : </strong>
              {userData?.phoneNumber}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-row w-9/12 my-3 px-2 items-center justify-between  ">
        <button
          className="bg-blue-400 text-black px-4 py-2 rounded-lg my-6 w-2/12 "
          onClick={logoutHandler}
        >
          Logout
        </button>
        <button
          onClick={deleteAccountHandler}
          className="bg-red-500 text-black px-4 py-2 rounded-lg my-6 w-2/12 "
        >
          Delete account
        </button>
      </div>

      <div className="flex flex-col w-9/12 ">
        <p className="py-4 my-4 font-bold text-lg ">Change Profile Data</p>
        <form action="">
          <fieldset>
            <div className="flex flex-col  w-8/12 ">
              <label
                className="font-bold text-lg font-mono  py-1.5  my-1 "
                htmlFor=""
              >
                Full name
              </label>
              <input
                className="rounded-md border-2 border-gray-300 px-2 py-1.5 font-mono w-12/12 "
                type="text"
                value={newUserData?.fullName}
                defaultValue={newUserData?.fullName}
                name="Full Name"
                id="fullName"
                onChange={(e) =>
                  setNewUserData({
                    email: newUserData?.email || "",
                    phoneNumber: newUserData?.phoneNumber || "",
                    ...newUserData,
                    fullName: e.target.value || "",
                  })
                }
              />
            </div>

            <div className="flex flex-col  w-8/12 ">
              <label
                className="font-bold text-lg font-mono  py-1.5  my-1 "
                htmlFor=""
              >
                Email
              </label>
              <input
                className="rounded-md border-2 border-gray-300 px-2 py-1.5 font-mono w-12/12 "
                type="text"
                value={newUserData?.email}
                name="User Email"
                id="UserEmail"
                onChange={(e) =>
                  setNewUserData({
                    fullName: newUserData?.fullName || "",
                    phoneNumber: newUserData?.phoneNumber || "",
                    ...newUserData,
                    email: e.target.value || "",
                  })
                }
              />
            </div>

            <div className="flex flex-col  w-8/12 ">
              <label
                className="font-bold text-lg font-mono  py-1.5  my-1 "
                htmlFor=""
              >
                Phone Number
              </label>
              <input
                className="rounded-md border-2 border-gray-300 px-2 py-1.5 font-mono w-12/12 "
                type="text"
                value={newUserData?.phoneNumber}
                name="Phone Number"
                id="PhoneNumber"
                onChange={(e) =>
                  setNewUserData({
                    fullName: newUserData?.fullName || "",
                    email: newUserData?.email || "",
                    ...newUserData,
                    phoneNumber: e.target.value || "",
                  })
                }
              />
            </div>

            <div className="flex flex-col items-center justify-center w-12/12 ">
              <button
                className="py-3 my-3 px-4 text-center bg-blue-400 rounded-lg"
                onClick={ChangeUserDataHandler}
                type="button"
              >
                Edit profile
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
