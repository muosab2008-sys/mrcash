'use client'; // ضروري لاستخدام نظام التبديل (useState)

import React, { useState } from 'react';

export default function LegalPage() {
  // تفعيل نظام التبديل بين الأقسام
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const lastUpdated = "March 24, 2026"; // تاريخ اليوم

  // مصفوفة السياسات كاملة (الـ 15 بنداً)
  const termsSections = [
    { t: "1. Acceptance of Terms", c: "By accessing or using the Website, creating an account, or participating in any offers or reward programs, you agree to be bound by these Terms and our Privacy Policy. If you do not agree with these Terms, you must not access or use the Website." },
    { t: "2. Eligibility", c: "To use Mr. Cash you must: Be at least 16 years old. Have the legal ability to agree to these Terms. Use only one account per person and per household. Creating multiple accounts, fake accounts, or accounts using another person’s identity is strictly prohibited and may result in account suspension and loss of rewards." },
    { t: "3. Changes to the Terms", c: "Mr. Cash reserves the right to modify or update these Terms at any time. Any updates will take effect immediately once published on the Website. Your continued use of the Website after changes are posted means you accept the revised Terms." },
    { t: "4. Access to the Website", c: "Mr. Cash grants you a limited, non-exclusive, and revocable right to access and use the Website for personal use only. You agree to provide accurate registration information, maintain the security of your account, and follow all applicable laws when using the platform. We may suspend or terminate access to the Website at any time if these Terms are violated." },
    { t: "5. Rewards Program", c: "Mr. Cash provides users with opportunities to earn points, coins, credits, or rewards by completing activities such as: Playing games, Completing surveys, Trying apps, Watching advertisements, and Completing offers from partner offerwalls." },
    { t: "6. Rewards Have No Monetary Value", c: "Rewards earned on Mr. Cash have no direct cash value, cannot be transferred between users, and cannot be sold or exchanged outside the platform." },
    { t: "7. Offer Completion and Tracking", c: "Rewards will only be credited when an offer is completed correctly and successfully tracked by the partner provider. Mr. Cash is not responsible for untracked or rejected offers when decisions are made by the third-party partner." },
    { t: "8. Redeeming Rewards", c: "Users may redeem rewards once they reach the minimum withdrawal threshold. Mr. Cash reserves the right to delay reward payouts for security checks and hold rewards for up to 90 days if required." },
    { t: "9. Identity Verification", c: "To prevent fraud and comply with legal obligations, Mr. Cash may request identity verification before allowing withdrawals. Failure to complete verification may result in withdrawal restrictions." },
    { t: "10. Inactive Accounts", c: "Accounts that remain inactive for 12 months may be closed. If an account is closed due to inactivity, remaining rewards may expire." },
    { t: "11. FRAUD (IMPORTANT)", c: "Users are strictly prohibited from: Creating multiple accounts, Using VPNs or proxies, Using bots or automation tools, Faking offer completion, Manipulating surveys. Violation results in immediate permanent account ban." },
    { t: "12. Third-Party Services", c: "Mr. Cash works with external providers (Offerwalls, Payment providers). We do not control these third-party services and are not responsible for their policies or tracking systems." },
    { t: "13. Liability", c: "Mr. Cash provides the Website and services 'as is' without guarantees. We will not be liable for any indirect damages, lost rewards, or service interruptions." },
    { t: "14. Account Termination", c: "Mr. Cash reserves the right to suspend or terminate any account if these Terms are violated, fraudulent activity is detected, or security concerns arise." },
    { t: "15. Contact Information", c: "For support, questions, or legal requests, please contact us via our official support channels at support@mrcash.vercel.app." }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 p-4 md:p-12 font-sans selection:bg-cyan-500 selection:text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section (تصميم شفاف) */}
        <header className="mb-12 text-center p-8 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5">
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-purple-400">
            Legal Center | Mr. Cash
          </h1>
          <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">
            Official Guidelines & Data Protection
          </p>
        </header>

        {/* --- نظام التبديل (Tabs System) كما في الصورة --- */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-1.5 p-1.5 bg-[#0f172a] rounded-full border border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveTab('terms')}
              className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 tracking-tight ${activeTab === 'terms' ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              Terms of Service
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 tracking-tight ${activeTab === 'privacy' ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              Privacy Policy
            </button>
          </div>
        </div>

        {/* --- محتوى البطاقة (Glassmorphism Card) --- */}
        <main className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-14 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          
          {/* تأثير توهج بنفسجي خلفي */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>

          {activeTab === 'terms' ? (
            // محتوى صفحة TERMS الكامل (15 بند)
            <div className="space-y-12 animate-fadeIn">
              <header className="mb-10 text-center border-b border-white/5 pb-8">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h2>
                <p className="text-slate-500 text-sm mt-1">Acceptable use policy and platform rules</p>
              </header>

              <div className="space-y-10">
                {termsSections.map((s, i) => (
                  <section key={i} className={i === 10 ? "bg-red-950/20 p-6 rounded-2xl border border-red-900/30" : ""}>
                    <h3 className={`text-xl font-bold mb-3 flex items-center gap-3 ${i === 10 ? "text-red-400" : "text-white"}`}>
                      <span className={`w-1 h-6 rounded-full ${i === 10 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-cyan-500 shadow-[0_0_10px_#22d3ee]"}`}></span>
                      {s.t}
                    </h3>
                    <p className={`text-sm md:text-base leading-relaxed ${i === 10 ? "text-gray-300" : "text-slate-400"}`}>{s.c}</p>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            // محتوى صفحة PRIVACY (اختصار احترافي للـ GDPR)
            <div className="space-y-12 animate-fadeIn">
              <header className="mb-10 text-center border-b border-white/5 pb-8">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h2>
                <p className="text-slate-500 text-sm mt-1">How we protect your data at Mr. Cash</p>
              </header>

              <div className="space-y-10 text-slate-400 text-sm md:text-base leading-relaxed">
                <section>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-white">
                    <span className="w-1 h-6 bg-purple-500 shadow-[0_0_10px_#a855f7] rounded-full"></span>
                    What We Collect
                  </h3>
                  <p>We collect essential data to process your rewards: Username, Email address, IP address, and technical details of completed offers. We **do not** collect personal financial data.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-white">
                    <span className="w-1 h-6 bg-purple-500 shadow-[0_0_10px_#a855f7] rounded-full"></span>
                    Third-Party Sharing
                  </h3>
                  <p>To verify offer completion, we share your anonymized User ID with partners like TimeWall or CPX Research. This is necessary to track points accurately.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-white">
                    <span className="w-1 h-6 bg-purple-500 shadow-[0_0_10px_#a855f7] rounded-full"></span>
                    GDPR & User Rights
                  </h3>
                  <p>You have the right to request access, correction, or deletion of your data. Contact our legal team via support@mrcash.com to exercise these rights.</p>
                </section>
              </div>
            </div>
          )}

        </main>

        <footer className="mt-16 text-center text-[11px] text-slate-600 font-mono tracking-widest">
          © {new Date().getFullYear()} Mr. Cash. Officially Verified Placement
        </footer>

      </div>
    </div>
  );
}
