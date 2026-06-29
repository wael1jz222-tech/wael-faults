import { useState, useEffect } from "react";

const SUPABASE_URL = "https://wliwecmplljytnkncced.supabase.co";
const SUPABASE_KEY = "sb_publishable_PruZfg-Plwx2dTiShp9wKg_24sxqhFL";
const ADMIN_EMAIL = "wael1jz222@gmail.com";

const CAR_BRANDS = ["تويوتا","نيسان","هيونداي","كيا","فورد","جي إم سي","لكزس","مرسيدس","بي إم دبليو","أودي","شيفروليه","ميتسوبيشي","هوندا"];
const ACCENT = "#1d6fdb";
const ACCENT_LIGHT = "#e8f0fb";

// ── Supabase helpers ──────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  const token = localStorage.getItem("sb_token") || SUPABASE_KEY;
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "return=representation", ...opts.headers },
    ...opts,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
}

async function authFetch(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "خطأ");
  return data;
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);       // {user, token}
  const [profile, setProfile] = useState(null);       // {role}
  const [authView, setAuthView] = useState("login");  // login | signup
  const [loading, setLoading] = useState(true);

  // restore session
  useEffect(() => {
    const token = localStorage.getItem("sb_token");
    const user  = localStorage.getItem("sb_user");
    if (token && user) {
      const u = JSON.parse(user);
      setSession({ token, user: u });
      loadProfile(u.id, token);
    } else setLoading(false);
  }, []);

  async function loadProfile(userId, token) {
    try {
      const rows = await sbFetch(`/profiles?id=eq.${userId}`);
      if (rows.length) setProfile(rows[0]);
      else {
        // create profile if missing
        await sbFetch("/profiles", { method: "POST", body: JSON.stringify({ id: userId, email: JSON.parse(localStorage.getItem("sb_user") || "{}").email, role: "viewer" }) });
        setProfile({ role: "viewer" });
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleLogin(email, password) {
    const data = await authFetch("token?grant_type=password", { email, password });
    localStorage.setItem("sb_token", data.access_token);
    localStorage.setItem("sb_user", JSON.stringify(data.user));
    setSession({ token: data.access_token, user: data.user });
    await loadProfile(data.user.id, data.access_token);
  }

  async function handleSignup(email, password) {
    const data = await authFetch("signup", { email, password });
    if (data.access_token) {
      localStorage.setItem("sb_token", data.access_token);
      localStorage.setItem("sb_user", JSON.stringify(data.user));
      setSession({ token: data.access_token, user: data.user });
      await sbFetch("/profiles", { method: "POST", body: JSON.stringify({ id: data.user.id, email, role: "viewer" }) });
      setProfile({ role: "viewer" });
    } else {
      throw new Error("تم إرسال رابط التأكيد على إيميلك ✅");
    }
  }

  function handleLogout() {
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_user");
    setSession(null); setProfile(null);
  }

  if (loading) return <Loader />;

  if (!session) return (
    <AuthScreen
      view={authView} setView={setAuthView}
      onLogin={handleLogin} onSignup={handleSignup}
    />
  );

  const isAdmin = session.user.email === ADMIN_EMAIL;
  const canAdd  = isAdmin || profile?.role === "editor";

  return (
    <MainApp
      session={session} profile={profile} isAdmin={isAdmin} canAdd={canAdd}
      onLogout={handleLogout}
    />
  );
}

// ── Auth Screen ───────────────────────────────────────────────
function AuthScreen({ view, setView, onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle() {
    setError(""); setMsg(""); setLoading(true);
    try {
      if (view === "login") await onLogin(email, password);
      else { await onSignup(email, password); setMsg("تم إنشاء الحساب! تحقق من إيميلك للتأكيد."); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", direction:"rtl", background:"#f5f7fa", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:380, boxShadow:"0 4px 24px #0002" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ background:ACCENT, borderRadius:14, width:52, height:52, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 12px" }}>🔧</div>
          <div style={{ fontWeight:800, fontSize:20, color:"#1a1a2e" }}>قاعدة أعطال وائل</div>
          <div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>كهرباء وبرمجة السيارات</div>
        </div>

        <div style={{ display:"flex", background:"#f5f7fa", borderRadius:10, padding:4, marginBottom:24 }}>
          <button onClick={()=>{setView("login");setError("");setMsg("");}} style={{ flex:1, background:view==="login"?"#fff":"none", border:"none", borderRadius:8, padding:"9px", fontWeight:700, fontSize:14, cursor:"pointer", color:view==="login"?ACCENT:"#888", boxShadow:view==="login"?"0 1px 4px #0001":"none" }}>تسجيل دخول</button>
          <button onClick={()=>{setView("signup");setError("");setMsg("");}} style={{ flex:1, background:view==="signup"?"#fff":"none", border:"none", borderRadius:8, padding:"9px", fontWeight:700, fontSize:14, cursor:"pointer", color:view==="signup"?ACCENT:"#888", boxShadow:view==="signup"?"0 1px 4px #0001":"none" }}>حساب جديد</button>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={lbl}>الإيميل</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" style={inp} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={lbl}>كلمة السر</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="••••••••" style={inp} />
        </div>

        {error && <div style={{ background:"#fef2f2", color:"#ef4444", borderRadius:8, padding:"10px 12px", fontSize:13, marginBottom:14 }}>{error}</div>}
        {msg   && <div style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:8, padding:"10px 12px", fontSize:13, marginBottom:14 }}>{msg}</div>}

        <button onClick={handle} disabled={loading} style={{ width:"100%", background:ACCENT, color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:700, fontSize:15, cursor:"pointer", opacity:loading?0.7:1 }}>
          {loading ? "جاري..." : view==="login" ? "دخول 🔑" : "إنشاء حساب ✅"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
function MainApp({ session, profile, isAdmin, canAdd, onLogout }) {
  const [faults, setFaults] = useState([]);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ code:"", name:"", description:"", car:"", model:"", year:"", engineCode:"", solution:"", status:"تم الحل", media:[] });

  useEffect(() => { loadFaults(); }, []);

  async function loadFaults() {
    setPageLoading(true);
    try { setFaults(await sbFetch("/faults?order=created_at.desc")); } catch(e) { console.error(e); }
    setPageLoading(false);
  }

  async function loadUsers() {
    try { setUsers(await sbFetch("/profiles?order=created_at.desc")); } catch(e) { console.error(e); }
  }

  async function handleAdd() {
    if (!form.code || !form.name) return;
    setSaving(true);
    try {
      await sbFetch("/faults", { method:"POST", body: JSON.stringify({ code:form.code, name:form.name, description:form.description, car:form.car, model:form.model, year:form.year, engine_code:form.engineCode, solution:form.solution, status:form.status, media:form.media }) });
      setForm({ code:"", name:"", description:"", car:"", model:"", year:"", engineCode:"", solution:"", status:"تم الحل", media:[] });
      await loadFaults(); setView("list");
    } catch(e) { alert("خطأ: " + e.message); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("تأكيد حذف العطل؟")) return;
    await sbFetch(`/faults?id=eq.${id}`, { method:"DELETE" });
    await loadFaults(); setView("list");
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === "editor" ? "viewer" : "editor";
    await sbFetch(`/profiles?id=eq.${userId}`, { method:"PATCH", body: JSON.stringify({ role: newRole }) });
    await loadUsers();
  }

  function handleMedia(e) {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || e.target.files || []);
    const items = files.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith("video")?"video":"image", name:f.name }));
    setForm(prev => ({ ...prev, media: [...prev.media, ...items] }));
  }

  const filtered = faults.filter(f =>
    (f.code||"").toLowerCase().includes(search.toLowerCase()) ||
    (f.name||"").includes(search) ||
    (f.car||"").includes(search) ||
    (f.model||"").includes(search) ||
    (f.engine_code||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", direction:"rtl", background:"#f5f7fa", minHeight:"100vh", color:"#1a1a2e" }}>

      {/* Header */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e5e9f0", padding:"0 16px", display:"flex", alignItems:"center", justifyContent:"space-between", height:62, position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 6px #0001" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ background:ACCENT, borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🔧</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15 }}>قاعدة أعطال وائل</div>
            <div style={{ fontSize:11, color:"#aaa" }}>{session.user.email}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <button onClick={()=>setView("list")} style={nb(view==="list",false)}>📋</button>
          {canAdd && <button onClick={()=>setView("add")} style={nb(view==="add",true)}>+</button>}
          {isAdmin && <button onClick={()=>{ setView("users"); loadUsers(); }} style={nb(view==="users",false)}>👥</button>}
          <button onClick={onLogout} style={{ background:"none", border:"1.5px solid #e5e9f0", borderRadius:8, padding:"7px 10px", cursor:"pointer", fontSize:12, color:"#aaa" }}>خروج</button>
        </div>
      </div>

      <div style={{ maxWidth:740, margin:"0 auto", padding:"24px 16px" }}>

        {/* LIST */}
        {view==="list" && (
          <>
            <div style={{ position:"relative", marginBottom:20 }}>
              <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"#aaa" }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بكود العطل أو السيارة..."
                style={{ width:"100%", boxSizing:"border-box", background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:10, padding:"11px 44px 11px 16px", fontSize:14, outline:"none" }} />
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:22 }}>
              {[
                { label:"إجمالي الأعطال", value:faults.length, icon:"📋", color:ACCENT },
                { label:"أنواع السيارات", value:new Set(faults.map(f=>f.car).filter(Boolean)).size, icon:"🚗", color:"#16a34a" },
                { label:"قيد العمل", value:faults.filter(f=>f.status==="قيد العمل").length, icon:"⚠️", color:"#d97706" },
              ].map((s,i)=>(
                <div key={i} style={{ flex:1, background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:12, padding:"12px", textAlign:"center", boxShadow:"0 1px 4px #0001" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:"#aaa", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {pageLoading ? <Loader /> : filtered.length===0 ? (
              <div style={{ textAlign:"center", color:"#ccc", padding:50 }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🔍</div>
                <div>ما في نتائج</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {filtered.map(fault=>(
                  <div key={fault.id} onClick={()=>{ setSelected(fault); setView("detail"); }}
                    style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:14, padding:"16px 18px", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=ACCENT; e.currentTarget.style.boxShadow="0 4px 16px #1d6fdb18"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e5e9f0"; e.currentTarget.style.boxShadow="none"; }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ background:ACCENT_LIGHT, color:ACCENT, border:`1px solid ${ACCENT}33`, borderRadius:7, padding:"3px 12px", fontSize:13, fontWeight:700, fontFamily:"monospace" }}>{fault.code}</span>
                      <SBadge status={fault.status} />
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{fault.name}</div>
                    {fault.description && <div style={{ fontSize:13, color:"#888", marginBottom:8, lineHeight:1.5 }}>{fault.description.slice(0,80)}{fault.description.length>80?"...":""}</div>}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {fault.car && <Chip icon="🚗" text={`${fault.car} ${fault.model||""}`} />}
                      {fault.year && <Chip icon="📅" text={fault.year} />}
                      {fault.engine_code && <Chip icon="⚙️" text={fault.engine_code} mono />}
                      {fault.media?.length>0 && <Chip icon="📸" text={`${fault.media.length} مرفق`} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ADD */}
        {view==="add" && canAdd && (
          <div>
            <h2 style={{ margin:"0 0 22px", fontSize:18, fontWeight:800, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ background:ACCENT, borderRadius:8, width:32, height:32, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>➕</span>
              إضافة عطل جديد
            </h2>

            <Sec title="كود العطل">
              <div style={{ display:"flex", gap:12 }}>
                <Fld label="كود العطل *" value={form.code} onChange={v=>setForm({...form,code:v})} placeholder="P0300" mono flex={1} />
                <Fld label="اسم العطل *" value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="عطل في مستشعر الأكسجين" flex={2} />
              </div>
            </Sec>

            <Sec title="معلومات السيارة 🚗">
              <div style={{ display:"flex", gap:12, marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>نوع السيارة</label>
                  <select value={form.car} onChange={e=>setForm({...form,car:e.target.value})} style={inp}>
                    <option value="">اختر...</option>
                    {CAR_BRANDS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <Fld label="الموديل" value={form.model} onChange={v=>setForm({...form,model:v})} placeholder="كامري" flex={1} />
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <Fld label="سنة الصنع" value={form.year} onChange={v=>setForm({...form,year:v})} placeholder="2021" flex={1} />
                <Fld label="رمز المكينة ⚙️" value={form.engineCode} onChange={v=>setForm({...form,engineCode:v})} placeholder="2GR-FE" mono flex={1} />
              </div>
            </Sec>

            <Sec title="تفاصيل العطل 🔍">
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>وصف المشكلة</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="اشرح المشكلة بالتفصيل..." rows={3} style={{ ...inp, resize:"vertical", lineHeight:1.7 }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>الحل 💡</label>
                <textarea value={form.solution} onChange={e=>setForm({...form,solution:e.target.value})} placeholder="اكتب الحل اللي شغل معك..." rows={3} style={{ ...inp, resize:"vertical", lineHeight:1.7 }} />
              </div>
              <div>
                <label style={lbl}>الحالة</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inp}>
                  <option>تم الحل</option>
                  <option>قيد العمل</option>
                  <option>بانتظار قطعة</option>
                </select>
              </div>
            </Sec>

            <Sec title="صور وفيديوات 📸🎬">
              <div onDrop={handleMedia} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
                onClick={()=>document.getElementById("mi").click()}
                style={{ border:`2px dashed ${dragOver?ACCENT:"#d0d7e3"}`, borderRadius:12, padding:"28px", textAlign:"center", cursor:"pointer", background:dragOver?ACCENT_LIGHT:"#fafbfd", transition:"all 0.2s" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
                <div style={{ color:"#888", fontSize:13 }}>اسحب الصور والفيديوات هنا أو اضغط للرفع</div>
                <input id="mi" type="file" multiple accept="image/*,video/*" style={{ display:"none" }} onChange={handleMedia} />
              </div>
              {form.media.length>0 && (
                <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                  {form.media.map((m,i)=>(
                    <div key={i} style={{ position:"relative" }}>
                      {m.type==="video"
                        ? <div style={{ width:80, height:80, borderRadius:10, background:"#1a1a2e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎬</div>
                        : <img src={m.url} style={{ width:80, height:80, borderRadius:10, objectFit:"cover" }} />}
                      <button onClick={()=>setForm(p=>({...p,media:p.media.filter((_,j)=>j!==i)}))}
                        style={{ position:"absolute", top:-6, left:-6, background:"#ef4444", border:"none", borderRadius:"50%", width:22, height:22, color:"#fff", cursor:"pointer", fontSize:12 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Sec>

            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <button onClick={handleAdd} disabled={saving} style={{ flex:2, background:ACCENT, color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:700, fontSize:15, cursor:"pointer", opacity:saving?0.7:1 }}>
                {saving?"جاري الحفظ...":"✅ حفظ العطل"}
              </button>
              <button onClick={()=>setView("list")} style={{ flex:1, background:"#f0f2f5", color:"#888", border:"1.5px solid #e5e9f0", borderRadius:10, padding:"13px", cursor:"pointer" }}>إلغاء</button>
            </div>
          </div>
        )}

        {/* DETAIL */}
        {view==="detail" && selected && (
          <div>
            <button onClick={()=>setView("list")} style={{ background:"none", border:"none", color:ACCENT, cursor:"pointer", fontSize:14, marginBottom:18, padding:0, fontWeight:600 }}>← رجوع</button>

            <div style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:14, padding:"20px", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ background:ACCENT_LIGHT, color:ACCENT, border:`1px solid ${ACCENT}33`, borderRadius:8, padding:"5px 16px", fontSize:20, fontWeight:800, fontFamily:"monospace" }}>{selected.code}</span>
                <SBadge status={selected.status} />
              </div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800 }}>{selected.name}</h2>
            </div>

            <div style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:14, padding:"18px", marginBottom:14 }}>
              <SLbl>🚗 معلومات السيارة</SLbl>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10 }}>
                {selected.car && <IItem label="النوع" value={selected.car} />}
                {selected.model && <IItem label="الموديل" value={selected.model} />}
                {selected.year && <IItem label="السنة" value={selected.year} />}
                {selected.engine_code && <IItem label="رمز المكينة ⚙️" value={selected.engine_code} mono />}
              </div>
            </div>

            {selected.description && (
              <div style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:14, padding:"18px", marginBottom:14 }}>
                <SLbl>🔍 وصف المشكلة</SLbl>
                <p style={{ margin:"10px 0 0", lineHeight:1.8, color:"#444", fontSize:14 }}>{selected.description}</p>
              </div>
            )}

            {selected.solution && (
              <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:14, padding:"18px", marginBottom:14 }}>
                <SLbl color="#16a34a">💡 الحل</SLbl>
                <p style={{ margin:"10px 0 0", lineHeight:1.8, color:"#166534", fontSize:14 }}>{selected.solution}</p>
              </div>
            )}

            {selected.media?.length>0 && (
              <div style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:14, padding:"18px", marginBottom:14 }}>
                <SLbl>📸 الصور والفيديوات ({selected.media.length})</SLbl>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:12 }}>
                  {selected.media.map((m,i)=>
                    m.type==="video"
                      ? <video key={i} src={m.url} controls style={{ width:160, height:120, borderRadius:10 }} />
                      : <img key={i} src={m.url} style={{ width:120, height:100, borderRadius:10, objectFit:"cover" }} />
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <button onClick={()=>handleDelete(selected.id)} style={{ width:"100%", background:"#fef2f2", color:"#ef4444", border:"1.5px solid #fecaca", borderRadius:10, padding:"12px", fontWeight:700, cursor:"pointer" }}>
                🗑️ حذف العطل
              </button>
            )}
          </div>
        )}

        {/* USERS */}
        {view==="users" && isAdmin && (
          <div>
            <h2 style={{ margin:"0 0 20px", fontSize:18, fontWeight:800 }}>👥 إدارة المستخدمين</h2>
            {users.length===0 ? (
              <div style={{ textAlign:"center", color:"#ccc", padding:40 }}>لا يوجد مستخدمون بعد</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {users.map(u=>(
                  <div key={u.id} style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{u.email}</div>
                      <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>{u.created_at?.split("T")[0]}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <SBadge status={u.role==="editor"?"محرر":"مشاهد"} />
                      {u.email !== ADMIN_EMAIL && (
                        <button onClick={()=>toggleRole(u.id, u.role)}
                          style={{ background:u.role==="editor"?"#fef2f2":ACCENT_LIGHT, color:u.role==="editor"?"#ef4444":ACCENT, border:`1.5px solid ${u.role==="editor"?"#fecaca":ACCENT+"33"}`, borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          {u.role==="editor"?"سحب الصلاحية":"منح صلاحية الإضافة"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small components ──────────────────────────────────────────
function Loader() {
  return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", color:"#aaa", fontSize:14, flexDirection:"column", gap:12 }}>
    <div style={{ fontSize:32 }}>⏳</div>جاري التحميل...
  </div>;
}

function SBadge({ status }) {
  const map = { "تم الحل":["#f0fdf4","#16a34a"], "قيد العمل":["#fffbeb","#d97706"], "بانتظار قطعة":["#fef2f2","#ef4444"], "محرر":["#e8f0fb","#1d6fdb"], "مشاهد":["#f5f7fa","#888"] };
  const [bg, color] = map[status] || ["#f5f7fa","#888"];
  return <span style={{ background:bg, color, borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{status}</span>;
}

function Chip({ icon, text, mono }) {
  return <span style={{ background:"#f5f7fa", border:"1px solid #e5e9f0", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#666", display:"inline-flex", alignItems:"center", gap:4, fontFamily:mono?"monospace":"inherit" }}>{icon} {text}</span>;
}

function Sec({ title, children }) {
  return <div style={{ background:"#fff", border:"1.5px solid #e5e9f0", borderRadius:14, padding:"18px", marginBottom:14, boxShadow:"0 1px 4px #0001" }}>
    <div style={{ fontWeight:700, fontSize:13, color:"#555", marginBottom:14, paddingBottom:10, borderBottom:"1px solid #f0f2f5" }}>{title}</div>
    {children}
  </div>;
}

function SLbl({ children, color="#1d6fdb" }) {
  return <div style={{ fontWeight:700, fontSize:13, color }}>{children}</div>;
}

function IItem({ label, value, mono }) {
  return <div style={{ background:"#f5f7fa", borderRadius:8, padding:"8px 14px", minWidth:100 }}>
    <div style={{ fontSize:11, color:"#aaa", marginBottom:3 }}>{label}</div>
    <div style={{ fontWeight:700, fontSize:14, fontFamily:mono?"monospace":"inherit" }}>{value}</div>
  </div>;
}

function Fld({ label, value, onChange, placeholder, mono, flex }) {
  return <div style={{ flex }}>
    <label style={lbl}>{label}</label>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ ...inp, fontFamily:mono?"monospace":"inherit" }} />
  </div>;
}

const lbl = { display:"block", fontSize:12, color:"#888", marginBottom:6, fontWeight:600 };
const inp = { width:"100%", boxSizing:"border-box", background:"#f5f7fa", border:"1.5px solid #e5e9f0", borderRadius:8, padding:"10px 12px", color:"#1a1a2e", fontSize:14, outline:"none", fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif" };
function nb(active, primary) {
  return { background:primary&&active?"#1d6fdb":active?"#f0f4ff":"none", color:primary&&active?"#fff":active?"#1d6fdb":"#888", border:`1.5px solid ${active?"#1d6fdb":"#e5e9f0"}`, borderRadius:8, padding:"7px 12px", cursor:"pointer", fontSize:13, fontWeight:active?700:400 };
}
