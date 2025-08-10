import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

  // Kiểm tra exp của JWT (nếu là JWT chuẩn)
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    if (!exp || exp * 1000 < Date.now()) throw new Error("expired");
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}