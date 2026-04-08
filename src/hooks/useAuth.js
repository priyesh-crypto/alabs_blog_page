"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadIdentity() {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error || !currentUser) {
          if (mounted) {
            setUser(null);
            setAuthorProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) setUser(currentUser);

        // Cross-reference with authors table
        if (currentUser.email) {
          const { data: author } = await supabase
            .from("authors")
            .select("*")
            .ilike("email", currentUser.email)
            .maybeSingle();

          if (mounted && author) {
            setAuthorProfile(author);
          }
        }
      } catch (error) {
        console.error("Auth hydration failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadIdentity();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadIdentity();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/studio/login";
  };

  return { user, authorProfile, loading, signOut };
}
