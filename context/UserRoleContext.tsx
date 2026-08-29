
import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { UserRole } from '../types';

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  participantId: string | null;
  setParticipantId: (id: string | null) => void;
  /** Access code of the logged-in researcher, stamped on plan authorizations. */
  researcherCode: string | null;
  setResearcherCode: (code: string | null) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('userRole');
    return (saved as UserRole) || UserRole.NONE;
  });
  const [participantId, setParticipantId] = useState<string | null>(() => {
    return localStorage.getItem('participantId');
  });
  const [researcherCode, setResearcherCode] = useState<string | null>(() => {
    return localStorage.getItem('researcherCode');
  });

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
  };

  const handleSetResearcherCode = (code: string | null) => {
    setResearcherCode(code);
    if (code) {
      localStorage.setItem('researcherCode', code);
    } else {
      localStorage.removeItem('researcherCode');
    }
  };

  const handleSetParticipantId = (id: string | null) => {
    setParticipantId(id);
    if (id) {
      localStorage.setItem('participantId', id);
    } else {
      localStorage.removeItem('participantId');
    }
  };

  const value = useMemo(() => ({ 
    role, 
    setRole: handleSetRole, 
    participantId, 
    setParticipantId: handleSetParticipantId,
    researcherCode,
    setResearcherCode: handleSetResearcherCode,
  }), [role, participantId, researcherCode]);

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
