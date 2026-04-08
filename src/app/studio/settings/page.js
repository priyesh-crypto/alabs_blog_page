"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { updateAuthorProfileAction } from "@/app/actions";
import { User, Mail, Link, Award, Briefcase, Image as ImageIcon, Loader2, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { authorProfile, loading: authLoading } = useAuth();
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [experience, setExperience] = useState("");
  const [expertise, setExpertise] = useState("");
  const [image, setImage] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!authLoading && authorProfile) {
      setName(authorProfile.name || "");
      setBio(authorProfile.bio || "");
      setLinkedin(authorProfile.linkedin || "");
      setExperience(authorProfile.experience || "");
      setExpertise(Array.isArray(authorProfile.expertise) ? authorProfile.expertise.join(", ") : "");
      setImage(authorProfile.image || "");
    } else if (!authLoading && !authorProfile) {
      router.replace("/studio/login");
    }
  }, [authLoading, authorProfile, router]);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const res = await updateAuthorProfileAction({ 
      name, bio, linkedin, experience, expertise, image 
    });
    
    if (res.success) {
      setMessage({ type: 'success', text: "Profile updated successfully! Refreshing to apply changes..." });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setMessage({ type: 'err', text: res.error || "Failed to update profile." });
    }
    
    setIsSubmitting(false);
  };

  if (authLoading) {
    return <div className="studio-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}><Loader2 className="spinning" size={32} color="var(--primary)" /></div>;
  }

  return (
    <div className="studio-wrapper" style={{ background: 'var(--bg)', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Navigation */}
        <button 
          onClick={() => router.push("/studio")} 
          style={{ 
            background: 'none', border: 'none', color: 'var(--text3)', 
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            fontSize: 14, fontWeight: 500, marginBottom: 40, padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back to Studio
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48, background: 'var(--primary)', padding: '32px', borderRadius: 20, color: '#fff', boxShadow: '0 10px 30px rgba(39, 65, 108, 0.15)' }}>
          <div style={{ position: 'relative' }}>
             <img 
               src={image || `https://ui-avatars.com/api/?background=fff&color=27416C&bold=true&name=${name || 'U'}`} 
               alt="" 
               style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)' }} 
             />
             <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#22c55e', width: 20, height: 20, borderRadius: '50%', border: '3px solid var(--primary)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Account Settings</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 15 }}>Manage your public editorial profile and professional details.</p>
          </div>
        </div>

        {message && (
          <div style={{ 
            padding: '14px 20px', borderRadius: 12, marginBottom: 32, fontSize: 14, fontWeight: 500,
            background: message.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)', 
            color: message.type === 'success' ? 'var(--green)' : 'var(--red)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
            {/* Left Column: Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <SectionTitle icon={<User size={18}/>} title="Basic Information" />
              
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" required />
              </div>

              <div>
                <Label>Email (Organization)</Label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                  <input 
                    type="email" 
                    value={authorProfile?.email || ""} 
                    disabled
                    style={{ 
                      width: '100%', padding: '12px 14px 12px 40px', borderRadius: 10, border: '1px solid var(--border)', 
                      background: 'var(--bg3)', fontSize: 14, color: 'var(--text3)', cursor: 'not-allowed'
                    }} 
                  />
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text4)' }}>Managed by organization. Contact admin to change.</p>
              </div>

              <div>
                <Label>Professional Bio</Label>
                <textarea 
                  value={bio} onChange={e => setBio(e.target.value)} 
                  placeholder="Share a bit about your professional background..."
                  style={{ width: '100%', height: 120, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg2)', fontSize: 14, color: 'var(--text)', resize: 'none', transition: 'border 0.2s' }}
                  className="settings-input"
                />
              </div>
            </div>

            {/* Right Column: Professional Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <SectionTitle icon={<Briefcase size={18}/>} title="Professional Links" />
               
               <div>
                 <Label>Profile Picture</Label>
                 <input 
                   ref={fileInputRef} 
                   type="file" 
                   accept="image/*" 
                   style={{ display: 'none' }} 
                   onChange={handleImageUpload} 
                 />
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   style={{ 
                     width: '100%', aspectRatio: '16/9', borderRadius: 16, border: '2px dashed var(--border)', 
                     background: 'var(--bg2)', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                   }}
                   className="upload-zone-settings"
                 >
                   {image ? (
                     <>
                       <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="upload-overlay">
                         <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Click to Change</span>
                       </div>
                     </>
                   ) : (
                     <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                       {isUploading ? <Loader2 size={32} className="spinning" color="var(--primary)" /> : <ImageIcon size={32} strokeWidth={1.5} />}
                       <div style={{ fontSize: 13, fontWeight: 600, marginTop: 12 }}>{isUploading ? "Uploading..." : "Click to Upload Photo"}</div>
                     </div>
                   )}
                 </div>
                 {image && (
                   <button 
                     type="button" 
                     onClick={(e) => { e.stopPropagation(); setImage(""); }}
                     style={{ marginTop: 8, fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                   >
                     Remove Photo
                   </button>
                 )}
               </div>

               <div>
                 <Label>LinkedIn Profile</Label>
                 <div style={{ position: 'relative' }}>
                    <Link size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                    <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/..." style={{ paddingLeft: 40 }} />
                 </div>
               </div>

               <div>
                 <Label>Total Experience</Label>
                 <Input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 8+ Years in AI" />
               </div>

               <div>
                 <Label>Expertise (Comma separated)</Label>
                 <div style={{ position: 'relative' }}>
                    <Award size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
                    <Input value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="Python, NLP, Strategy" style={{ paddingLeft: 40 }} />
                 </div>
               </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <button 
              type="button" 
              onClick={() => router.push("/studio")}
              style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Discard Changes
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              style={{ 
                padding: '12px 32px', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none', 
                fontWeight: 700, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(39, 65, 108, 0.2)'
              }}
            >
              {isSubmitting ? <Loader2 size={18} className="spinning" /> : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .settings-input:focus {
          border-color: var(--blue) !important;
          box-shadow: 0 0 0 3px var(--blue-dim);
          background: var(--bg) !important;
          outline: none;
        }
        .upload-zone-settings:hover { border-color: var(--blue); background: var(--bg3); }
        .upload-zone-settings:hover .upload-overlay { opacity: 1; }
      `}} />
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</label>;
}

function Input({ style, ...props }) {
  return (
    <input 
      type="text" 
      style={{ 
        width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', 
        background: 'var(--bg2)', fontSize: 14, color: 'var(--text)', transition: 'all 0.2s',
        ...style
      }} 
      className="settings-input"
      {...props}
    />
  );
}
