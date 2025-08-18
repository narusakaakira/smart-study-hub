import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from 'axios';
import Login from "./components/Login";
import Register from "./components/Register";
import UserProfile from "./components/UserProfile";
import RequireAuth from "./components/RequireAuth";
import Home from "./components/Home"
import Navbar from "./components/Navbar"; // nhớ tạo file này
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;


function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route exact path="/" element={<Home/>} />
        {/* công khai */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* private: cần token */}
        <Route
          path="/userprofile"
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />

        {/* ai gõ /me/... thì chuyển sang /userprofile */}
        <Route path="/me/:anything" element={<Navigate to="/userprofile" replace />} />

        {/* mặc định */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;