
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const businesses = [
    "Jumia Ghana", "MTN Tech Hub", "Ahaspora", "Impact Hub Accra",
    "mPharma", "Swoove", "Jetstream", "Farmerline", "Ozé"
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] overflow-x-hidden text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-40 dark:opacity-20 pointer-events-none -z-10"></div>

      {/* Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-5xl">
        <nav className="glass rounded-[2rem] px-6 py-3 flex items-center justify-between border-white/40 dark:border-slate-800/50 shadow-2xl shadow-slate-900/5 dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 p-1 bg-white dark:bg-slate-900">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h2 className="text-xl font-black tracking-tighter bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">KVoice</h2>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing', 'Security', 'Contact'].map(link => (
              <button key={link} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors">
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary transition-colors"
            >
              Log In
            </button>
            <Button
              onClick={() => navigate('/login')}
              size="md"
              className="px-6 h-10 text-[10px] font-black uppercase tracking-widest rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:scale-105 transition-transform"
            >
              Start Free
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 lg:pt-56 pb-20 lg:pb-32 px-6">
          <motion.div
            style={{ opacity, scale }}
            className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center"
          >
            {/* Text Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-8 text-center lg:text-left items-center lg:items-start relative z-10"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-primary"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Trusted by Ghana's Top Merchats
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-slate-900 dark:text-white"
              >
                Invoicing for the <br />
                <span className="text-gradient italic">Next Wave.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-slate-500 dark:text-slate-400 text-lg lg:text-xl font-medium max-w-xl leading-relaxed"
              >
                Modern billing for modern business. Integrated MoMo prompts, instant WhatsApp shares, and automated GHS tax compliance.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="h-16 px-10 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105 transition-transform"
                >
                  Get Early Access
                  <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 px-10 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  View Live Template
                </Button>
              </motion.div>
            </motion.div>

            {/* Interactive 3D Mockup Container */}
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: 20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:h-[600px] w-full"
            >
              {/* Main Hero Asset */}
              <div className="relative z-10 w-full animate-float">
                <Card className="p-2 sm:p-4 rounded-[3.5rem] glass-darker shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border-white/50 dark:border-slate-800/10 backdrop-blur-3xl">
                  <div className="relative rounded-[3rem] overflow-hidden aspect-square lg:aspect-auto lg:h-[500px] bg-slate-900">
                    <img
                      src="/hero-3d.png"
                      alt="Premium Interface"
                      className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                    {/* Floating UI Element */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="absolute bottom-8 left-8 right-8 glass p-6 rounded-3xl border-white/30"
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Invoice</p>
                          <p className="font-black text-lg">₵ 12,450.00</p>
                        </div>
                        <div className="size-12 rounded-2xl bg-accent-green/20 text-accent-green flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </Card>
              </div>

              {/* Secondary Floating Card */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-6 z-20 hidden lg:block"
              >
                <Card className="p-5 glass border-white/40 shadow-2xl rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                      <span className="material-symbols-outlined text-2xl">bolt</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-xs">Instant Setup</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Done in 60s</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Trusted By Marquee */}
        <section className="py-20 border-y border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex marquee whitespace-nowrap gap-20 items-center">
            {[...businesses, ...businesses].map((biz, i) => (
              <span key={i} className="text-2xl lg:text-4xl font-black text-slate-300 dark:text-slate-800 hover:text-primary transition-colors cursor-default">
                {biz}
              </span>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 bg-slate-50/30 dark:bg-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-24 max-w-2xl mx-auto space-y-6"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Capabilities</span>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter">Everything you need <br /> to <span className="text-gradient">grow your hustle.</span></h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg lg:text-xl">
                We've automated the boring stuff so you can focus on building your empire.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "MoMo Pay Ready",
                  desc: "Generate MTN, Telecel, and AT cash prompts directly on your invoices.",
                  icon: "qr_code_2",
                  color: "from-amber-400 to-orange-500",
                  delay: 0.1
                },
                {
                  title: "Tax Automation",
                  desc: "Automated NHIL, GETFund, COVID Levy & VAT calculations for GRA compliance.",
                  icon: "gavel",
                  color: "from-blue-500 to-indigo-600",
                  delay: 0.2
                },
                {
                  title: "WhatsApp First",
                  desc: "Clients get their professional PDF bills on WhatsApp. Higher open rates guaranteed.",
                  icon: "forum",
                  color: "from-emerald-400 to-green-600",
                  delay: 0.3
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: feature.delay }}
                >
                  <Card hoverEffect className="p-10 group relative overflow-hidden h-full border-slate-100 dark:border-slate-800">
                    <div className={`absolute -right-4 -top-4 size-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                      <span className="material-symbols-outlined text-[10rem]">{feature.icon}</span>
                    </div>
                    <div className={`size-16 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-xl shadow-slate-900/5 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-white text-3xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed leading-relaxed">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-primary rounded-[4rem] p-12 lg:p-32 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(29,77,144,0.3)]"
            >
              <div className="absolute top-0 right-0 size-96 bg-blue-400 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-20"></div>
              <div className="absolute bottom-0 left-0 size-96 bg-accent-green rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 opacity-20"></div>

              <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                <h2 className="text-4xl lg:text-7xl font-black tracking-tighter leading-tight">Paid Faster. <br /> Pay Better.</h2>
                <p className="text-white/70 text-lg lg:text-xl font-medium max-w-xl mx-auto">
                  Join over 500+ merchants simplifyng their billings today. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    size="lg"
                    className="h-16 px-12 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl bg-white text-primary hover:bg-slate-50"
                    onClick={() => navigate('/login')}
                  >
                    Create Free Account
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 px-12 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border-white/20 text-white hover:bg-white/10"
                  >
                    Schedule Demo
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="py-20 px-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="size-8 rounded-lg" />
            <h2 className="text-xl font-black tracking-tighter">KVoice</h2>
          </div>

          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            &copy; {new Date().getFullYear()} • GHANA DIGITAL ECONOMY
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
