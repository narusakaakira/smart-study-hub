// src/components/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Login.css"; // tái dùng style form

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
      const res = await axios.post("/password/forgot", { email });
      const data = res.data; // axios đã parse JSON

      alert(data.message || "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn.");
      if (data.dev_reset_link) setDevLink(data.dev_reset_link); // tiện test
    } catch (err) {
      const d = err?.response?.data;
      const msg =
        (typeof d === "string" && d) ||
        d?.detail ||
        d?.message ||
        err.message ||
        "Yêu cầu thất bại";
      alert(msg);
      console.log("forgot error:", { status: err.response?.status, data: d });
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
