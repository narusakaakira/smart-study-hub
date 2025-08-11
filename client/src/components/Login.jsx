import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../style/Login.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      // 1) login
      const res = await api.post("/login", { email, password });
      const token = res.data?.access_token;
      if (!token) throw new Error("Thiếu access_token");
      localStorage.setItem("access_token", token);
      window.dispatchEvent(new Event("auth-changed"));

      // 2) lấy thông tin user
      const meRes = await api.get("/me");
      localStorage.setItem("user", JSON.stringify(meRes.data));
      window.dispatchEvent(new Event("auth-changed"));

      // 3) điều hướng
      const redirectTo = location.state?.from?.pathname || "/userprofile";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error(err);
      alert("Đăng nhập thất bại! Vui lòng kiểm tra email/mật khẩu.");
    } finally {
      setLoading(false);
    }
  }
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

