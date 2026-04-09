"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";

export default function StudioLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    } else {
      router.push("/studio");
      router.refresh(); // Force a refresh to load middleware/layout with new session
    }
  };

  return (
    <div className="studio-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg3)' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(15,37,84,0.08) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(76,127,210,0.05) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
      </div>

      <div style={{ zIndex: 1, width: '100%', maxWidth: 420, padding: 40, background: 'var(--bg)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
        
        {/* Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/white.svg" alt="Alabs" style={{ height: 58, width: 'auto', marginBottom: 16, display: 'inline-block' }} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', marginTop: 8 }}>Studio Access</h1>
          <p style={{ marginTop: 6, fontSize: 15, color: 'var(--text3)' }}>Sign in to manage editorial content.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {error && (
            <div style={{ padding: 14, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} />
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@analytixlabs.co.in"
                required
                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 15, color: 'var(--text)', outline: 'none', transition: 'border 0.2s' }}
                onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                onBlur={(e) => e.target.style.border = '1px solid var(--border)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 15, color: 'var(--text)', outline: 'none', transition: 'border 0.2s' }}
                onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                onBlur={(e) => e.target.style.border = '1px solid var(--border)'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: 14, marginTop: 8, background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s', opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text4)' }}>
          Access is restricted to authorized editorial staff.
        </div>
      </div>
      
    </div>
  );
}
