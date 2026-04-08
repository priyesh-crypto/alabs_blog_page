"use client";

import { useState } from "react";

export default function ScheduleModal({ onConfirm, onClose, loading }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");

  return (
    <div className="sched-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sched-modal">
        <div className="sched-title">Schedule Post</div>
        <div className="sched-sub">Choose when this post goes live</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div className="sched-label">Date</div>
            <input
              className="sched-input"
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <div className="sched-label">Time</div>
            <input
              className="sched-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div className="sched-actions">
          <button className="sched-cancel" onClick={onClose}>Cancel</button>
          <button
            className="sched-confirm"
            onClick={() => onConfirm(`${date} ${time}`)}
            disabled={!date || loading}
          >
            {loading ? "Scheduling…" : "Confirm Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
