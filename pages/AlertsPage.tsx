
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { useLocalization } from '../context/LocalizationContext';
import { useParticipantData } from '../context/ParticipantDataContext';
import { IncidentReport } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Header from '../components/Header';

interface FlatIncident extends IncidentReport {
  participantId: string;
  participantName: string;
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatDate } = useLocalization();
  const { participants, updateParticipant } = useParticipantData();

  // Flatten all incidents sorted newest first
  const allIncidents: FlatIncident[] = participants
    .flatMap(p =>
      (p.incidents || []).map(inc => ({
        ...inc,
        participantId: p.study_id,
        participantName: p.name,
      }))
    )
    .sort((a, b) => new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime());

  const pendingCount = allIncidents.filter(i => !i.reviewed).length;

  const handleMarkReviewed = (participantId: string, incidentId: string) => {
    const participant = participants.find(p => p.study_id === participantId);
    if (!participant) return;
    const updatedIncidents = (participant.incidents || []).map(inc =>
      inc.id === incidentId ? { ...inc, reviewed: true } : inc
    );
    updateParticipant(participantId, { incidents: updatedIncidents });
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">

        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-primary-dark py-2 px-3 text-base"
          >
            <ChevronLeft size={18} />
            {t('back_to_dashboard')}
          </Button>
        </div>

        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-100 rounded-full">
            <AlertTriangle size={28} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-primary-dark">{t('alerts_title')}</h1>
            <p className="text-slate-600 mt-1">{t('alerts_subtitle')}</p>
          </div>
          {pendingCount > 0 && (
            <span className="ml-auto bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              {t('unreviewed_badge', { count: pendingCount })}
            </span>
          )}
        </div>

        <Card>
          {allIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle size={48} className="text-green-400 mb-4" />
              <p className="text-xl font-semibold text-slate-600">{t('alerts_no_incidents')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-3">{t('alerts_col_participant')}</th>
                    <th className="p-3">{t('alerts_col_session')}</th>
                    <th className="p-3">{t('alerts_col_date')}</th>
                    <th className="p-3 text-center">{t('alerts_col_status')}</th>
                    <th className="p-3 text-center">{t('alerts_col_action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allIncidents.map(incident => (
                    <tr
                      key={incident.id}
                      className={incident.reviewed ? 'opacity-50' : 'bg-amber-50/30'}
                    >
                      <td className="p-3">
                        <p
                          className="font-semibold text-primary hover:underline cursor-pointer"
                          onClick={() => navigate(`/researcher/participant/${incident.participantId}`)}
                        >
                          {incident.participantId}
                        </p>
                        <p className="text-slate-500 text-xs">{incident.participantName}</p>
                      </td>
                      <td className="p-3">
                        {t('session_number_label', { number: incident.session_index + 1 })}
                      </td>
                      <td className="p-3 text-slate-600">
                        {formatDate(new Date(incident.reported_date), {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            incident.reviewed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {incident.reviewed ? t('alert_reviewed') : t('alert_pending')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {!incident.reviewed && (
                          <Button
                            variant="ghost"
                            className="text-sm py-1 px-3 text-primary"
                            onClick={() => handleMarkReviewed(incident.participantId, incident.id)}
                          >
                            {t('mark_reviewed')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </main>
    </div>
  );
};

export default AlertsPage;
