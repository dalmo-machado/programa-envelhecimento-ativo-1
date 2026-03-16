
import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from './context/LocalizationContext';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';
import { ParticipantDataProvider } from './context/ParticipantDataContext';
import { Language, UserRole } from './types';
import WelcomePage from './pages/WelcomePage';
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

const AppRouter: React.FC = () => {
  const { role } = useUserRole();
  const isAuthenticated = role !== UserRole.NONE;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <WelcomePage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/screening" element={<ScreeningPage />} />
        <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/" />} />
        <Route path="/training-plan" element={isAuthenticated ? <TrainingPlanPage /> : <Navigate to="/" />} />
        <Route path="/assessment/new" element={isAuthenticated ? <AssessmentPage /> : <Navigate to="/" />} />
        <Route path="/assessment/summary" element={isAuthenticated ? <AssessmentSummaryPage /> : <Navigate to="/" />} />
        <Route path="/session/:sessionIndex" element={isAuthenticated ? <SessionPage /> : <Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;