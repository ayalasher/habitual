import { Routes, Route } from "react-router-dom";
import LogInScreen from "./pages/Login";
import SignUpScreen from "./pages/SignUp";
import HomeScreen from "./pages/Home";
import FocusScreen from "./pages/Focus";
import GoalsVisionsScreen from "./pages/Goals_Visions";
import ProfileScreen from "./pages/Profile";
import ProgressAnalyticsScreen from "./pages/ProgressAnalytics";
import FriendsScreen from "./pages/Friends";
import Navbar from "./components/Navbar";
import ForgotPasswordScreen from "./pages/ForgotPassword";
import Error404Screen from "./pages/Error404";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bounce } from "react-toastify";

function App() {
  return (
    <div className="">
      <Navbar />
      <Routes>
        <Route path="/" element={<LogInScreen />} />
        <Route path="/SignUp" element={<SignUpScreen />} />

        <Route path="/Home" element={<HomeScreen />} />
        <Route path="/Focus" element={<FocusScreen />} />
        <Route path="/Goals" element={<GoalsVisionsScreen />} />
        <Route
          path="/Progress-Analytics"
          element={<ProgressAnalyticsScreen />}
        />
        <Route path="/Profile" element={<ProfileScreen />} />
        <Route path="/Friends" element={<FriendsScreen />} />
        <Route path="/recover-password" element={<ForgotPasswordScreen />} />
        <Route path="*" element={<Error404Screen />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
    </div>
  );
}

export default App;
