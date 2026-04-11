
import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from './context/LocalizationContext';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import { ParticipantDataProvider } from './context/ParticipantDataContext';
import { Language, UserRole } from './types';
import RouteGuard from './components/RouteGuard';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentPage from './pages/AssessmentPage';
import SessionPage from './pages/SessionPage';
import ConsentPage from './pages/ConsentPage';
import ScreeningPage from './pages/ScreeningPage';
import AssessmentSummaryPage from './pages/AssessmentSummaryPage';
import TrainingPlanPage from './pages/TrainingPlanPage';
import { pt } from './localization/pt';
import { es, I18nKeys } from './localization/es';

const translations: Record<Language, I18nKeys> = {
  'pt-BR': pt,
  'es-ES': es,
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pt')) return Language.PT_BR;
    if (browserLang.startsWith('es')) return Language.ES_ES;
    return Language.PT_BR;
  });

  const localizationValue = useMemo(() => {
    const t = (key: keyof I18nKeys, replacements?: Record<string, string | number>): string => {
        let translation = translations[language][key] || key;
        if (replacements) {
          Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`{${placeholder}}`, String(value));
          });
        }
        return translation;
    };
  
    const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(language, options).format(value);
    };
  
    const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(language, options).format(date);
    };

    return { language, setLanguage, t, formatNumber, formatDate };
  }, [language]);

  return (
    <LocalizationProvider value={localizationValue}>
      <UserRoleProvider>
        <ParticipantDataProvider>
          <div className="min-h-screen font-sans">
            <AppRouter />
          </div>
        </ParticipantDataProvider>
      </UserRoleProvider>
    </LocalizationProvider>
  );
};

// Roles that are considered "logged in" for the purpose of the home redirect.
const AUTHENTICATED_ROLES = [UserRole.PARTICIPANT, UserRole.RESEARCHER, UserRole.ADMIN];

// Roles allowed on participant-only routes (training execution).
const PARTICIPANT_ROLES = [UserRole.PARTICIPANT, UserRole.ADMIN];

// Roles allowed to create/view clinical assessments.
const RESEARCHER_ROLES = [UserRole.RESEARCHER, UserRole.ADMIN];

// Roles allowed on routes shared between participants and researchers.
const ALL_AUTHENTICATED = [UserRole.PARTICIPANT, UserRole.RESEARCHER, UserRole.ADMIN];

const AppRouter: React.FC = () => {
  const { role } = useUserRole();

  return (
    <HashRouter>
      <Routes>
        {/* Public routes — redirect to dashboard if already authenticated */}
        <Route
          path="/"
          element={
            AUTHENTICATED_ROLES.includes(role)
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/screening" element={<ScreeningPage />} />

        {/* Shared: participants and researchers */}
        <Route
          path="/dashboard"
          element={
            <RouteGuard allowedRoles={ALL_AUTHENTICATED}>
              <DashboardPage />
            </RouteGuard>
          }
        />

        {/* Participant-only routes */}
        <Route
          path="/training-plan"
          element={
            <RouteGuard allowedRoles={PARTICIPANT_ROLES}>
              <TrainingPlanPage />
            </RouteGuard>
          }
        />
        {/* Researcher-only routes — participants are redirected away */}
        <Route
          path="/assessment/new"
          element={
            <RouteGuard allowedRoles={RESEARCHER_ROLES}>
              <AssessmentPage />
            </RouteGuard>
          }
        />
        <Route
          path="/assessment/summary"
          element={
            <RouteGuard allowedRoles={RESEARCHER_ROLES}>
              <AssessmentSummaryPage />
            </RouteGuard>
          }
        />
        <Route
          path="/session/:sessionIndex"
          element={
            <RouteGuard allowedRoles={PARTICIPANT_ROLES}>
              <SessionPage />
            </RouteGuard>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;