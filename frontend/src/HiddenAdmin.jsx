import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { assetUrl } from "./lib/assets";
import { siteCopyDefaults } from "./lib/siteCopyDefaults";
import { mergeSiteCopyWithDefaults } from "./lib/siteCopyApi";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "oakcast_admin_token";

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseImageUrls(project) {
  let urls = project?.image_urls;
  if (typeof urls === "string") {
    try {
      urls = JSON.parse(urls);
    } catch {
      urls = [];
    }
  }
  return Array.isArray(urls) ? urls.filter((u) => typeof u === "string" && u.length) : [];
}

function cloneSiteCopy() {
  return {
    en: JSON.parse(JSON.stringify(siteCopyDefaults.en)),
    lt: JSON.parse(JSON.stringify(siteCopyDefaults.lt))
  };
}

const WEBSITE_SECTIONS = [
  {
    id: "nav",
    label: "Navigation & brand",
    keys: [
      "brand",
      "navHome",
      "navMenuOpenAria",
      "navMenuCloseAria",
      "navMobileSectionsLabel",
      "navPhilosophy",
      "navMaterials",
      "navProjects",
      "navFaq",
      "navStory",
      "navContact",
      "stickyCtaLabel"
    ]
  },
  { id: "hero", label: "Hero", keys: ["heroBadge", "heroTitle", "heroSubtitle", "heroCtaProjects", "heroCtaQuote"] },
  {
    id: "philosophy",
    label: "Philosophy & gallery",
    keys: ["philosophyTitle", "philosophyText", "projectsTitle", "projectsEmpty", "storyTitle", "statusForSale", "statusSold"]
  },
  {
    id: "materials",
    label: "Materials strip",
    keys: [
      "materialsTitle",
      "materialsIntro",
      "materialsCol1Title",
      "materialsCol1Text",
      "materialsCol2Title",
      "materialsCol2Text",
      "materialsCol3Title",
      "materialsCol3Text"
    ]
  },
  { id: "timeline", label: "Process timeline", isTimeline: true },
  {
    id: "faq",
    label: "FAQ",
    keys: [
      "faqTitle",
      "faq1Q",
      "faq1A",
      "faq2Q",
      "faq2A",
      "faq3Q",
      "faq3A",
      "faq4Q",
      "faq4A",
      "faq5Q",
      "faq5A",
      "faq6Q",
      "faq6A"
    ]
  },
  {
    id: "contact",
    label: "Contact & form",
    keys: [
      "contactTitle",
      "contactLead",
      "contactFormCaption",
      "contactSocialHeading",
      "yourName",
      "email",
      "messagePlaceholder",
      "sendInquiry",
      "sending",
      "sendingRequest",
      "successMessage",
      "errorMessage",
      "nameRequired",
      "emailRequired",
      "messageRequired"
    ]
  },
  { id: "social", label: "Social labels", keys: ["socialFacebook", "socialInstagram", "socialYoutube", "socialComingSoon"] }
];

function labelize(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function adminRowsForKey(key) {
  if (key.includes("Placeholder") || key.includes("Lead") || key.includes("Subtitle") || key.includes("Intro")) return 4;
  if (key.endsWith("Text") || (key.startsWith("faq") && key.endsWith("A"))) return 4;
  if (key.startsWith("faq") && key.endsWith("Q")) return 2;
  return 1;
}

function TextField({ label, value, onChange, rows = 1 }) {
  const common =
    "mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-parchment outline-none focus:border-amber-warm";
  return (
    <label className="block text-sm">
      <span className="text-parchment/75">{label}</span>
      {rows > 1 ? (
        <textarea rows={rows} className={common} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className={common} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function WebsiteCopyEditor({ token, onLogout }) {
  const [copy, setCopy] = useState(null);
  const [section, setSection] = useState(WEBSITE_SECTIONS[0].id);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await axios.get(`${API_BASE}/site-copy`);
      if (data?.en && data?.lt) {
        setCopy(mergeSiteCopyWithDefaults(data));
      } else {
        setCopy(cloneSiteCopy());
      }
    } catch {
      setCopy(cloneSiteCopy());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateKey = (lng, key, value) => {
    setCopy((prev) => ({
      ...prev,
      [lng]: { ...prev[lng], [key]: value }
    }));
  };

  const updateTimeline = (lng, index, field, value) => {
    setCopy((prev) => ({
      ...prev,
      [lng]: {
        ...prev[lng],
        timeline: prev[lng].timeline.map((row, i) => (i === index ? { ...row, [field]: value } : row))
      }
    }));
  };

  const handleSave = async () => {
    if (!copy) return;
    setSaving(true);
    setMessage("");
    try {
      await axios.put(`${API_BASE}/admin/site-copy`, copy, {
        headers: { ...authHeader(token), "Content-Type": "application/json" }
      });
      setMessage("Website copy saved.");
    } catch (err) {
      setMessage(err.response?.data?.error || err.message || "Save failed.");
      if (err.response?.status === 401) onLogout();
    } finally {
      setSaving(false);
    }
  };

  const activeSection = useMemo(() => WEBSITE_SECTIONS.find((s) => s.id === section), [section]);

  if (loading || !copy) {
    return <p className="text-parchment/70">Loading website copy…</p>;
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <nav className="flex shrink-0 flex-wrap gap-2 lg:w-52 lg:flex-col">
        {WEBSITE_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition lg:w-full ${
              section === s.id
                ? "border-amber-warm/60 bg-amber-warm/15 text-parchment"
                : "border-white/15 bg-black/30 text-parchment/80 hover:border-white/25"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="rounded-2xl border border-white/12 bg-black/35 p-6 md:p-8">
          <h3 className="text-lg font-semibold text-parchment">{activeSection?.label}</h3>

          {activeSection?.isTimeline ? (
            <div className="mt-6 space-y-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/25 p-4 md:p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-warm/80">Step {i + 1}</p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-xs text-parchment/50">English</p>
                      <TextField
                        label="Title"
                        value={copy.en.timeline[i].title}
                        onChange={(v) => updateTimeline("en", i, "title", v)}
                      />
                      <TextField
                        label="Text"
                        rows={4}
                        value={copy.en.timeline[i].text}
                        onChange={(v) => updateTimeline("en", i, "text", v)}
                      />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-parchment/50">Lithuanian</p>
                      <TextField
                        label="Title"
                        value={copy.lt.timeline[i].title}
                        onChange={(v) => updateTimeline("lt", i, "title", v)}
                      />
                      <TextField
                        label="Text"
                        rows={4}
                        value={copy.lt.timeline[i].text}
                        onChange={(v) => updateTimeline("lt", i, "text", v)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-parchment/45">English</p>
                {activeSection?.keys?.map((key) => (
                  <TextField
                    key={key}
                    label={labelize(key)}
                    rows={adminRowsForKey(key)}
                    value={copy.en[key] ?? ""}
                    onChange={(v) => updateKey("en", key, v)}
                  />
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-parchment/45">Lithuanian</p>
                {activeSection?.keys?.map((key) => (
                  <TextField
                    key={key}
                    label={labelize(key)}
                    rows={adminRowsForKey(key)}
                    value={copy.lt[key] ?? ""}
                    onChange={(v) => updateKey("lt", key, v)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-copper-500 to-amber-warm px-6 py-3 font-semibold text-charcoal disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save website copy"}
          </button>
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Reload from server
          </button>
          {message ? <p className="text-sm text-amber-200">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}

function ProjectEditorPanel({ project, token, onClose, onSaved, onLogout }) {
  const [titleEn, setTitleEn] = useState(project.title_en || "");
  const [titleLt, setTitleLt] = useState(project.title_lt || "");
  const [descriptionEn, setDescriptionEn] = useState(project.description_en || "");
  const [descriptionLt, setDescriptionLt] = useState(project.description_lt || "");
  const [category, setCategory] = useState(project.category || "Table");
  const [saleStatus, setSaleStatus] = useState(project.sale_status || "for_sale");
  const [imageUrls, setImageUrls] = useState(() => parseImageUrls(project));
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setMsg("");
    try {
      const body = new FormData();
      files.forEach((f) => body.append("images", f));
      const { data } = await axios.post(`${API_BASE}/admin/upload`, body, {
        headers: authHeader(token)
      });
      setImageUrls((prev) => [...prev, ...(data.urls || [])]);
      setFiles([]);
      setMsg(`Uploaded ${data.urls?.length || 0} image(s).`);
    } catch (err) {
      setMsg(err.response?.data?.error || err.message || "Upload failed.");
      if (err.response?.status === 401) onLogout();
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setMsg("");
    if (!titleEn.trim() || !titleLt.trim() || !descriptionEn.trim() || !descriptionLt.trim()) {
      setMsg("Fill both titles and both descriptions.");
      return;
    }
    if (imageUrls.length === 0) {
      setMsg("Keep at least one image, or add new photos before removing the last one.");
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/admin/projects/${project.id}`,
        {
          title_en: titleEn.trim(),
          title_lt: titleLt.trim(),
          description_en: descriptionEn.trim(),
          description_lt: descriptionLt.trim(),
          category,
          sale_status: saleStatus,
          image_urls: imageUrls
        },
        { headers: { ...authHeader(token), "Content-Type": "application/json" } }
      );
      setMsg("Project saved.");
      await onSaved();
    } catch (err) {
      setMsg(err.response?.data?.error || err.message || "Save failed.");
      if (err.response?.status === 401) onLogout();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-amber-warm/30 bg-black/50 p-6 shadow-lg backdrop-blur-md md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-xl font-semibold text-parchment">Edit project</h2>
          <p className="mt-1 text-sm text-parchment/60">Update text, availability, and gallery images.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
          Close editor
        </button>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <div className="space-y-4">
          <TextField label="Title (English)" value={titleEn} onChange={setTitleEn} />
          <TextField label="Title (Lithuanian)" value={titleLt} onChange={setTitleLt} />
          <TextField label="Description (English)" value={descriptionEn} onChange={setDescriptionEn} rows={6} />
          <TextField label="Description (Lithuanian)" value={descriptionLt} onChange={setDescriptionLt} rows={6} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Category
              <select
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 outline-none focus:border-amber-warm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Table">Table</option>
                <option value="Small Project">Small Project</option>
              </select>
            </label>
            <label className="block text-sm">
              Availability
              <select
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 outline-none focus:border-amber-warm"
                value={saleStatus}
                onChange={(e) => setSaleStatus(e.target.value)}
              >
                <option value="for_sale">For sale</option>
                <option value="sold">Sold</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-parchment">Photos</p>
          <p className="mt-1 text-xs text-parchment/55">Order is kept left-to-right. Remove shots you no longer need, or upload new files.</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="mt-3 block w-full text-sm text-parchment/80 file:mr-3 file:rounded-lg file:border-0 file:bg-copper-500 file:px-3 file:py-2 file:text-charcoal"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          <button
            type="button"
            disabled={uploading || !files.length}
            onClick={handleUpload}
            className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm enabled:hover:bg-white/10 disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "Upload selected files"}
          </button>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {imageUrls.map((url, idx) => (
              <li key={`${url}-${idx}`} className="relative overflow-hidden rounded-xl border border-white/15">
                <img src={assetUrl(url)} alt="" className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-xs text-parchment hover:bg-red-950/80"
                  onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
                <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-parchment/90">
                  #{idx + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {msg ? <p className="mt-6 text-sm text-amber-200">{msg}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-xl bg-gradient-to-r from-copper-500 to-amber-warm px-8 py-3 font-semibold text-charcoal disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save project"}
        </button>
      </div>
    </section>
  );
}

export default function HiddenAdmin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [adminTab, setAdminTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [editingProject, setEditingProject] = useState(null);

  const [titleEn, setTitleEn] = useState("");
  const [titleLt, setTitleLt] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionLt, setDescriptionLt] = useState("");
  const [category, setCategory] = useState("Table");
  const [saleStatus, setSaleStatus] = useState("for_sale");
  const [imageUrls, setImageUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  const loadProjects = useCallback(async (t) => {
    setLoadError("");
    try {
      const { data } = await axios.get(`${API_BASE}/admin/projects`, { headers: authHeader(t) });
      setProjects(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setLoadError("Could not load projects. Check token and server.");
    }
  }, []);

  useEffect(() => {
    if (token) loadProjects(token);
  }, [token, loadProjects]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const { data } = await axios.post(`${API_BASE}/admin/login`, loginForm);
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
    } catch {
      setLoginError("Invalid credentials or admin not configured on server.");
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setEditingProject(null);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setFormMessage("");
    try {
      const body = new FormData();
      files.forEach((f) => body.append("images", f));
      const { data } = await axios.post(`${API_BASE}/admin/upload`, body, {
        headers: authHeader(token)
      });
      setImageUrls((prev) => [...prev, ...(data.urls || [])]);
      setFiles([]);
      setFormMessage(`Uploaded ${data.urls?.length || 0} image(s).`);
    } catch (err) {
      setFormMessage(err.response?.data?.error || err.message || "Upload failed.");
      if (err.response?.status === 401) logout();
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormMessage("");
    if (!titleEn.trim() || !titleLt.trim() || !descriptionEn.trim() || !descriptionLt.trim()) {
      setFormMessage("Fill both titles and both language descriptions.");
      return;
    }
    if (imageUrls.length === 0) {
      setFormMessage("Upload at least one image.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE}/admin/projects`,
        {
          title_en: titleEn.trim(),
          title_lt: titleLt.trim(),
          description_en: descriptionEn.trim(),
          description_lt: descriptionLt.trim(),
          category,
          sale_status: saleStatus,
          image_urls: imageUrls
        },
        { headers: { ...authHeader(token), "Content-Type": "application/json" } }
      );
      setTitleEn("");
      setTitleLt("");
      setDescriptionEn("");
      setDescriptionLt("");
      setSaleStatus("for_sale");
      setImageUrls([]);
      setFiles([]);
      setFormMessage("Project created.");
      await loadProjects(token);
    } catch (err) {
      setFormMessage(err.response?.data?.error || err.message || "Save failed.");
      if (err.response?.status === 401) logout();
    } finally {
      setSaving(false);
    }
  };

  const removePreviewUrl = (idx) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaleStatusChange = async (id, sale_status) => {
    try {
      await axios.put(
        `${API_BASE}/admin/projects/${id}`,
        { sale_status },
        { headers: { ...authHeader(token), "Content-Type": "application/json" } }
      );
      await loadProjects(token);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    try {
      await axios.delete(`${API_BASE}/admin/projects/${id}`, { headers: authHeader(token) });
      if (editingProject?.id === id) setEditingProject(null);
      await loadProjects(token);
    } catch (err) {
      if (err.response?.status === 401) logout();
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#151210] px-4 text-parchment">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-black/50 p-8 shadow-xl backdrop-blur-md"
        >
          <h1 className="text-xl font-semibold text-parchment">Oakcast Studio — admin</h1>
          <p className="mt-2 text-sm text-parchment/65">Sign in with credentials from server environment.</p>
          <label className="mt-6 block text-sm text-parchment/80">
            Username
            <input
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-parchment outline-none focus:border-amber-warm"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block text-sm text-parchment/80">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-parchment outline-none focus:border-amber-warm"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              autoComplete="current-password"
            />
          </label>
          {loginError ? <p className="mt-3 text-sm text-red-400">{loginError}</p> : null}
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-copper-500 to-amber-warm py-3 font-semibold text-charcoal"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#151210] px-4 py-10 pb-24 text-parchment md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Oakcast admin</h1>
            <p className="text-sm text-parchment/65">Projects, images, and public website wording.</p>
          </div>
          <button type="button" onClick={logout} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
            Log out
          </button>
        </header>

        <nav className="mb-10 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => {
              setAdminTab("projects");
              setEditingProject(null);
            }}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              adminTab === "projects" ? "bg-amber-warm/20 text-parchment ring-1 ring-amber-warm/40" : "text-parchment/70 hover:bg-white/10"
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("website")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              adminTab === "website" ? "bg-amber-warm/20 text-parchment ring-1 ring-amber-warm/40" : "text-parchment/70 hover:bg-white/10"
            }`}
          >
            Website copy
          </button>
        </nav>

        {adminTab === "website" ? (
          <WebsiteCopyEditor token={token} onLogout={logout} />
        ) : (
          <>
            {loadError ? <p className="mb-4 text-sm text-amber-300">{loadError}</p> : null}

            {editingProject ? (
              <div className="mb-12">
                <ProjectEditorPanel
                  key={editingProject.id}
                  project={editingProject}
                  token={token}
                  onClose={() => setEditingProject(null)}
                  onSaved={() => loadProjects(token)}
                  onLogout={logout}
                />
              </div>
            ) : null}

            <section className="rounded-3xl border border-white/15 bg-black/40 p-6 backdrop-blur-md md:p-10">
              <h2 className="text-lg font-semibold">New project</h2>
              <form onSubmit={handleCreate} className="mt-6 space-y-4">
                <div className="grid gap-6 xl:grid-cols-2">
                  <TextField label="Title (English)" value={titleEn} onChange={setTitleEn} />
                  <TextField label="Title (Lithuanian)" value={titleLt} onChange={setTitleLt} />
                  <TextField label="Description (English)" value={descriptionEn} onChange={setDescriptionEn} rows={4} />
                  <TextField label="Description (Lithuanian)" value={descriptionLt} onChange={setDescriptionLt} rows={4} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    Category
                    <select
                      className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 outline-none focus:border-amber-warm"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Table">Table</option>
                      <option value="Small Project">Small Project</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Availability
                    <select
                      className="mt-1 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 outline-none focus:border-amber-warm"
                      value={saleStatus}
                      onChange={(e) => setSaleStatus(e.target.value)}
                    >
                      <option value="for_sale">For sale</option>
                      <option value="sold">Sold</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-2xl border border-dashed border-white/25 p-4">
                  <p className="text-sm text-parchment/80">Images</p>
                  <p className="mt-1 text-xs text-parchment/55">Choose files, then Upload. Repeat as needed. Order is kept.</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="mt-3 block w-full text-sm text-parchment/80 file:mr-3 file:rounded-lg file:border-0 file:bg-copper-500 file:px-3 file:py-2 file:text-charcoal"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                  <button
                    type="button"
                    disabled={uploading || !files.length}
                    onClick={handleUpload}
                    className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm enabled:hover:bg-white/10 disabled:opacity-40"
                  >
                    {uploading ? "Uploading…" : "Upload selected files"}
                  </button>

                  {imageUrls.length > 0 ? (
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {imageUrls.map((url, idx) => (
                        <li key={`${url}-${idx}`} className="relative overflow-hidden rounded-xl border border-white/15">
                          <img src={assetUrl(url)} alt="" className="h-40 w-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-parchment"
                            onClick={() => removePreviewUrl(idx)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {formMessage ? <p className="text-sm text-amber-200">{formMessage}</p> : null}

                <button
                  type="submit"
                  disabled={saving || imageUrls.length === 0}
                  className="w-full max-w-md rounded-xl bg-gradient-to-r from-copper-500 to-amber-warm py-3 font-semibold text-charcoal disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Create project"}
                </button>
              </form>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold">Existing projects ({projects.length})</h2>
              <ul className="mt-4 space-y-3">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-black/35 px-4 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.title_en || p.title || "—"}</p>
                      <p className="text-xs text-parchment/70">{p.title_lt || ""}</p>
                      <p className="text-xs text-parchment/55">{p.category}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="rounded-lg border border-white/20 bg-black/50 px-2 py-1.5 text-sm outline-none focus:border-amber-warm"
                        value={p.sale_status || "for_sale"}
                        onChange={(e) => handleSaleStatusChange(p.id, e.target.value)}
                      >
                        <option value="for_sale">For sale</option>
                        <option value="sold">Sold</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setEditingProject(p)}
                        className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg border border-red-400/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
