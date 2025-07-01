import { getAuth } from "firebase/auth";
import { useState, useEffect } from "react";
import { db } from "../utils/Firebase";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { BeatLoader } from "react-spinners";
import ProfileImage from "../assets/images/userProfileImage.jpg";

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

      <div className="flex flex-col w-9/12 items-center justify-center ">
        <p className="py-4 my-4 font-bold text-lg ">Change Profile Data</p>
        <form action="">
          <fieldset>
            <div className="flex flex-col items-center justify-center w-12/12 ">
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

            <div className="flex flex-col items-center justify-center w-12/12 ">
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

            <div className="flex flex-col items-center justify-center w-12/12 ">
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
