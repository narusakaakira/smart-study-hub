import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../style/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // 1) gọi /login để lấy token
      const res = await axios.post("/login", { email, password });
      const token = res.data?.access_token;
      if (!token) throw new Error("Thiếu access_token");

      // 2) lưu token + phát tín hiệu để Navbar/Home cập nhật ngay
      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("auth-changed"));

      // 3) preload thông tin user (để lấy tên hiển thị)
      try {
        const meRes = await axios.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = meRes.data;
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("auth-changed"));
      } catch (_) {
        // không critical, có thể bỏ qua
      }

      // 4) điều hướng: quay lại trang bị chặn hoặc sang /userprofile
      const redirectTo = location.state?.from?.pathname || "/userprofile";
      navigate(redirectTo, { replace: true });

    } catch (err) {
      const d = err?.response?.data;
      const msg =
        (typeof d === "string" && d) ||
        d?.detail ||
        d?.message ||
        "Đăng nhập thất bại! Vui lòng kiểm tra lại email/mật khẩu.";
      console.error("login error:", err);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Đăng nhập</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
          autoComplete="email"
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
            autoComplete="current-password"
          />
          <FontAwesomeIcon
            icon={showPassword ? faEyeSlash : faEye}
            className="password-toggle-icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="switch-link">
          <span onClick={() => navigate("/forgot")} className="switch-register">
           Quên mật khẩu?
          </span>
        </p>


        <p className="switch-link">
          Chưa có tài khoản?{" "}
          <span onClick={() => navigate("/register")} className="switch-register">
            Đăng ký
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
