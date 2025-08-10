import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState({ token: null, user: null });

  const readAuth = () => {
    const token = localStorage.getItem("token");
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch {}
    setAuth({ token, user });
  };

    useEffect(() => {
    const sync = () => {
        const token = localStorage.getItem("token");
        let user = null;
        try { user = JSON.parse(localStorage.getItem("user")||"null"); } catch {}
        // nếu KHÔNG có token -> xóa user cũ để tránh hiển thị sai
        if (!token && user) {
        localStorage.removeItem("user");
        user = null;
        }
        setAuth({ token, user });
    };
    sync();
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
        window.removeEventListener("auth-changed", sync);
        window.removeEventListener("storage", sync);
    };
    }, []);

  const goAccount = () => navigate("/userprofile");

  const firstName =
    auth.user?.full_name?.trim()?.split(" ")?.slice(-1)[0] || "";

  return (
    <nav className="navbar">
      <Link to="/" className="nav-item">TRANG CHỦ</Link>

      {auth.token ? (
        <button className="nav-item nav-account" onClick={goAccount}>
          TÀI KHOẢN
        </button>
      ) : (
        <Link to="/login" className="nav-item">ĐĂNG NHẬP</Link>
      )}
    </nav>
  );
}
