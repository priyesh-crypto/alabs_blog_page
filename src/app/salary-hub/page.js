"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getRoles, getLocations, getExperiences, getSalaryRange } from "@/lib/data";

export default function SalaryHub() {
  const roles = getRoles();
  const locations = getLocations();
  const experiences = getExperiences();

  const [role, setRole] = useState(roles[0]);
  const [location, setLocation] = useState(locations[0]);
  const [exp, setExp] = useState(experiences[0]);

  const salary = getSalaryRange(role, location, exp);

  return (
    <div className="min-h-screen flex flex-col pt-16 font-[family-name:var(--font-body)] bg-background dark:bg-[#0b1326] text-on-background dark:text-[#dae2fd]">
      <Navbar activeCategory="Salary Hub" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col md:flex-row gap-12">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] mb-4 tracking-tight">
              Tech Salary <span className="text-primary dark:text-[#adc6ff]">Estimator</span>
            </h1>
            <p className="text-on-surface-variant dark:text-[#c2c6d6] text-lg leading-relaxed max-w-lg">
              Get real-time market data on base compensation for data and AI roles across India's top tech hubs.
            </p>
          </div>

          <div className="bg-surface-container-lowest dark:bg-[#131b2e] p-8 rounded-2xl border border-outline-variant/20 dark:border-[#424754]/30 shadow-sm space-y-6">
            <h3 className="font-bold text-lg font-[family-name:var(--font-headline)]">Your Profile</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold font-[family-name:var(--font-label)] uppercase tracking-wider text-secondary dark:text-[#8c909f]">
                  Job Role
                </label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-4 bg-surface-container dark:bg-[#060e20] border-none rounded-xl text-on-surface dark:text-[#dae2fd] outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold font-[family-name:var(--font-label)] uppercase tracking-wider text-secondary dark:text-[#8c909f]">
                  Years of Experience
                </label>
                <select 
                  value={exp} 
                  onChange={(e) => setExp(e.target.value)}
                  className="w-full p-4 bg-surface-container dark:bg-[#060e20] border-none rounded-xl text-on-surface dark:text-[#dae2fd] outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {experiences.map(e => <option key={e} value={e}>{e} Years</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold font-[family-name:var(--font-label)] uppercase tracking-wider text-secondary dark:text-[#8c909f]">
                  Location
                </label>
                <select 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-4 bg-surface-container dark:bg-[#060e20] border-none rounded-xl text-on-surface dark:text-[#dae2fd] outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="w-full md:w-1/2 md:py-16">
          <div className="bg-primary text-on-primary dark:bg-[#1f2937] dark:text-[#dae2fd] p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden border border-outline/10">
            {/* Ambient Background Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>

            <div className="relative z-10 flex flex-col gap-8">
              <div>
                <span className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] font-bold opacity-80 mb-2 block">
                  Estimated Base Compensation
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-medium">₹</span>
                  <span className="text-6xl md:text-7xl font-extrabold font-[family-name:var(--font-headline)] tracking-tighter">
                    {salary.median}
                  </span>
                  <span className="text-xl font-medium opacity-80">LPA</span>
                </div>
              </div>

              <div className="bg-black/10 dark:bg-black/30 w-full h-[1px]" />

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-[family-name:var(--font-label)] uppercase tracking-widest opacity-70 mb-1">
                    Lower Band
                  </span>
                  <span className="text-2xl font-bold">₹ {salary.min} L</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-[family-name:var(--font-label)] uppercase tracking-widest opacity-70 mb-1">
                    Upper Band
                  </span>
                  <span className="text-2xl font-bold">₹ {salary.max} L</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white/10 dark:bg-white/5 rounded-xl border border-white/20 dark:border-white/10 flex gap-4 items-start backdrop-blur-sm">
                <span className="material-symbols-outlined text-green-300">trending_up</span>
                <p className="text-sm leading-relaxed text-white/90 dark:text-[#c2c6d6]">
                  The market demand for <strong>{role}</strong> roles in <strong>{location}</strong> is currently high. Candidates with {exp} years of experience are receiving a ~12% premium compared to last year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav activePage="home" />
    </div>
  );
}
