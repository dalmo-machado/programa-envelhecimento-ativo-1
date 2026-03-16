
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import { Language } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const WelcomePage: React.FC = () => {
  const { language, setLanguage, t } = useLocalization();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light p-4">
      <Card className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold text-primary-dark mb-2">{t('welcome_title')}</h1>
        <p className="text-lg text-slate-600 mb-8">{t('welcome_subtitle')}</p>

        <div className="mb-8">
          <label className="block text-xl font-semibold text-slate-700 mb-4">{t('select_language')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage(Language.PT_BR)}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                language === Language.PT_BR 
                  ? 'border-primary bg-primary/10 shadow-md' 
                  : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
              }`}
            >
              <img src="https://flagcdn.com/br.svg" alt="Bandeira do Brasil" className="w-16 h-12 mb-3 rounded-sm object-cover shadow-sm" referrerPolicy="no-referrer" />
              <span className="text-lg font-medium text-slate-800">{t('portuguese')}</span>
            </button>
            
            <button
              onClick={() => setLanguage(Language.ES_ES)}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                language === Language.ES_ES 
                  ? 'border-primary bg-primary/10 shadow-md' 
                  : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
              }`}
            >
              <img src="https://flagcdn.com/es.svg" alt="Bandera de España" className="w-16 h-12 mb-3 rounded-sm object-cover shadow-sm" referrerPolicy="no-referrer" />
              <span className="text-lg font-medium text-slate-800">{t('spanish')}</span>
            </button>
          </div>
        </div>

        <Button onClick={() => navigate('/consent')} className="w-full text-lg py-3">
          {t('continue')}
        </Button>
      </Card>
    </div>
  );
};

export default WelcomePage;
