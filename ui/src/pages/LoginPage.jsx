import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Moon, Shield, Sparkles, Sun } from 'lucide-react';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import AppIconMark from '../components/ui/AppIconMark.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { fallbackLetterFromAppName } from '../utils/appIcon.js';
import { notify } from '../utils/toast.js';

export default function LoginPage() {
  const { t } = useTranslation();
  const { authenticated, login, credentialsLoaded } = useAuth();
  const { appName, appIconUrl } = useSettings();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const authToastShown = useRef(false);

  useEffect(() => {
    if (location.state?.authRequired && !authToastShown.current) {
      authToastShown.current = true;
      notify.error(t('auth.loginRequired'), t('auth.loginRequiredDesc'));
      navigate('/login', { replace: true, state: {} });
    }
  }, [location.state?.authRequired, navigate, t]);

  if (credentialsLoaded && authenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        notify.success(t('auth.loginSuccess'));
        navigate('/', { replace: true });
      } else {
        notify.error(t('auth.loginFailed'), t('auth.loginFailedDesc'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell app-scroll relative flex min-h-screen flex-col lg:flex-row">
      <div className="login-shell__mesh pointer-events-none" aria-hidden />

      <button
        type="button"
        onClick={toggleTheme}
        className="login-shell__theme-btn absolute end-4 top-4 z-20"
        aria-label={isDark ? t('topbar.lightMode') : t('topbar.darkMode')}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <section className="login-shell__hero relative z-10 flex flex-1 flex-col justify-between p-8 pb-12 pt-16 lg:p-12 lg:pt-12">
        <div className="flex items-center gap-3">
          <AppIconMark
            appIconUrl={appIconUrl}
            fallbackLetter={fallbackLetterFromAppName(appName)}
            className="h-12 w-12 shadow-xl ring-2 ring-white/20"
            letterClassName="text-lg font-extrabold text-white"
            roundedClassName="rounded-2xl"
            showGradientFallback
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{appName}</p>
            <p className="text-xs text-white/50">{t('nav.tailorErp')}</p>
          </div>
        </div>

        <div className="mt-10 max-w-md lg:mt-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
            <Sparkles size={14} className="text-secondary" />
            {t('auth.welcomeBadge')}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.35rem]">
            {t('auth.welcomeTitle')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">{t('auth.heroLine')}</p>

          <ul className="mt-8 hidden space-y-3 sm:block">
            {[t('auth.heroPoint1'), t('auth.heroPoint2'), t('auth.heroPoint3')].map((line) => (
              <li key={line} className="flex items-center gap-2 text-sm text-white/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-secondary">
                  <ArrowRight size={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 hidden text-xs text-white/40 lg:block">© {new Date().getFullYear()} {appName}</p>
      </section>

      <section className="login-shell__panel relative z-10 flex flex-1 items-center justify-center p-6 pb-10 pt-4 lg:p-10">
        <div className="login-card w-full max-w-[420px]">
          <div className="login-card__glow pointer-events-none" aria-hidden />

          <div className="relative px-8 pb-8 pt-10 sm:px-10">
            <div className="mb-8 text-center lg:text-start">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20 lg:mx-0">
                <Lock className="text-accent" size={26} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-ink">{t('auth.signIn')}</h2>
              <p className="mt-1.5 text-sm text-ink-muted">{t('auth.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form space-y-1">
              <div className="mb-4">
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-ink-secondary">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                    size={18}
                    aria-hidden
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="input-field w-full rounded-2xl border-2 bg-surface py-3.5 ps-11 pe-3 text-base text-ink outline-none transition shadow-sm focus:shadow-md focus:shadow-accent/10"
                  />
                </div>
              </div>

              <PasswordInput
                label={t('auth.password')}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputClassName="rounded-2xl py-3.5 shadow-sm focus:shadow-md focus:shadow-accent/10"
              />

              <button type="submit" disabled={submitting} className="group login-submit mt-6">
                <span>{submitting ? t('auth.signingIn') : t('auth.signIn')}</span>
                {!submitting && <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />}
              </button>
            </form>

            <div className="login-secure-badge mt-8 flex items-center justify-center gap-2 text-xs text-ink-muted">
              <Shield size={14} className="text-success" />
              {t('auth.secureBadge')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
