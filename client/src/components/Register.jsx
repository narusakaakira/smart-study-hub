import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Register.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    gender: "",
    birth_year: "",   // có thể là YYYY-MM-DD (input date) hoặc dd/mm/yyyy, dd-mm-yyyy
    facebook: "",
    province: "",
    school: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- chuẩn hoá ngày: trả về YYYY-MM-DD để gửi API ---
  const toISO = (s) => {
    if (!s) return "";
    // đã đúng ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // dd/mm/yyyy
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    // dd-mm-yyyy
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    // fallback: cố gắng parse
    const dt = new Date(s);
    if (!isNaN(dt)) {
      const y = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      return `${y}-${mo}-${d}`;
    }
    return s;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.gender) return alert("Chọn giới tính");
    if (loading) return;
    setLoading(true);

    try {
      // 1) Đăng ký (chuẩn hoá ngày trước khi gửi)
      const payload = { ...form, birth_year: toISO(form.birth_year) };
      await axios.post("/register", payload); // axios tự throw nếu 4xx/5xx

      // 2) Đăng nhập lấy token
      const loginRes = await axios.post("/login", {
        email: form.email,
        password: form.password,
      });
      const access_token = loginRes.data?.access_token;
      if (!access_token) throw new Error("Thiếu access_token");

      // 3) Lưu & chuyển tới trang hồ sơ
      localStorage.setItem("token", access_token);
      localStorage.setItem("email", form.email);
      localStorage.setItem("user", JSON.stringify({ email: form.email }));
      navigate("/userprofile", { replace: true, state: { email: form.email } });

    } catch (err) {
      // lấy thông điệp lỗi đẹp từ FastAPI/Pydantic
      const d = err?.response?.data;
      let msg =
        (typeof d === "string" && d) ||
        d?.detail ||
        d?.message ||
        (Array.isArray(d?.detail) && d.detail.map(it => it?.msg || "").join("\n")) ||
        err.message ||
        "Đăng ký/đăng nhập thất bại";
      alert(msg);
      console.log("axios error:", {
        status: err.response?.status,
        data: err.response?.data,
      });
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

        {/* Có thể để type="date" hoặc "text".
            Nếu type="date", value sẽ là YYYY-MM-DD → toISO giữ nguyên.
            Nếu bạn nhập tay dd/mm/yyyy hoặc dd-mm-yyyy cũng OK nhờ toISO. */}
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
