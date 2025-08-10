// src/components/Home.jsx
import { useEffect, useState } from "react";
import "../style/Home.css";

function getDisplayName() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const u = JSON.parse(raw);
    if (u?.full_name && u.full_name.trim()) return u.full_name.trim();
    if (u?.email) return u.email.split("@")[0];
    return "";
  } catch { return ""; }
}

function Home() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem("token")));
  const [name, setName] = useState(getDisplayName());

  useEffect(() => {
    const update = () => {
      setAuthed(Boolean(localStorage.getItem("token")));
      setName(getDisplayName());
    };
    window.addEventListener("storage", update);
    window.addEventListener("auth-changed", update);
    update();
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("auth-changed", update);
    };
  }, []);

  return (
    <div className="home-container">
      {authed ? (
        <div>HELLO <b>{name || "bạn"}</b></div>
      ) : (
        <div>HELLO</div>
      )}
    </div>
  );
}

export default Home;
