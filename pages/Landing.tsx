
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      <header className="sticky top-0 z-50 w-full border-b border-solid border-[#f1f2f4] dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md no-print">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="size-8 rounded-lg overflow-hidden border border-[#f1f2f4] shadow-sm">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tighter">KVoice</h2>
          </div>
          <nav className="flex items-center gap-4 sm:gap-10">
            <button onClick={() => navigate('/login')} className="text-xs sm:text-sm font-black uppercase tracking-widest hover:text-primary transition-colors">Login</button>
            <button onClick={() => navigate('/login')} className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all shadow-md shadow-primary/20">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-24 sm:pb-32">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div className="flex flex-col gap-6 sm:gap-8 text-center lg:text-left items-center lg:items-start">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">
                <span className="material-symbols-outlined text-sm">verified</span> Verified GH Invoicing
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight text-[#121417] dark:text-white">
                Invoicing for the <span className="text-primary underline decoration-primary/30">Ghanaian</span> Hustle
              </h1>
              <p className="text-[#667385] dark:text-gray-400 text-base sm:text-xl leading-relaxed max-w-[540px]">
                Built for the modern GH freelancer. Accept MoMo payments, track Cedis, and share professional invoices via WhatsApp instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-2xl text-sm sm:text-lg font-black uppercase tracking-wider transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2">
                  Start Free Now <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[#121417] dark:text-white px-8 py-5 rounded-2xl text-sm sm:text-lg font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm">
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-10 -right-10 size-64 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative bg-white dark:bg-white/5 p-4 rounded-3xl shadow-2xl border border-[#f1f2f4] dark:border-white/10">
                <div className="aspect-[4/3] bg-background-light dark:bg-background-dark/50 rounded-2xl overflow-hidden relative border border-[#f1f2f4] dark:border-white/5 shadow-inner p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-primary/20 rounded"></div>
                      <div className="h-8 w-48 bg-primary/10 rounded"></div>
                    </div>
                    <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold">₵</div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-[#dce0e4] dark:border-white/10">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-40 bg-[#dce0e4] dark:bg-white/10 rounded"></div>
                      <div className="h-4 w-20 bg-primary/20 rounded"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-24 bg-[#dce0e4] dark:bg-white/10 rounded"></div>
                      <div className="h-4 w-20 bg-primary/20 rounded"></div>
                    </div>
                  </div>
                  <div className="pt-8 flex justify-end">
                    <div className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span> Payment Link Active (MoMo)
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-[#25D366] text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
                  <span className="material-symbols-outlined">chat</span>
                  <span className="text-sm font-bold">Sent via WhatsApp!</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {[
                { label: 'SMEs Trusted', value: '500+' },
                { label: 'Invoices Sent', value: '10k+' },
                { label: 'GHS Processed', value: '₵2.5M' },
                { label: 'Success Rate', value: '99.9%' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-[#667385] dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-primary dark:text-white text-3xl sm:text-4xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 py-12">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <p className="text-[#667385] dark:text-gray-400 text-xs font-bold uppercase tracking-widest">© 2026 KVoice. Built with ❤️ in Accra.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
