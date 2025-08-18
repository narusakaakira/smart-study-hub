import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "../style/UserProfile.css";

const GENDERS = ["Nam", "Nữ", "Khác"];

// Chuẩn hoá yyyy-mm-dd cho <input type="date">
const toISODate = (v) => {
  if (!v) return "";
  if (/^\d{4}$/.test(v)) return `${v}-01-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (!isNaN(d)) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  return "";
};

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("view"); // 'view' | 'edit' | 'changePwd'

  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    gender: "Nam",
    birth_year: "",
    facebook: "",
    province: "",
    school: "",
  });

  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });

  const [deleting, setDeleting] = useState(false);

  // lưu email nếu có
  useMemo(() => {
    const fromState = location.state?.email;
    const fromStorage = localStorage.getItem("email");
    const finalEmail = fromState || fromStorage || "";
    if (finalEmail) localStorage.setItem("email", finalEmail);
    return finalEmail;
  }, [location]);

  const token = () => localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
  };

  // ===== Tải hồ sơ =====
  useEffect(() => {
    const tk = token();
    if (!tk) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    axios
      .get("/me", { headers: { Authorization: `Bearer ${tk}` } })
      .then((res) => {
        const data = res.data;

        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          gender: data.gender || "Nam",
          birth_year: toISODate(data.birth_year || ""),
          facebook: data.facebook || "",
          province: data.province || "",
          school: data.school || "",
        });

        if (data?.has_avatar) fetchAvatar();
        else setAvatarUrl(null);
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          console.error("unauthorized");
        } else {
          console.error("fetch failed", err);
        }
        navigate("/login", { replace: true });
      })
      .finally(() => setLoading(false));

    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ===== Avatar =====
  const fetchAvatar = async () => {
    try {
      const res = await axios.get("/me/avatar", {
        headers: { Authorization: `Bearer ${token()}` },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(url);
    } catch {
      setAvatarUrl(null);
    }
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    setUploading(true);
    try {
      await axios.post("/me/avatar", fd, {
        headers: { Authorization: `Bearer ${token()}` }, // axios tự set multipart/form-data
      });
      await fetchAvatar();
      alert("Cập nhật ảnh đại diện thành công!");
      setUser((u) => ({ ...(u || {}), has_avatar: true }));
    } catch (err) {
      const d = err?.response?.data;
      alert(d?.detail || err.message || "Upload thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ===== Edit profile =====
  const startEdit = () => {
    setForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      gender: user.gender || "Nam",
      birth_year: toISODate(user.birth_year || ""),
      facebook: user.facebook || "",
      province: user.province || "",
      school: user.school || "",
    });
    setMode("edit");
  };
  const cancelEdit = () => setMode("view");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();

    if (!form.full_name?.trim()) return alert("Họ và tên không được trống");
    if (form.birth_year && !/^\d{4}-\d{2}-\d{2}$/.test(form.birth_year))
      return alert("Ngày sinh không hợp lệ (yyyy-mm-dd)");

    try {
      const res = await axios.put("/me", form, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });
      const data = res.data;

      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      window.dispatchEvent(new Event("auth-changed"));

      setMode("view");
      alert("Đã cập nhật thông tin!");
    } catch (err) {
      const d = err?.response?.data;
      alert(d?.detail || err.message || "Cập nhật thất bại");
    }
  };

  // ===== Đổi mật khẩu =====
  const resetPwForm = () =>
    setPwForm({ current_password: "", new_password: "", confirm: "" });

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.current_password || !pwForm.new_password)
      return alert("Vui lòng nhập đủ các trường");
    if (pwForm.new_password !== pwForm.confirm)
      return alert("Xác nhận mật khẩu không khớp");

    try {
      await axios.post(
        "/me/password",
        {
          current_password: pwForm.current_password,
          new_password: pwForm.new_password,
        },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      alert("Đổi mật khẩu thành công!");
      resetPwForm();
      setMode("view");
    } catch (err) {
      const d = err?.response?.data;
      alert(d?.detail || err.message || "Đổi mật khẩu thất bại");
    }
  };

  // ===== Xóa tài khoản =====
  const onDeleteAccount = async () => {
    const ok = window.confirm(
      "Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác."
    );
    if (!ok) return;

    const pwd = window.prompt("Nhập mật khẩu hiện tại để xác nhận:");
    if (!pwd) return;

    try {
      setDeleting(true);
      await axios.delete("/me", {
        headers: { Authorization: `Bearer ${token()}` },
        data: { current_password: pwd }, // body cho DELETE
      });

      alert("Tài khoản đã bị xóa.");
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("user");
      navigate("/register", { replace: true });
    } catch (err) {
      const d = err?.response?.data;
      alert(d?.detail || err.message || "Xóa tài khoản thất bại");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !user) return <p>⏳ Đang tải thông tin…</p>;
  if (!user) return null;

  return (
    <div className="user-profile-container">
      {/* Header */}
      <div className="user-profile-header">
        <div className="avatar-wrap">
          <img
            src={avatarUrl || "https://via.placeholder.com/128?text=Avatar"}
            alt="avatar"
            width={128}
            height={128}
            className="avatar"
            onError={(e) =>
              (e.currentTarget.src = "https://via.placeholder.com/128?text=Avatar")
            }
          />
          <label className="avatar-edit" title="Đổi ảnh">
            <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
            <span>✎</span>
          </label>
        </div>

        <div className="header-text">
          <h2>
            {mode === "view"
              ? "Thông tin cá nhân"
              : mode === "edit"
              ? "Chỉnh sửa thông tin"
              : "Đổi mật khẩu"}
          </h2>
          {uploading && <div className="muted">Đang tải ảnh lên…</div>}
        </div>
      </div>

      {/* ====== MODE: VIEW ====== */}
      {mode === "view" && (
        <>
          <div className="user-profile-info card">
            <div className="info-row"><span>Họ và tên</span><b>{user.full_name}</b></div>
            <div className="info-row"><span>Tài khoản</span><b>{user.username || user.email.split("@")[0]}</b></div>
            <div className="info-row"><span>Email</span><b>{user.email}</b></div>
            <div className="info-row"><span>Số điện thoại</span><b>{user.phone}</b></div>
            <div className="info-row"><span>Giới tính</span><b>{user.gender}</b></div>
            <div className="info-row"><span>Ngày sinh</span><b>{toISODate(user.birth_year) || ""}</b></div>
            <div className="info-row"><span>Link Facebook</span><b>{user.facebook || "Không có"}</b></div>
            <div className="info-row"><span>Tỉnh thành</span><b>{user.province}</b></div>
            <div className="info-row"><span>Trường học</span><b>{user.school}</b></div>
          </div>

          <div className="user-profile-toolbar">
            <button type="button" className="secondary-btn" onClick={() => setMode("changePwd")}>
              Thay đổi mật khẩu
            </button>

            <button type="button" className="primary-btn" onClick={startEdit}>
              Chỉnh sửa thông tin
            </button>

            <button type="button" className="logout-button" onClick={handleLogout}>
              Đăng xuất
            </button>

            <button type="button" className="danger-btn" onClick={onDeleteAccount} disabled={deleting}>
              {deleting ? "Đang xóa..." : "Xóa tài khoản"}
            </button>
          </div>
        </>
      )}

      {/* ====== MODE: EDIT ====== */}
      {mode === "edit" && (
        <form id="profile-edit-form" className="card" onSubmit={onSave}>
          <div className="grid-2">
            <div>
              <label>Họ và tên *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div>
              <label>Giới tính</label>
              <div className="radio-group">
                {GENDERS.map((g) => (
                  <label key={g}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={onChange}
                    />
                    {g.toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label>Ngày sinh *</label>
              <input
                type="date"
                name="birth_year"
                value={form.birth_year}
                onChange={onChange}
                required
              />
            </div>

            <div>
              <label>Link Facebook *</label>
              <input
                name="facebook"
                value={form.facebook}
                onChange={onChange}
                placeholder="https://facebook.com/..."
                required
              />
            </div>
            <div>
              <label>Tỉnh thành *</label>
              <input
                name="province"
                value={form.province}
                onChange={onChange}
                placeholder="Đồng Tháp"
                required
              />
            </div>
            <div>
              <label>Trường học *</label>
              <input
                name="school"
                value={form.school}
                onChange={onChange}
                placeholder="THPT ..."
                required
              />
            </div>
            <div>
              <label>Số điện thoại</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="0xxxxxxxxx"
              />
            </div>
            <div>
              <label>Email</label>
              <input value={user.email} disabled />
              <div className="muted">Email không thể chỉnh tại đây</div>
            </div>
          </div>

          <div className="right">
            <button type="button" className="ghost-btn" onClick={cancelEdit}>
              Hủy
            </button>
            <button type="submit" className="primary-btn">
              Cập nhật
            </button>
          </div>
        </form>
      )}

      {/* ====== MODE: CHANGE PASSWORD ====== */}
      {mode === "changePwd" && (
        <form className="card pw-card" onSubmit={onChangePassword}>
          <div className="grid-2">
            <div>
              <label>Mật khẩu hiện tại</label>
              <div className="password-wrapper">
                <input
                  type={showPw.current ? "text" : "password"}
                  value={pwForm.current_password}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, current_password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, current: !s.current }))
                  }
                  aria-label={showPw.current ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showPw.current ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <FontAwesomeIcon icon={showPw.current ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div>
              <label>Mật khẩu mới</label>
              <div className="password-wrapper">
                <input
                  type={showPw.next ? "text" : "password"}
                  value={pwForm.new_password}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, new_password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                  aria-label={showPw.next ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showPw.next ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <FontAwesomeIcon icon={showPw.next ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div>
              <label>Xác nhận mật khẩu mới</label>
              <div className="password-wrapper">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, confirm: !s.confirm }))
                  }
                  aria-label={showPw.confirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showPw.confirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <FontAwesomeIcon icon={showPw.confirm ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
          </div>

          <div className="right">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setMode("view");
                setShowPw({ current: false, next: false, confirm: false });
                setPwForm({ current_password: "", new_password: "", confirm: "" });
              }}
            >
              Hủy
            </button>
            <button type="submit" className="primary-btn">
              Đổi mật khẩu
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
