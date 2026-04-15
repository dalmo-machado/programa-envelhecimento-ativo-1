
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../context/UserRoleContext';
import { useLocalization } from '../context/LocalizationContext';
import { UserRole } from '../types';
import { Home } from 'lucide-react';
import Button from './ui/Button';
import { deleteAllData } from '../services/supabaseService';

const Header: React.FC = () => {
    const { role, setRole, setParticipantId } = useUserRole();
    const { t } = useLocalization();
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const handleConfirmResetAll = () => {
        setShowResetConfirm(false);
        setConfirmText('');
        setShowFinalConfirm(true);
    };

    const handleCancelResetAll = () => {
        setShowResetConfirm(false);
        setRole(UserRole.NONE);
        setParticipantId(null);
        navigate('/');
    };

    const handleExecuteReset = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteAllData();
            localStorage.clear();
            window.location.href = '/';
        } catch (err) {
            setIsDeleting(false);
            setDeleteError(err instanceof Error ? err.message : 'Erro ao apagar dados no servidor.');
        }
    };

    const handleCancelFinalConfirm = () => {
        if (isDeleting) return;
        setShowFinalConfirm(false);
        setConfirmText('');
        setDeleteError(null);
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
                        <p className="text-slate-600 mb-6">{t('confirm_reset_all' as any)}</p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleCancelResetAll}>{t('reset_data_no' as any)}</Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmResetAll}>{t('reset_data_yes' as any)}</Button>
                        </div>
                    </div>
                </div>
            )}

            {showFinalConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-slate-800">
                        <h3 className="text-xl font-bold text-red-600 mb-4">{t('reset_final_title' as any)}</h3>
                        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-5">
                            <p className="text-red-700 font-semibold text-sm">{t('reset_final_warning' as any)}</p>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{t('reset_final_type_hint' as any)}</p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            className="w-full p-3 border-2 border-slate-300 rounded-md focus:border-red-500 focus:outline-none font-mono text-slate-800 mb-5"
                            placeholder="CONFIRMAR"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={isDeleting}
                        />
                        {deleteError && (
                            <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded p-2">{deleteError}</p>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleCancelFinalConfirm} disabled={isDeleting}>{t('cancel' as any)}</Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={handleExecuteReset}
                                disabled={confirmText !== 'CONFIRMAR' || isDeleting}
                            >{isDeleting ? 'Apagando...' : t('reset_final_button' as any)}</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;
