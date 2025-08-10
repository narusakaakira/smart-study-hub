import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Register.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const API = "http://localhost:8000";

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

  // dùng đúng tên state như bên login
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gender) return alert("Chọn giới tính");
    setLoading(true);

    try {
      // 1) Đăng ký
      const reg = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!reg.ok) {
        const err = await reg.json().catch(() => ({}));
        throw new Error(err.detail || "Đăng ký thất bại");
      }

      // 2) Đăng nhập lấy token
      const login = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (!login.ok) throw new Error("Đăng nhập tự động thất bại");

      const { access_token } = await login.json();

      // 3) Lưu & chuyển tới trang hồ sơ
      localStorage.setItem("token", access_token);
      localStorage.setItem("email", form.email);
      localStorage.setItem("user", JSON.stringify({ email: form.email }));

      navigate("/userprofile", { replace: true, state: { email: form.email } });
    } catch (err) {
      alert(err.message);
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

        {/* Ô mật khẩu với nút hiện/ẩn giống login */}
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
