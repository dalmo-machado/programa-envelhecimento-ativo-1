
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { useUserRole } from '../context/UserRoleContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { Language, UserRole } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// The researcher's access code is fixed and public; only the password is secret.
const RESEARCHER_CODE = 'RESEARCHER';

// The Gestor do Sistema code grants ADMIN-level access.
const GESTOR_CODE = 'GESTOR';

/**
 * Normalises a birth-date string to YYYYMMDD for password comparison.
 *
 * Accepts any separator (or none). For 8-digit strings:
 *   - First digit > '3'  →  already YYYYMMDD (e.g. 19570618) → use as-is
 *   - First digit ≤ '3'  →  DDMMYYYY (e.g. 18061957) → reorder to YYYYMMDD
 *
 * This lets participants type "18061957" or "19570618" and both match the
 * ISO-stored "1957-06-18".
 *
 * Security note: using birth_date as password is acceptable for a closed clinical
 * research tool. For a public-facing application a proper backend auth system is required.
 */
const normaliseBirthDate = (s: string): string => {
  const d = (s || '').replace(/\D/g, '');
  if (d.length === 8 && d[0] <= '3') {
    // DDMMYYYY → YYYYMMDD
    return `${d.slice(4)}${d.slice(2, 4)}${d.slice(0, 2)}`;
  }
  return d;
};

const LoginPage: React.FC = () => {
  const { language, setLanguage, t } = useLocalization();
  const navigate = useNavigate();
  const { setRole, setParticipantId } = useUserRole();
  const { participants, isLoading, supabaseLoadFailed } = useParticipantData();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Stores credentials submitted while Supabase was still loading, for deferred validation.
  const [pendingLogin, setPendingLogin] = useState<{ code: string; pwd: string } | null>(null);

  // When Supabase finishes loading and there's a deferred login, execute it now.
  useEffect(() => {
    if (isLoading || !pendingLogin) return;
    const { code: pendingCode, pwd: pendingPwd } = pendingLogin;
    setPendingLogin(null);
    // Researcher auth never goes through the deferred path — defensive guard.
    if (pendingCode === RESEARCHER_CODE) return;
    attemptParticipantLogin(pendingCode, pendingPwd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, pendingLogin]);

  // 5-second safety timeout: if Supabase hasn't loaded yet, show connection error.
  useEffect(() => {
    if (!pendingLogin) return;
    const id = setTimeout(() => {
      setPendingLogin(null);
      setError(t('login_connection_error' as any));
    }, 5000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLogin]);

  const attemptParticipantLogin = (normalizedCode: string, pwd: string) => {
    const participant = participants.find(
      p => p.study_id.toUpperCase() === normalizedCode
    );
    if (participant && normaliseBirthDate(pwd) === normaliseBirthDate(participant.birth_date)) {
      setRole(UserRole.PARTICIPANT);
      setParticipantId(participant.study_id);
      navigate('/dashboard', { replace: true });
    } else if (!participant && supabaseLoadFailed) {
      // Participant not found because Supabase failed — don't blame the user's credentials.
      setError(t('login_connection_error' as any));
    } else {
      // Intentionally generic: do not reveal whether code or password was wrong.
      setError(t('login_error'));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedCode = code.trim().toUpperCase();

    // --- Gestor do Sistema authentication (highest privilege, independent of Supabase) ---
    if (normalizedCode === GESTOR_CODE) {
      const gestorPassword = import.meta.env.VITE_GESTOR_PASSWORD;
      if (!gestorPassword) {
        console.warn(
          '[Auth] VITE_GESTOR_PASSWORD não está definido. ' +
          'Adicione essa variável ao .env.local e às variáveis de ambiente do Vercel.'
        );
      }
      if (password === gestorPassword) {
        setRole(UserRole.ADMIN);
        navigate('/dashboard', { replace: true });
      } else {
        setError(t('login_error'));
      }
      return;
    }

    // --- Researcher authentication (does not depend on Supabase data) ---
    if (normalizedCode === RESEARCHER_CODE) {
      // VITE_RESEARCHER_PASSWORD is a build-time env var embedded in the JS bundle.
      // It is not secret from anyone who inspects the bundle, but it does prevent
      // accidental access by participants. A real backend is needed for true security.
      const researcherPassword = import.meta.env.VITE_RESEARCHER_PASSWORD;

      if (!researcherPassword) {
        console.warn(
          '[Auth] VITE_RESEARCHER_PASSWORD não está definido. ' +
          'Crie um arquivo .env.local com essa variável antes de usar em produção.'
        );
      }

      if (password === researcherPassword) {
        setRole(UserRole.RESEARCHER);
        navigate('/dashboard', { replace: true });
      } else {
        setError(t('login_error'));
      }
      return;
    }

    // --- Participant authentication ---
    if (isLoading) {
      // Supabase still loading: queue credentials and wait (5s timeout guards against hang).
      setPendingLogin({ code: normalizedCode, pwd: password });
      return;
    }

    attemptParticipantLogin(normalizedCode, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light p-4">
      <Card className="max-w-md w-full">

        {/* Title */}
        <h1 className="text-3xl font-bold text-primary-dark mb-1 text-center">
          {t('welcome_title')}
        </h1>
        <p className="text-slate-500 text-center mb-8">{t('login_subtitle')}</p>

        {/* Language selector */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setLanguage(Language.PT_BR)}
            aria-label="Português (Brasil)"
            className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all text-sm font-medium ${
              language === Language.PT_BR
                ? 'border-primary bg-primary/10 text-primary-dark'
                : 'border-slate-200 text-slate-600 hover:border-primary/50'
            }`}
          >
            <img
              src="https://flagcdn.com/br.svg"
              alt=""
              aria-hidden="true"
              className="w-6 h-4 object-cover rounded-sm shadow-sm"
              referrerPolicy="no-referrer"
            />
            PT
          </button>
          <button
            type="button"
            onClick={() => setLanguage(Language.ES_ES)}
            aria-label="Español (España)"
            className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all text-sm font-medium ${
              language === Language.ES_ES
                ? 'border-primary bg-primary/10 text-primary-dark'
                : 'border-slate-200 text-slate-600 hover:border-primary/50'
            }`}
          >
            <img
              src="https://flagcdn.com/es.svg"
              alt=""
              aria-hidden="true"
              className="w-6 h-4 object-cover rounded-sm shadow-sm"
              referrerPolicy="no-referrer"
            />
            ES
          </button>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="login-code"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              {t('login_access_code')}
            </label>
            <input
              id="login-code"
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={t('login_access_code_placeholder')}
              autoCapitalize="characters"
              autoComplete="username"
              spellCheck={false}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800 bg-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              {t('login_password')}
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('login_password_placeholder')}
              autoComplete="current-password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-800 bg-white"
              required
            />
            <p className="text-xs text-slate-400 mt-1.5">{t('login_password_hint')}</p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-3 text-lg"
            disabled={!code.trim() || !password.trim() || !!pendingLogin}
          >
            {isLoading
              ? t('login_loading' as any)
              : pendingLogin
              ? t('login_loading' as any)
              : t('login_submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
