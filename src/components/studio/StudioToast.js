"use client";

import { useEffect } from "react";

export default function StudioToast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`studio-toast ${type}`}>
      {type === "ok" ? "✓" : type === "err" ? "✕" : "•"} {msg}
    </div>
  );
}
