import { getAuth } from "firebase/auth";
import { useState, useEffect } from "react";

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    if (currentUser) {
      setUserData({
        fullName: currentUser.displayName || "No name provided",
        email: currentUser.email || "No email provided",
        phoneNumber: currentUser.phoneNumber || "No phone number provided",
      });
      setLoading(false);
    } else {
      setLoading(false);
      console.error("No user is currently logged in.");
    }
  });
  return (
    <div className="flex flex-col h-screen w-12/12 items-center ">
      <div className="flex flex-col w-8/12">
        <p className="font-bold text-3xl py-2 my-2 font-mono ">User profile</p>
        <p>{}</p>
      </div>
    </div>
  );
}
