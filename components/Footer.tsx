import { DollarSign, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full py-12 mt-20 border-t border-white/5 bg-[#030617]/50 backdrop-blur-xl rounded-t-[2.5rem] overflow-hidden relative z-10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* الهوية: اللوجو والاسم والوصف */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#A65FFF] flex items-center justify-center shadow-2xl shadow-purple-500/40">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-[#00D2FF] to-[#A65FFF] bg-clip-text text-transparent tracking-tighter">MrCash</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Authorized Platform</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-medium">
              MrCash هي منصتك الموثوقة لتحويل وقتك إلى أرباح حقيقية من خلال إكمال المهام الرقمية وتجربة الألعاب والاستطلاعات.
            </p>
          </div>

          {/* الروابط وزر التيليجرام */}
          <div className="flex flex-col gap-6 items-center md:items-end">
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <a href="/terms-of-service" className="hover:text-purple-400 transition-colors">Terms of Service</a>
              <a href="/privacy-policy" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
              <a href="/" className="hover:text-purple-400 transition-colors">Home</a>
            </div>
            
            <a href="https://t.me/+HaIWYiOHx-FkNzY0" target="_blank" rel="noopener noreferrer" 
              className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#00D2FF]/10 hover:border-[#00D2FF]/30 transition-all group w-full max-w-xs shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 transition-colors shrink-0">
                <Send className="w-5 h-5 text-cyan-400 group-hover:text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">Telegram</span>
                <span className="text-[10px] text-slate-500 font-medium">انضم لمجتمعنا الخاص</span>
              </div>
            </a>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.3em]">© 2026 MR.CASH. ALL RIGHTS RESERVED.</p>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>
      </div>
    </footer>
  );
}
