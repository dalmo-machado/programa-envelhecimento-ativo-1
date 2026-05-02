
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../context/UserRoleContext';
import { useLocalization } from '../context/LocalizationContext';
import { UserRole } from '../types';
import { Home } from 'lucide-react';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { loadAllParticipants, BackupData } from '../services/supabaseService';

const Header: React.FC = () => {
    const { role, setRole, setParticipantId } = useUserRole();
    const { t } = useLocalization();
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);

    // Only researchers and admins may switch their active view.
    // Participants must not be able to self-elevate to researcher.
    const canSwitchView = role === UserRole.RESEARCHER || role === UserRole.ADMIN;

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRole(e.target.value as UserRole);
    }

    const handleHomeClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmEndSession = () => {
        setShowConfirm(false);
        setShowResetConfirm(true);
    };

    const handleCancelEndSession = () => {
        setShowConfirm(false);
    };

    // Camada 1: confirmação dupla via UI (modais showConfirm → showResetConfirm)
    // Camada 2: backup JSON automático + DELETE real no Supabase
    const handleConfirmResetAll = async () => {
        setIsResetting(true);
        setResetError(null);
        try {
            // 2a — Exportar backup antes de qualquer delete
            const allParticipants = await loadAllParticipants();
            const backup: BackupData = {
                version: 1,
                exported_at: new Date().toISOString(),
                participants: allParticipants,
            };
            const json = JSON.stringify(backup, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            link.download = `agecare_backup_${ts}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // 2b — DELETE sequencial (tabelas filhas antes da tabela pai)
            const steps: Array<{ table: string; filter: [string, string] }> = [
                { table: 'sessions',     filter: ['participant_id', ''] },
                { table: 'assessments',  filter: ['participant_id', ''] },
                { table: 'incidents',    filter: ['participant_id', ''] },
                { table: 'participants', filter: ['study_id',        ''] },
            ];
            for (const { table, filter } of steps) {
                const { error } = await (supabase as any)
                    .from(table)
                    .delete()
                    .neq(filter[0], filter[1]);
                if (error) throw new Error(`Erro ao apagar "${table}": ${error.message}`);
            }

            localStorage.clear();
            window.location.href = '/';
        } catch (err: any) {
            console.error('[Header] handleConfirmResetAll:', err);
            setResetError(err?.message ?? 'Erro desconhecido ao zerar dados.');
            setIsResetting(false);
        }
    };

    const handleCancelResetAll = () => {
        setShowResetConfirm(false);
        setResetError(null);
        setRole(UserRole.NONE);
        setParticipantId(null);
        navigate('/');
    };

    return (
        <>
            <header className="bg-primary-dark p-4 shadow-md text-white">
                <div className="container mx-auto flex justify-between items-center">
                    <div 
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={handleHomeClick}
                        title={t('home_tooltip' as any)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="p-2 bg-primary rounded-full">
                            <Home size={24} />
                        </div>
                        <h1 className="text-xl font-bold">{t('welcome_title')}</h1>
                    </div>
                    {canSwitchView && (
                        <div className="flex items-center space-x-2">
                            <label htmlFor="role-switcher" className="text-sm">View:</label>
                            <select
                                id="role-switcher"
                                value={role}
                                onChange={handleRoleChange}
                                className="bg-primary text-white border-accent rounded-md p-2 text-sm"
                            >
                                <option value={UserRole.PARTICIPANT}>{t('participant_view')}</option>
                                <option value={UserRole.RESEARCHER}>{t('researcher_view')}</option>
                                {role === UserRole.ADMIN && (
                                    <option value={UserRole.ADMIN}>Admin</option>
                                )}
                            </select>
                        </div>
                    )}
                </div>
            </header>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('end_session_title' as any)}</h3>
                        <p className="text-slate-600 mb-6">{t('confirm_end_session' as any)}</p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleCancelEndSession}>{t('cancel' as any)}</Button>
                            <Button onClick={handleConfirmEndSession}>{t('confirm_end_session_yes' as any)}</Button>
                        </div>
                    </div>
                </div>
            )}

            {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-slate-800">
                        <h3 className="text-xl font-bold text-red-600 mb-4">{t('reset_data_title' as any)}</h3>
                        <p className="text-slate-600 mb-4">{t('confirm_reset_all' as any)}</p>
                        {resetError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                ⚠️ {resetError}
                            </p>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="secondary"
                                onClick={handleCancelResetAll}
                                disabled={isResetting}
                            >
                                {t('reset_data_no' as any)}
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                                onClick={handleConfirmResetAll}
                                disabled={isResetting}
                            >
                                {isResetting ? '⏳ Apagando...' : t('reset_data_yes' as any)}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;
