
import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { Participant } from '../types';
import { mockParticipants } from '../services/mockData';

interface ParticipantDataContextType {
  participants: Participant[];
  updateParticipant: (participantId: string, updatedData: Partial<Participant>) => void;
  addParticipant: (participant: Participant) => void;
}

const ParticipantDataContext = createContext<ParticipantDataContextType | undefined>(undefined);

export const ParticipantDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('participantsData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse participants data from local storage", e);
      }
    }
    return mockParticipants;
  });

  const updateParticipant = (participantId: string, updatedData: Partial<Participant>) => {
    setParticipants(prevParticipants => {
      const newParticipants = prevParticipants.map(p =>
        p.study_id === participantId ? { ...p, ...updatedData } : p
      );
      localStorage.setItem('participantsData', JSON.stringify(newParticipants));
      return newParticipants;
    });
  };

  const addParticipant = (participant: Participant) => {
    setParticipants(prev => {
        let newParticipants;
        if (prev.find(p => p.study_id === participant.study_id)) {
            newParticipants = prev.map(p => p.study_id === participant.study_id ? participant : p);
        } else {
            newParticipants = [...prev, participant];
        }
        localStorage.setItem('participantsData', JSON.stringify(newParticipants));
        return newParticipants;
    });
  };
  
  const value = useMemo(() => ({ participants, updateParticipant, addParticipant }), [participants]);

  return (
    <ParticipantDataContext.Provider value={value}>
      {children}
    </ParticipantDataContext.Provider>
  );
};

export const useParticipantData = (): ParticipantDataContextType => {
  const context = useContext(ParticipantDataContext);
  if (!context) {
    throw new Error('useParticipantData must be used within a ParticipantDataProvider');
  }
  return context;
};
