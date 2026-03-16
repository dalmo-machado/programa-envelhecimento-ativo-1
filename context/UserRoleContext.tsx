
import React, { createContext, useState, useContext, useMemo, ReactNode } from 'react';
import { UserRole } from '../types';

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  participantId: string | null;
  setParticipantId: (id: string | null) => void;
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

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
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
    setParticipantId: handleSetParticipantId 
  }), [role, participantId]);

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
