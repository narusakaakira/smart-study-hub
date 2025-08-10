// src/components/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Login.css"; // tái dùng style form

const API = "http://localhost:8000";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Yêu cầu thất bại");
      alert(data.message || "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn.");
      if (data.dev_reset_link) setDevLink(data.dev_reset_link); // tiện test
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={submit}>
        <h2 className="login-title">Quên mật khẩu</h2>
        <input
          type="email"
          placeholder="Nhập email đã đăng ký"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
          autoComplete="email"
        />
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Đang xử lý..." : "Gửi hướng dẫn đặt lại"}
        </button>

        {devLink && (
          <p className="switch-link">
            Link DEV:{" "}
            <a href={devLink} className="switch-register">
              {devLink}
            </a>
          </p>
        )}

        <p className="switch-link">
          <span onClick={() => navigate("/login")} className="switch-register">
            Quay lại đăng nhập
          </span>
        </p>
      </form>
    </div>
  );
}
