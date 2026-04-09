"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { adminCreateUserAction } from "@/app/actions";
import { ShieldAlert, UserPlus, Users, Loader2, ArrowLeft, Key, Mail, CheckCircle2, Image as ImageIcon } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { authorProfile, loading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [authorsList, setAuthorsList] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("author"); // "author" | "admin"
  
  // Profile State
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");
  const [image, setImage] = useState("");
  const [showMore, setShowMore] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'err', text: ''}

  useEffect(() => {
    async function fetchAuthors() {
      const { data } = await supabase.from("authors").select("*").order("name");
      setAuthorsList(data || []);
      setFetching(false);
    }
    if (!authLoading) {
      if (!authorProfile?.is_super_admin) {
        // Bounce non-admins back to the studio workspace
        router.replace("/studio");
      } else {
        fetchAuthors();
      }
    }
  }, [authLoading, authorProfile, router, supabase]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const res = await adminCreateUserAction({ 
      email, name, password, role,
      bio, linkedin, experience, expertise, image 
    });
    
    if (res.success) {
      setMessage({ type: 'success', text: `Successfully provisioned account for ${name}!` });
      setName("");
      setEmail("");
      setPassword("");
      setRole("author");
      setBio("");
      setLinkedin("");
      setExpertise("");
      setExperience("");
      setImage("");
      setShowMore(false);
      
      // Refresh the list
      const { data } = await supabase.from("authors").select("*").order("name");
      setAuthorsList(data || []);
    } else {
      setMessage({ type: 'err', text: res.error || "Failed to create user." });
    }
    
    setIsSubmitting(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setImage(data.url);
      } else {
        setMessage({ type: 'err', text: "Upload failed: " + (data.error || "unknown") });
      }
    } catch { 
      setMessage({ type: 'err', text: "Upload failed. Please try again." });
    } finally { 
      setIsUploading(false); 
      e.target.value = ""; 
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i=0; i<12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(pass);
  };

  if (authLoading || fetching) {
    return <div className="studio-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}><Loader2 className="spinning" size={32} color="var(--primary)" /></div>;
  }

  // Double check client side bounce to prevent flash
  if (!authorProfile?.is_super_admin) return null;

  return (
    <div className="studio-wrapper" style={{ background: 'var(--bg)', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Top Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <button 
            onClick={() => router.push("/studio")} 
            style={{ 
              background: 'none', border: 'none', color: 'var(--text3)', 
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              fontSize: 14, fontWeight: 500, padding: '8px 0'
            }}
          >
            <ArrowLeft size={16} /> Back to Studio
          </button>
          
          <img src="/logo.svg" alt="Alabs" style={{ height: 32, width: 'auto' }} />
        </div>

        {/* Dashboard Title Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48, background: 'var(--bg2)', padding: '24px', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, background: 'var(--blue-dim)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)', letterSpacing: '-0.5px' }}>Super Admin Dashboard</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text3)', fontSize: 15 }}>Manage your editorial team and provision secure access keys.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) 2fr', gap: 32 }}>
          
          {/* Create User Form Card */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
               <UserPlus size={20} color="var(--primary)" />
               <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Provision Account</h2>
            </div>

            {message && (
              <div style={{ 
                padding: '12px 16px', borderRadius: 10, marginBottom: 24, fontSize: 13, fontWeight: 500,
                background: message.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)', 
                color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="e.g. John Doe" 
                  style={{ 
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', 
                    background: 'var(--bg2)', fontSize: 14, outline: 'none', color: 'var(--text)',
                    transition: 'all 0.2s'
                  }} 
                  className="admin-input"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    placeholder="john@analytixlabs.co.in" 
                    style={{ 
                      width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10, border: '1px solid var(--border)', 
                      background: 'var(--bg2)', fontSize: 14, outline: 'none', color: 'var(--text)'
                    }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Temporary Password
                  <span onClick={generatePassword} style={{ color: 'var(--blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'none', letterSpacing: '0' }}>
                    <Key size={12}/> Generate Key
                  </span>
                </label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="Set temporary password" 
                  style={{ 
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', 
                    background: 'var(--bg2)', fontSize: 14, outline: 'none', color: 'var(--text)'
                  }} 
                />
                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 6, fontStyle: 'italic' }}>Copy and securely share this with the user.</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role Assignment</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ 
                    padding: '12px', border: '2px solid', 
                    borderColor: role === 'author' ? 'var(--blue)' : 'var(--border)', 
                    borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, 
                    background: role === 'author' ? 'var(--blue-dim)' : 'var(--bg2)',
                    transition: 'all 0.2s'
                  }}>
                    <input type="radio" value="author" checked={role === "author"} onChange={(e) => setRole(e.target.value)} style={{ display: 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: role === 'author' ? 'var(--blue)' : 'var(--text)' }}>Author</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>Editorial access</span>
                  </label>
                  <label style={{ 
                    padding: '12px', border: '2px solid', 
                    borderColor: role === 'admin' ? 'var(--primary)' : 'var(--border)', 
                    borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, 
                    background: role === 'admin' ? 'rgba(39, 65, 108, 0.05)' : 'var(--bg2)',
                    transition: 'all 0.2s'
                  }}>
                    <input type="radio" value="admin" checked={role === "admin"} onChange={(e) => setRole(e.target.value)} style={{ display: 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: role === 'admin' ? 'var(--primary)' : 'var(--text)' }}>Super Admin</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>Full control</span>
                  </label>
                </div>
              </div>

              {/* Extended Profile Section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, marginTop: 8 }}>
                <button 
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  style={{ 
                    width: '100%', background: 'none', border: 'none', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 0, cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Extended Profile (Optional)</span>
                  <span style={{ fontSize: 18, color: 'var(--text4)' }}>{showMore ? '−' : '+'}</span>
                </button>

                {showMore && (
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>Profile Picture</label>
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleImageUpload} 
                      />
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                         <div style={{ position: 'relative' }}>
                           <img 
                             src={image || "https://ui-avatars.com/api/?background=27416C&color=fff&name=" + (name || 'U')} 
                             style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', background: 'var(--bg2)', border: '1px solid var(--border)' }} 
                             alt=""
                           />
                           {image && (
                             <button 
                               type="button"
                               onClick={() => setImage("")}
                               style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10 }}
                             >
                               ×
                             </button>
                           )}
                         </div>
                         <button 
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           disabled={isUploading}
                           style={{ 
                             flex: 1, padding: '14px', borderRadius: 10, border: '1px dashed var(--border)', 
                             background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                             cursor: isUploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                           }}
                           className="upload-zone"
                         >
                           {isUploading ? <Loader2 size={16} className="spinning" /> : <ImageIcon size={16} />}
                           {isUploading ? "Uploading..." : image ? "Change Picture" : "Upload Picture"}
                         </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>Professional Bio</label>
                      <textarea 
                        value={bio} onChange={e => setBio(e.target.value)} 
                        placeholder="Short bio for author profile..."
                        style={{ width: '100%', height: 80, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 13, color: 'var(--text)', resize: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>Experience</label>
                        <input 
                          type="text" value={experience} onChange={e => setExperience(e.target.value)} 
                          placeholder="e.g. 5 Years" 
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 13, color: 'var(--text)' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>LinkedIn URL</label>
                        <input 
                          type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} 
                          placeholder="linkedin.com/in/..." 
                          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 13, color: 'var(--text)' }} 
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase' }}>Expertise (Tags)</label>
                      <input 
                        type="text" value={expertise} onChange={e => setExpertise(e.target.value)} 
                        placeholder="Python, ML, SQL (Comma separated)" 
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 13, color: 'var(--text)' }} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                style={{ 
                  width: '100%', padding: '14px', marginTop: 12, 
                  background: 'var(--primary)', color: '#fff', border: 'none', 
                  borderRadius: 12, fontSize: 15, fontWeight: 700, 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(39, 65, 108, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitting ? <Loader2 size={18} className="spinning" /> : <UserPlus size={18} />}
                Create Account
              </button>
            </form>
          </div>

          {/* User Roster Card */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Users size={20} color="var(--text2)" />
                 <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Team Directory</h2>
               </div>
               <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text4)', background: 'var(--bg2)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                 {authorsList.length} Members
               </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {authorsList.map((a) => (
                <div key={a.slug} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '14px 18px', background: 'var(--bg2)', 
                  border: '1px solid var(--border)', borderRadius: 14,
                  transition: 'all 0.15s hover:translate-x-1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={a.image || "/authors/default.svg"} 
                        alt="" 
                        style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--bg)' }} 
                        onError={(e) => e.target.src = "https://ui-avatars.com/api/?background=27416C&color=fff&bold=true&name=" + a.name} 
                      />
                      {a.is_super_admin && (
                        <div style={{ 
                          position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, 
                          background: 'var(--primary)', borderRadius: '50%', border: '2px solid var(--bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <ShieldAlert size={10} color="#fff" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={12} /> {a.email || "No email mapped"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.is_super_admin ? (
                      <span style={{ 
                        fontSize: 10, padding: '5px 10px', background: 'var(--blue-dim)', 
                        color: 'var(--blue)', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.02em', border: '1px solid rgba(59, 130, 246, 0.1)'
                      }}>
                        Super Admin
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: 10, padding: '5px 10px', background: 'var(--bg3)', 
                        color: 'var(--text3)', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.02em', border: '1px solid var(--border)'
                      }}>
                        Author
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {authorsList.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text4)', border: '2px dashed var(--border)', borderRadius: 16 }}>
                  No team members found. Provision your first account.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .admin-input:focus {
          border-color: var(--blue) !important;
          box-shadow: 0 0 0 3px var(--blue-dim);
          background: var(--bg) !important;
        }
      `}} />
    </div>
  );
}
