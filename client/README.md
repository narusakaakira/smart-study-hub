

API = 'http://localhost:8000'
----------------------------------------------------
axios.defaults.baseURL = 'http://localhost:8000';
----------------------------------------------------
axios.defaults.baseURL = import.meta.env.VITE_API_URL; //file .env  {VITE_API_URL = 'http://localhost:8000'}
axios.defaults.withCredentials = true;


______________________________________________________________________________________________________
const reg = await fetch(`${API}/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form),
});
----------------------------------------------------
const reg = await axios.post("/register", form);
______________________________________________________________________________________________________
const me = await fetch("http://localhost:8000/me", {
  headers: { Authorization: `Bearer ${token}` },
});
----------------------------------------------------
const me = await axios.get("/me", {
  headers: { Authorization: `Bearer ${token}` },
});
______________________________________________________________________________________________________

const res = await fetch("http://localhost:8000/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
----------------------------------------------------
const res = await axios.post("/login", { email, password });


___________________________________________________________


 useEffect(() => {
    const tk = token();
    if (!tk) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${tk}` } })
      .then(async (res) => {
        if (res.status === 401) throw new Error("unauthorized");
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
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
      .catch(() => navigate("/login", { replace: true }))
      .finally(() => setLoading(false));

    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);