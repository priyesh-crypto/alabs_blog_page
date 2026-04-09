"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  createCourseAction, updateCourseAction, deleteCourseAction, upsertTopicsAction,
} from "@/app/actions";
import {
  ArrowLeft, Loader2, BookOpen, Tags, Plus, Trash2, Pencil, X, Check,
  Image as ImageIcon,
} from "lucide-react";

export default function ContentSettings() {
  const router = useRouter();
  const { authorProfile, loading: authLoading } = useAuth();

  // ── Topics state ──────────────────────────────────────────────────
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState("");
  const [topicsSaving, setTopicsSaving] = useState(false);
  const [topicsMsg, setTopicsMsg] = useState(null);

  // ── Courses state ─────────────────────────────────────────────────
  const [coursesList, setCoursesList] = useState([]);
  const [coursesFetching, setCoursesFetching] = useState(true);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: "", label: "", description: "", image: "", url: "", duration: "", rating: "4.5" });
  const [courseSaving, setCourseSaving] = useState(false);
  const [coursesMsg, setCoursesMsg] = useState(null);
  const [courseImageUploading, setCourseImageUploading] = useState(false);
  const courseImageRef = useRef(null);

  const isSuperAdmin = authorProfile?.is_super_admin;

  useEffect(() => {
    if (authLoading) return;
    if (!authorProfile) { router.replace("/studio"); return; }

    fetch("/api/topics").then((r) => r.ok ? r.json() : []).then((data) => {
      if (Array.isArray(data)) setTopics(data);
    }).catch(() => {});

    fetch("/api/courses").then((r) => r.ok ? r.json() : []).then((data) => {
      setCoursesList(Array.isArray(data) ? data : []);
      setCoursesFetching(false);
    }).catch(() => { setCoursesFetching(false); });
  }, [authLoading, authorProfile, router]);

  // ── Topic handlers ────────────────────────────────────────────────
  const addTopic = () => {
    const t = topicInput.trim();
    if (!t || topics.includes(t)) return;
    setTopics([...topics, t]);
    setTopicInput("");
  };

  const removeTopic = (t) => setTopics(topics.filter((x) => x !== t));

  const saveTopics = async () => {
    setTopicsSaving(true);
    setTopicsMsg(null);
    const res = await upsertTopicsAction(topics);
    setTopicsMsg(res.success ? { type: "success", text: "Topics saved!" } : { type: "err", text: res.error });
    setTopicsSaving(false);
  };

  // ── Course handlers ───────────────────────────────────────────────
  const openNewCourse = () => {
    setEditingCourse(null);
    setCourseForm({ title: "", label: "", description: "", image: "", url: "", duration: "", rating: "4.5" });
    setCoursesMsg(null);
    setCourseFormOpen(true);
  };

  const openEditCourse = (c) => {
    setEditingCourse(c);
    setCourseForm({
      title: c.title || "", label: c.label || "", description: c.description || "",
      image: c.image || "", url: c.url || "", duration: c.duration || "",
      rating: String(c.rating || "4.5"),
    });
    setCoursesMsg(null);
    setCourseFormOpen(true);
  };

  const closeCourseForm = () => { setCourseFormOpen(false); setEditingCourse(null); };

  const handleCourseImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCourseImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setCourseForm((f) => ({ ...f, image: data.url }));
      else setCoursesMsg({ type: "err", text: "Upload failed: " + (data.error || "unknown") });
    } catch { setCoursesMsg({ type: "err", text: "Upload failed." }); }
    finally { setCourseImageUploading(false); e.target.value = ""; }
  };

  const saveCourse = async () => {
    if (!courseForm.title.trim()) return setCoursesMsg({ type: "err", text: "Title is required." });
    setCourseSaving(true);
    setCoursesMsg(null);
    const res = editingCourse
      ? await updateCourseAction(editingCourse.id, courseForm)
      : await createCourseAction(courseForm);
    if (res.success) {
      const r = await fetch("/api/courses");
      if (r.ok) setCoursesList(await r.json());
      closeCourseForm();
      setCoursesMsg({ type: "success", text: editingCourse ? "Course updated!" : "Course added!" });
    } else {
      setCoursesMsg({ type: "err", text: res.error });
    }
    setCourseSaving(false);
  };

  const deleteCourse = async (id) => {
    if (!confirm("Delete this course?")) return;
    const res = await deleteCourseAction(id);
    if (res.success) setCoursesList((prev) => prev.filter((c) => c.id !== id));
    else setCoursesMsg({ type: "err", text: res.error });
  };

  if (authLoading || !authorProfile) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
        <Loader2 size={28} className="spinning" color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="studio-wrapper" style={{ background: "var(--bg)", minHeight: "100vh", overflowY: "auto" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <button onClick={() => router.push("/studio")} style={{ background: "none", border: "none", color: "var(--text3)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14, fontWeight: 500, padding: "8px 0" }}>
            <ArrowLeft size={16} /> Back to Studio
          </button>
          <img src="/white.svg" alt="Alabs" style={{ height: 32, width: "auto" }} />
        </div>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "var(--text)", letterSpacing: "-0.5px" }}>Content Settings</h1>
          <p style={{ margin: "6px 0 0", color: "var(--text3)", fontSize: 15 }}>Manage topics and related courses shown across the blog.</p>
        </div>

        {/* ── Topics Manager ─────────────────────────────────────── */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: "var(--blue-dim)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
              <Tags size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text)" }}>Topics</h2>
              <p style={{ margin: "2px 0 0", color: "var(--text3)", fontSize: 12 }}>Filterable topic chips shown in the blog and studio.</p>
            </div>
          </div>

          {topicsMsg && (
            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500, background: topicsMsg.type === "success" ? "var(--green-dim)" : "var(--red-dim)", color: topicsMsg.type === "success" ? "var(--green)" : "var(--red)" }}>
              {topicsMsg.text}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, minHeight: 36 }}>
            {topics.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--blue-dim)", color: "var(--blue)", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid rgba(59,130,246,0.15)" }}>
                {t}
                <button onClick={() => removeTopic(t)} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, opacity: 0.7 }}>
                  <X size={13} />
                </button>
              </span>
            ))}
            {topics.length === 0 && <span style={{ fontSize: 13, color: "var(--text4)", fontStyle: "italic" }}>No topics yet.</span>}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
              placeholder="New topic name…"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg2)", fontSize: 14, color: "var(--text)", outline: "none" }}
            />
            <button onClick={addTopic} style={{ padding: "10px 16px", background: "var(--blue-dim)", color: "var(--blue)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> Add
            </button>
            <button onClick={saveTopics} disabled={topicsSaving} style={{ padding: "10px 20px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: topicsSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: topicsSaving ? 0.7 : 1 }}>
              {topicsSaving ? <Loader2 size={15} className="spinning" /> : <Check size={15} />} Save
            </button>
          </div>
        </section>

        {/* ── Courses Manager ────────────────────────────────────── */}
        <section style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "rgba(39,65,108,0.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                <BookOpen size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text)" }}>Related Courses</h2>
                <p style={{ margin: "2px 0 0", color: "var(--text3)", fontSize: 12 }}>Courses shown in the blog sidebar and courses grid.</p>
              </div>
            </div>
            <button onClick={openNewCourse} style={{ padding: "9px 16px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <Plus size={15} /> Add Course
            </button>
          </div>

          {coursesMsg && !courseFormOpen && (
            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500, background: coursesMsg.type === "success" ? "var(--green-dim)" : "var(--red-dim)", color: coursesMsg.type === "success" ? "var(--green)" : "var(--red)" }}>
              {coursesMsg.text}
            </div>
          )}

          {/* Inline form */}
          {courseFormOpen && (
            <div style={{ background: "var(--bg2)", border: "2px solid var(--primary)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{editingCourse ? "Edit Course" : "New Course"}</h3>
                <button onClick={closeCourseForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex" }}><X size={18} /></button>
              </div>

              {coursesMsg && (
                <div style={{ padding: "9px 12px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 500, background: coursesMsg.type === "success" ? "var(--green-dim)" : "var(--red-dim)", color: coursesMsg.type === "success" ? "var(--green)" : "var(--red)" }}>
                  {coursesMsg.text}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Title *", key: "title", placeholder: "e.g. Data Science Specialization" },
                  { label: "Label", key: "label", placeholder: "e.g. Specialization" },
                  { label: "Duration", key: "duration", placeholder: "e.g. 6 months" },
                  { label: "Rating", key: "rating", placeholder: "4.5", type: "number" },
                  { label: "Course URL", key: "url", placeholder: "https://…", span: true },
                ].map(({ label, key, placeholder, type, span }) => (
                  <div key={key} style={span ? { gridColumn: "1 / -1" } : {}}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 5, textTransform: "uppercase" }}>{label}</label>
                    <input
                      type={type || "text"}
                      value={courseForm[key]}
                      onChange={(e) => setCourseForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 13, color: "var(--text)" }}
                    />
                  </div>
                ))}

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 5, textTransform: "uppercase" }}>Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Short course description…"
                    style={{ width: "100%", height: 68, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 13, color: "var(--text)", resize: "none" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 5, textTransform: "uppercase" }}>Course Image</label>
                  <input ref={courseImageRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCourseImageUpload} />
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {courseForm.image && (
                      <div style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={courseForm.image} alt="" style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                        <button type="button" onClick={() => setCourseForm((f) => ({ ...f, image: "" }))} style={{ position: "absolute", top: -6, right: -6, background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10 }}>×</button>
                      </div>
                    )}
                    <button type="button" onClick={() => courseImageRef.current?.click()} disabled={courseImageUploading} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px dashed var(--border)", background: "var(--bg)", color: "var(--text2)", fontSize: 13, fontWeight: 600, cursor: courseImageUploading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {courseImageUploading ? <Loader2 size={14} className="spinning" /> : <ImageIcon size={14} />}
                      {courseImageUploading ? "Uploading…" : courseForm.image ? "Change Image" : "Upload Image"}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                <button onClick={closeCourseForm} style={{ padding: "9px 18px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "var(--text3)" }}>Cancel</button>
                <button onClick={saveCourse} disabled={courseSaving} style={{ padding: "9px 22px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: courseSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, opacity: courseSaving ? 0.7 : 1 }}>
                  {courseSaving ? <Loader2 size={15} className="spinning" /> : <Check size={15} />}
                  {editingCourse ? "Update" : "Add Course"}
                </button>
              </div>
            </div>
          )}

          {/* Course list */}
          {coursesFetching ? (
            <div style={{ textAlign: "center", padding: 32 }}><Loader2 size={24} className="spinning" color="var(--primary)" /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {coursesList.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12 }}>
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 44, background: "var(--bg3)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BookOpen size={18} color="var(--text4)" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{[c.label, c.duration, c.rating && `★ ${c.rating}`].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => openEditCourse(c)} style={{ padding: "6px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer", color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                      <Pencil size={12} /> Edit
                    </button>
                    {isSuperAdmin && (
                      <button onClick={() => deleteCourse(c.id)} style={{ padding: "6px 12px", background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer", color: "var(--red)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {coursesList.length === 0 && (
                <div style={{ padding: "36px", textAlign: "center", color: "var(--text4)", border: "2px dashed var(--border)", borderRadius: 14 }}>
                  No courses yet. Click "Add Course" to create one.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.spinning { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }` }} />
    </div>
  );
}
