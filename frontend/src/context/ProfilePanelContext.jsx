import React, { createContext, useContext, useState } from 'react';

const ProfilePanelContext = createContext({ isOpen: false, open: () => {}, close: () => {} });

export const ProfilePanelProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ProfilePanelContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </ProfilePanelContext.Provider>
  );
};

export const useProfilePanel = () => useContext(ProfilePanelContext);
