'use client'; // ضروري لاستخدام الـuseState ونظام التبديل

import React, { useState } from 'react';

export default function LegalCenter() {
  // تفعيل نظام التبديل بين صفحة الـ Terms وصفحة الـ Privacy
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const lastUpdated = "March 24, 2026"; // تاريخ اليوم

  // مصفوفة السياسات كاملة (الـ 15 بنداً كما هي)
  const termsSections = [
    { t: "1. Acceptance of Terms", c: "These Terms of Service ("Terms") govern your access to and use of the website Mr. Cash ("Website", "Platform", "Service"). By accessing or using the Website, creating an account, or participating in any offers or reward programs, you agree to be bound by these Terms and our Privacy Policy. If you do not agree with these Terms, you must not access or use the Website." },
    { t: "2. Eligibility", c: "To use Mr. Cash you must: Be at least 16 years old. Have the legal ability to agree to these Terms. Use only one account per person and per household. Creating multiple accounts, fake accounts, or accounts using another person’s identity is strictly prohibited and may result in account suspension and loss of rewards." },
    { t: "3. Changes to the Terms", c: "Mr. Cash reserves the right to modify or update these Terms at any time. Any updates will take effect immediately once published on the Website. Your continued use of the Website after changes are posted means you accept the revised Terms." },
    { t: "4. Access to the Website", c: "Mr. Cash grants you a limited, non-exclusive, and revocable right to access and use the Website for personal use only. You agree to provide accurate registration information, maintain the security of your account, and follow all applicable laws when using the platform. We may suspend or terminate access to the Website at any time if these Terms are violated." },
    { t: "5. Rewards Program", c: "Mr. Cash provides users with opportunities to earn points, coins, credits, or rewards ("Rewards") by completing activities such as: Playing games, Completing surveys, Trying apps, Watching advertisements, Completing offers from partner offerwalls, and Participating in promotions. These activities are collectively referred to as Offers." },
    { t: "6. Rewards Have No Monetary Value", c: "Rewards earned on Mr. Cash: Have no direct cash value, cannot be transferred between users, and cannot be sold or exchanged outside the platform. Rewards only gain value when redeemed through the payout methods available on the Website." },
    { t: "7. Offer Completion and Tracking", c: "Rewards will only be credited when an offer is completed correctly and successfully tracked by the partner provider. Mr. Cash is not responsible for untracked or rejected offers when decisions are made by the third-party partner." },
    { t: "8. Redeeming Rewards", c: "Users may redeem rewards once they reach the minimum withdrawal threshold displayed on the platform. Before the first withdrawal, users may be required to complete identity verification (KYC) or other security checks. Mr. Cash reserves the right to: Delay reward payouts for security checks, Review suspicious activity, and Hold rewards for up to 90 days if required. All reward redemptions are final once processed." },
    { t: "9. Identity Verification", c: "To prevent fraud and comply with legal obligations, Mr. Cash may request identity verification before allowing withdrawals. Failure to complete verification may result in withdrawal restrictions." },
    { t: "10. Inactive Accounts", c: "Accounts that remain inactive for 12 months may be closed. If an account is closed due to inactivity, remaining rewards may expire." },
    { t: "11. FRAUD (IMPORTANT)", c: "Users are strictly prohibited from: Creating multiple accounts, Using VPNs or proxies, Using bots or automation tools, Faking offer completion, or Manipulating surveys or games. Violation of these rules leads to Account suspension and forfeiture of all points." },
    { t: "12. Third-Party Services", c: "Mr. Cash works with external providers (Offerwalls, Survey companies, Payment providers). We do not control these third-party services and are not responsible for their policies, tracking systems, or decisions regarding rewards. Users should review the terms of these third-party services when participating in their offers." },
    { t: "13. Limitation of Liability", c: "Mr. Cash provides the Website and services 'as is' without guarantees. We aren't liable for any indirect damages, lost rewards, or service interruptions." },
    { t: "14. Account Termination", c: "Mr. Cash reserves the right to suspend or terminate any account if these Terms are violated or fraudulent activity is detected." },
    { t: "15. Contact Information", c: "For support, questions, or legal requests, please contact us at: support@mrcash.vercel.app." }
  ];

  return (
    <div className="min-h-screen bg-[#030617] text-slate-300 p-4 md:p-10 font-sans leading-relaxed selection:bg-purple-600 selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section (تصميم زجاجي خفيف) */}
        <header className="mb-10 text-center p-8 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 relative overflow-hidden">
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter text-white">
            <span className="text-purple-500">Legal</span> Center | Mr. Cash
          </h1>
          <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">
            Official Guidelines & Data Protection
          </p>
        </header>

        {/* --- نظام التبديل (Tabs) في الأعلى تماماً كما في الصورة --- */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-1.5 p-1.5 bg-[#0f172a] rounded-full border border-white/5 shadow-inner">
            <button 
              onClick={() => setActiveTab('terms')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'terms' ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              Terms of Service
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === 'privacy' ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              Privacy Policy
            </button>
          </div>
        </div>

        {/* --- محتوى البطاقة (Glassmorphism Card) --- */}
        <main className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          
          {/* تأثير توهج بنفسجي خلفي */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

          {activeTab === 'terms' ? (
            // محتوى صفحة TERMS الكامل (15 بند بالكامل)
            <div className="space-y-12 animate-fadeIn">
              <header className="mb-10 border-b border-white/5 pb-8">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Terms of Service</h2>
                <p className="text-purple-400 text-sm mt-1 uppercase font-mono">Last Updated: {lastUpdated}</p>
              </header>

              <div className="space-y-10">
                {termsSections.map((s, i) => (
                  <section key={i} className={i === 10 ? "bg-red-950/20 p-6 rounded-2xl border border-red-900/30" : ""}>
                    <h3 className={`text-xl font-bold mb-3 flex items-center gap-3 ${i === 10 ? "text-red-400" : "text-white"}`}>
                      <span className={`w-1 h-6 rounded-full ${i === 10 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" : "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]"}`}></span>
                      {s.t}
                    </h3>
                    <p className={`text-sm md:text-base leading-relaxed ${i === 10 ? "text-gray-300" : "text-slate-400"}`}>{s.c}</p>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            // محتوى صفحة PRIVACY (اختصار احترافي)
            <div className="space-y-12 animate-fadeIn">
              <header className="mb-10 border-b border-white/5 pb-8">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Privacy Policy</h2>
                <p className="text-cyan-400 text-sm mt-1 uppercase font-mono">Last Updated: {lastUpdated}</p>
              </header>

              <div className="space-y-10 text-slate-400 text-sm md:text-base leading-relaxed">
                <section>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-white underline decoration-cyan-500">
                    What Data We Collect
                  </h3>
                  <p>We collect essential data to process your rewards: Username, Email address, IP address, and technical details of completed offers. We do not collect personal financial data.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-white underline decoration-cyan-500">
                    Third-Party Partners
                  </h3>
                  <p>To verify offer completion, we share your anonymized User ID with partners like TimeWall, CPX Research, and Wannads. They have their own privacy policies.</p>
                </section>
                <section>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-3 text-white underline decoration-cyan-500">
                    Your Rights
                  </h3>
                  <p>You have the right to request access, correction, or deletion of your data. Contact our legal team via support@mrcash.com for assistance.</p>
                </section>
              </div>
            </div>
          )}

        </main>

        <footer className="mt-16 text-center text-[10px] text-slate-700 font-mono tracking-widest">
          © {new Date().getFullYear()} Mr. Cash. Officially Verified Platform
        </footer>

      </div>
    </div>
  );
}
