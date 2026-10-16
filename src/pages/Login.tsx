import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate, Link, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Hammer, Sofa, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../config/firebase';
import { FullLogo } from '../components/layout/Logo';
import { Spinner } from '../components/ui/Loader';

const friendlyError = (err: unknown): string => {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password don’t match. If you created your account with Google, use “Continue with Google” (your Google password doesn’t work here), or tap “Forgot password?” to set a password for this app.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead, or use “Continue with Google” if you signed up with Google.';
    case 'auth/missing-email':
      return 'Type your email address first.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, then try again.';
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/network-request-failed':
      return 'Couldn’t reach the server. Check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google window. Allow pop-ups, or sign in with email.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/web-storage-unsupported':
      return 'Google sign-in doesn’t work inside this app’s browser. Open the link in Chrome or Safari, or sign in with email.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export const Login = () => {
  const [params] = useSearchParams();
  const [isLogin, setIsLogin] = useState(params.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState<'email' | 'google' | 'reset' | null>(null);

  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state?.from as { pathname?: string; search?: string } | undefined;
  const from = fromState?.pathname && fromState.pathname !== '/login'
    ? `${fromState.pathname}${fromState.search || ''}`
    : '/';

  if (!loading && user) return <Navigate to={from} replace />;

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy('email');
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email.trim(), password);
      else await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Type your email address above, then tap “Forgot password?” again.');
      return;
    }
    setBusy('reset');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo(`If an account exists for ${email.trim()}, we’ve emailed a link to set a new password. Check your inbox and spam folder.`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setBusy('google');
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid min-h-dvh bg-paper md:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (desktop) */}
      <aside className="woodgrain relative hidden flex-col justify-between p-12 text-paper md:flex">
        <FullLogo className="w-52 shadow-lg" />
        <div className="max-w-md">
          <p className="eyebrow !text-[#e9b48c]">Client portal &amp; catalogue</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] !text-paper">
            Boards, fittings and joinery, made to measure.
          </h1>
          <p className="mt-5 text-paper/70">
            Browse our materials and furniture, request a quote for custom work, and follow your order from
            workshop to delivery.
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-4 text-sm text-paper/80">
          <li className="flex items-center gap-2"><Hammer className="h-4 w-4 text-[#e9b48c]" /> Custom joinery</li>
          <li className="flex items-center gap-2"><Sofa className="h-4 w-4 text-[#e9b48c]" /> Furniture</li>
          <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#e9b48c]" /> Order on WhatsApp</li>
        </ul>
      </aside>

      {/* Form */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm animate-rise">
          <Link to={from} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand">
            <ArrowLeft className="h-4 w-4" /> Keep browsing
          </Link>
          <div className="mb-8 flex justify-center md:hidden">
            <FullLogo className="w-48" />
          </div>

          <h2 className="font-display text-3xl font-semibold">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-1 text-sm text-muted">
            {isLogin ? 'Sign in to place orders, track them and chat with us.' : 'Free, and it takes less than a minute. You\u2019ll be able to order, track orders and chat with us.'}
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {info && (
            <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              {info}
            </div>
          )}

          <button onClick={handleGoogleLogin} disabled={!!busy} className="btn-outline mt-6 w-full">
            {busy === 'google' ? <Spinner className="!h-5 !w-5 !border-2" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="email" inputMode="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="password" className="label !mb-0">Password</label>
                {isLogin && (
                  <button type="button" onClick={handleReset} disabled={!!busy}
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline">
                    {busy === 'reset' ? 'Sending…' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <input id="password" type="password" required minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} className="field"
                placeholder={isLogin ? 'Your password' : 'At least 6 characters'} />
            </div>
            <button type="submit" disabled={!!busy} className="btn-primary w-full">
              {busy === 'email' && <Spinner className="!h-5 !w-5 !border-2 !border-white/40 !border-t-white" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setInfo(''); }}
              className="font-semibold text-brand underline-offset-4 hover:underline">
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
