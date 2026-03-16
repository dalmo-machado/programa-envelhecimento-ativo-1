
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../context/UserRoleContext';
import { useLocalization } from '../context/LocalizationContext';
import { UserRole } from '../types';
import { Home } from 'lucide-react';
import Button from './ui/Button';

const Header: React.FC = () => {
    const { role, setRole, setParticipantId } = useUserRole();
    const { t } = useLocalization();
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

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
        localStorage.clear();
        window.location.href = '/';
    };

    const handleCancelResetAll = () => {
        setShowResetConfirm(false);
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
                        title="Início / Reiniciar"
                        role="button"
                        tabIndex={0}
                    >
                        <div className="p-2 bg-primary rounded-full">
                            <Home size={24} />
                        </div>
                        <h1 className="text-xl font-bold">{t('welcome_title')}</h1>
                    </div>
                    {role !== UserRole.NONE && (
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
                            </select>
                         </div>
                    )}
                </div>
            </header>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-slate-800">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Encerrar Sessão</h3>
                        <p className="text-slate-600 mb-6">{t('confirm_end_session' as any)}</p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleCancelEndSession}>Cancelar</Button>
                            <Button onClick={handleConfirmEndSession}>Sim, encerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl text-slate-800">
                        <h3 className="text-xl font-bold text-red-600 mb-4">Atenção: Zerar Dados</h3>
                        <p className="text-slate-600 mb-6">{t('confirm_reset_all' as any)}</p>
                        <div className="flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleCancelResetAll}>Não, apenas sair</Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmResetAll}>Sim, zerar tudo</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;
