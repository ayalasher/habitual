import { getAuth, signOut } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import { db, storage } from "../utils/Firebase";
import {
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import type { UploadTask } from "firebase/storage";
import { toast } from "react-toastify";
import { BeatLoader } from "react-spinners";
import ProfileImage from "../assets/images/userProfileImage.jpg";
import { useNavigate } from "react-router-dom";

interface UserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  termsAgreed?: boolean;
  createdAt?: any;
  updatedAt?: any;
  photoURL?: string;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>("");
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const currentUser = getAuth().currentUser;
  const [newUserData, setNewUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const auth = getAuth();

  async function ChangeUserDataHandler(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!currentUser || !newUserData) return;
    if (!newUserData.fullName.trim()) {
      toast.error("Full name required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email)) {
      toast.error("Enter a valid email");
      return;
    }
    try {
      setSaving(true);
      const userDocref = doc(db, "Users", currentUser.uid);
      await setDoc(
        userDocref,
        {
          fullName: newUserData.fullName.trim(),
          email: newUserData.email.trim(),
          phoneNumber: newUserData.phoneNumber.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setUserData(newUserData);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
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
    if (!currentUser) return;
    const confirmed = window.confirm(
      "This will permanently delete your profile data (not your auth account). Continue?"
    );
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, "Users", currentUser.uid));
      toast.success("Profile data deleted");
      setUserData(null);
      setNewUserData(null);
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploadError("");
    setUploadProgress(0);
    try {
      setUploadingImage(true);
      const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
      const task = uploadBytesResumable(storageRef, file, {
        cacheControl: "public,max-age=3600",
        contentType: file.type,
      });
      uploadTaskRef.current = task;
      const timeoutId = setTimeout(() => {
        if (uploadProgress === 0 && uploadTaskRef.current) {
          uploadTaskRef.current.cancel();
          setUploadError("Upload timed out. Please try again.");
          toast.error("Upload timed out");
          setUploadingImage(false);
        }
      }, 30000);
      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round(
            (snap.bytesTransferred / snap.totalBytes) * 100
          );
          setUploadProgress(pct);
        },
        (error) => {
          clearTimeout(timeoutId);
          setUploadError(error.message || "Upload failed");
          toast.error("Image upload failed");
          setUploadingImage(false);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const downloadURL = await getDownloadURL(task.snapshot.ref);
            await setDoc(
              doc(db, "Users", currentUser.uid),
              { photoURL: downloadURL, updatedAt: serverTimestamp() },
              { merge: true }
            );
            setUserData((prev) =>
              prev ? { ...prev, photoURL: downloadURL } : prev
            );
            setNewUserData((prev) =>
              prev ? { ...prev, photoURL: downloadURL } : prev
            );
            toast.success("Profile image updated");
          } catch (err) {
            setUploadError("Unable to finalize upload");
            toast.error("Failed to finalize image");
          } finally {
            setUploadingImage(false);
            uploadTaskRef.current = null;
          }
        }
      );
    } catch (err: any) {
      setUploadError("Unexpected upload error");
      toast.error("Upload crashed");
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    if (!currentUser) return;
    const confirmRemove = window.confirm("Remove your profile image?");
    if (!confirmRemove) return;
    try {
      setUploadingImage(true);
      const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
      await deleteObject(storageRef).catch(() => {}); // ignore if not existing
      await setDoc(
        doc(db, "Users", currentUser.uid),
        { photoURL: "", updatedAt: serverTimestamp() },
        { merge: true }
      );
      setUserData((prev) => (prev ? { ...prev, photoURL: "" } : prev));
      setNewUserData((prev) => (prev ? { ...prev, photoURL: "" } : prev));
      toast.success("Profile image removed");
    } catch (err) {
      toast.error("Failed to remove image");
    } finally {
      setUploadingImage(false);
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
  const initials = (userData?.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="font-mono text-3xl font-bold">Profile</h1>
        <p className="text-sm text-gray-500">
          Manage your personal information.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="User avatar"
                  className="h-28 w-28 rounded-full object-cover border border-gray-200 shadow"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <img
                  src={ProfileImage}
                  alt="Placeholder avatar"
                  className="h-28 w-28 rounded-full object-cover border border-gray-200 shadow opacity-70"
                />
              )}
              {!loading && !userData?.photoURL && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-800/80 text-white text-2xl font-semibold">
                  {initials}
                </div>
              )}
            </div>
            {loading ? (
              <BeatLoader size={10} />
            ) : userData ? (
              <div className="space-y-1">
                <p className="font-medium">{userData.fullName}</p>
                <p className="text-xs text-gray-500">{userData.email}</p>
                {userData.phoneNumber && (
                  <p className="text-xs text-gray-400">
                    {userData.phoneNumber}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No profile data.</p>
            )}
            <div className="flex flex-col w-full gap-2 pt-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <label className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-200 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploadingImage || deleting}
                  />
                  {uploadingImage ? `Uploading ${uploadProgress}%` : "Upload"}
                </label>
                {uploadingImage && (
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadTaskRef.current) {
                        uploadTaskRef.current.cancel();
                        setUploadingImage(false);
                        setUploadError("Upload canceled");
                        toast.info("Upload canceled");
                      }
                    }}
                    className="inline-flex items-center rounded-lg bg-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
                {userData?.photoURL && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage || deleting}
                    className="inline-flex items-center rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
                {uploadError && !uploadingImage && (
                  <span className="w-full text-center text-[10px] text-red-500 font-medium">
                    {uploadError}
                  </span>
                )}
              </div>
              <button
                onClick={logoutHandler}
                className="inline-flex justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                disabled={deleting}
              >
                Logout
              </button>
              <button
                onClick={deleteAccountHandler}
                className="inline-flex justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Data"}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-mono font-semibold text-xl mb-4">
              Edit Profile
            </h2>
            <form onSubmit={ChangeUserDataHandler} className="space-y-5">
              <fieldset disabled={saving || loading} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={newUserData?.fullName || ""}
                    onChange={(e) =>
                      setNewUserData({
                        ...(newUserData || {
                          email: "",
                          phoneNumber: "",
                          fullName: "",
                        }),
                        fullName: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={newUserData?.email || ""}
                    onChange={(e) =>
                      setNewUserData({
                        ...(newUserData || {
                          email: "",
                          phoneNumber: "",
                          fullName: "",
                        }),
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={newUserData?.phoneNumber || ""}
                    onChange={(e) =>
                      setNewUserData({
                        ...(newUserData || {
                          email: "",
                          phoneNumber: "",
                          fullName: "",
                        }),
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Optional"
                  />
                </div>
              </fieldset>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <BeatLoader size={6} color="#fff" />}
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
                {newUserData &&
                  userData &&
                  JSON.stringify(newUserData) !== JSON.stringify(userData) && (
                    <span className="text-xs text-gray-500">
                      Unsaved changes
                    </span>
                  )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {(saving || loading) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-sm">
          <div className="rounded-xl bg-white px-6 py-5 shadow-lg flex flex-col items-center gap-3">
            <BeatLoader size={10} />
            <p className="text-xs font-medium text-gray-600">
              {loading ? "Loading profile..." : "Saving changes..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
