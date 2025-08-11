// src/components/ResetPassword.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../style/Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import api from "../api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(params.get("token") || "");
  }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!token) return alert("Thiếu token đặt lại.");
    if (pwd.length < 6) return alert("Mật khẩu tối thiểu 6 ký tự.");
    if (pwd !== confirm) return alert("Xác nhận mật khẩu không khớp.");

    setLoading(true);
    try {
      await api.post("/password/reset", { token, new_password: pwd });
      alert("Đặt lại mật khẩu thành công! Hãy đăng nhập.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Đặt lại mật khẩu thất bại";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={submit}>
        <h2 className="login-title">Đặt lại mật khẩu</h2>

        <div className="password-wrapper">
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Mật khẩu mới"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            className="login-input"
          />
          <span className="password-toggle-icon" onClick={() => setShowPwd(!showPwd)}>
            <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} />
          </span>
        </div>

        <div className="password-wrapper">
          <input
            type={showCfm ? "text" : "password"}
            placeholder="Xác nhận mật khẩu mới"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="login-input"
          />
          <span className="password-toggle-icon" onClick={() => setShowCfm(!showCfm)}>
            <FontAwesomeIcon icon={showCfm ? faEyeSlash : faEye} />
          </span>
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Đang đặt lại..." : "Cập nhật mật khẩu"}
        </button>

        <p className="switch-link">
          <span onClick={() => navigate("/login")} className="switch-register">
            Quay lại đăng nhập
          </span>
        </p>
      </form>
    </div>
  );
}
