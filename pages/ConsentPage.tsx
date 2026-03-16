
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../context/LocalizationContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ConsentPage: React.FC = () => {
    const { t } = useLocalization();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-primary-dark mb-4">{t('consent_title')}</h1>
                <p className="text-lg text-slate-600 mb-6">{t('consent_intro')}</p>
                <div className="h-64 overflow-y-auto border border-slate-200 rounded-lg p-4 mb-8 bg-slate-50 text-slate-700">
                    <h2 className="font-bold">{t('consent_item1_title' as any)}</h2>
                    <p>{t('consent_item1_desc' as any)}</p>
                    <h2 className="font-bold mt-4">{t('consent_item2_title' as any)}</h2>
                    <p>{t('consent_item2_desc' as any)}</p>
                    <h2 className="font-bold mt-4">{t('consent_item3_title' as any)}</h2>
                    <p>{t('consent_item3_desc' as any)}</p>
                    <h2 className="font-bold mt-4">{t('consent_item4_title' as any)}</h2>
                    <p>{t('consent_item4_desc' as any)}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => navigate('/screening')} className="w-full">{t('consent_accept')}</Button>
                    <Button onClick={() => navigate('/')} variant="danger" className="w-full">{t('consent_decline')}</Button>
                </div>
            </Card>
        </div>
    );
};

export default ConsentPage;
