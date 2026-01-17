
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile, getUserProfile } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { currentUser } = useAuth(); // Assuming useAuth is exported from context/AuthContext

  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(userCredential.user, {
          name: email.split('@')[0], // Default name from email
          email: email,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists, if not create it
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await createUserProfile(user, {
          name: user.displayName || user.email?.split('@')[0] || '',
          email: user.email || '',
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Failed to log in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between border-b border-[#dce0e4] dark:border-gray-800 bg-white dark:bg-gray-900 px-6 sm:px-10 lg:px-20 py-4 no-print">
        <div className="flex items-center gap-2.5 text-primary">
          <div className="size-8 sm:size-10 rounded-xl overflow-hidden border border-[#dce0e4] shadow-sm">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tighter">KVoice</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-gray-500 font-bold uppercase tracking-widest">
            {isRegistering ? 'Have account?' : 'New here?'}
          </span>
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 sm:p-12">
          <div className="mb-8 text-center">
            <div className="size-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl text-primary">{isRegistering ? 'person_add' : 'vape_free'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{isRegistering ? 'Get Started' : 'Welcome Back'}</h1>
            <p className="text-[#667385] dark:text-gray-400 text-sm font-medium">
              {isRegistering ? 'Experience the future of Ghanaian invoicing.' : 'Login to manage your business with MoMo.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                className="w-full rounded-2xl border-gray-100 bg-gray-50 dark:bg-gray-800 h-12 px-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all border-none"
                placeholder="kwame@business.gh"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                {!isRegistering && <a className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline" href="#">Forgot?</a>}
              </div>
              <input
                className="w-full rounded-2xl border-gray-100 bg-gray-50 dark:bg-gray-800 h-12 px-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all border-none"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              className="w-full bg-primary text-white h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isRegistering ? 'Start My Workspace' : 'Continue to Dashboard')}
            </button>

            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#dce0e4]"></div></div>
              <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
            </div>

            <button
              className="w-full flex items-center justify-center gap-3 rounded-xl h-12 border border-[#dce0e4] font-bold text-sm hover:bg-gray-50 transition-colors"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
              </svg>
              Sign {isRegistering ? 'up' : 'in'} with Google
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-dashed border-[#dce0e4] flex justify-center gap-6">
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="material-symbols-outlined text-sm">payments</span>
              <span className="text-[10px] font-black uppercase tracking-widest">GHS Support</span>
            </div>
            <div className="flex items-center gap-1.5 text-green-600">
              <span className="material-symbols-outlined text-sm">smartphone</span>
              <span className="text-[10px] font-black uppercase tracking-widest">MoMo Ready</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
