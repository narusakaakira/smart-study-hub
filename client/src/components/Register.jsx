// src/components/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Register.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    gender: "",
    birth_year: "",
    facebook: "",
    province: "",
    school: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gender) return alert("Chọn giới tính");
    setLoading(true);

    try {
      // 1) Đăng ký
      await api.post("/register", form);

      // 2) Đăng nhập tự động -> lấy token
      const loginRes = await api.post("/login", {
        email: form.email,
        password: form.password,
      });
      const token = loginRes.data?.access_token;
      if (!token) throw new Error("Đăng nhập tự động thất bại (thiếu access_token)");

      // 3) Lưu token + lấy thông tin user
      localStorage.setItem("access_token", token);
      localStorage.setItem("email", form.email);

      const meRes = await api.get("/me");
      localStorage.setItem("user", JSON.stringify(meRes.data));

      // 4) Thông báo & điều hướng
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/userprofile", { replace: true, state: { email: form.email } });
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Đăng ký thất bại";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>

        <input
          type="email"
          name="email"
          placeholder="EMAIL"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        {/* Mật khẩu */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            required
            className="login-input"
            autoComplete="new-password"
          />
          <FontAwesomeIcon
            icon={showPassword ? faEyeSlash : faEye}
            className="password-toggle-icon"
            onClick={() => setShowPassword((v) => !v)}
          />
        </div>

        <input
          type="text"
          name="full_name"
          placeholder="HỌ VÀ TÊN"
          value={form.full_name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phone"
          placeholder="SỐ ĐIỆN THOẠI"
          value={form.phone}
          onChange={handleChange}
          required
        />

        {/* Giới tính */}
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="gender"
              value="Nam"
              checked={form.gender === "Nam"}
              onChange={handleChange}
              required
            />
            nam
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Nữ"
              checked={form.gender === "Nữ"}
              onChange={handleChange}
              required
            />
            nữ
          </label>
          <label>
            <input
              type="radio"
              name="gender"
              value="Khác"
              checked={form.gender === "Khác"}
              onChange={handleChange}
              required
            />
            khác
          </label>
        </div>

        <input
          type="date"
          name="birth_year"
          placeholder="NGÀY SINH"
          value={form.birth_year}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="facebook"
          placeholder="FACEBOOK"
          value={form.facebook}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="province"
          placeholder="TỈNH"
          value={form.province}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="school"
          placeholder="TRƯỜNG"
          value={form.school}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo…" : "Tạo tài khoản"}
        </button>
        <p className="switch-link">
          Đã có tài khoản?{" "}
          <span onClick={() => navigate("/login")} className="switch-register">
            Đăng nhập
          </span>
        </p>
      </form>
    </div>
  );
}
