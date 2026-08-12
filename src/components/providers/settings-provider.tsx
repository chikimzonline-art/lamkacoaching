"use client";

import { createContext, useContext, ReactNode } from "react";

type SettingsContextType = {
  logo_url?: string;
  business_name?: string;
  [key: string]: string | undefined;
};

const SettingsContext = createContext<SettingsContextType>({});

export function SettingsProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: SettingsContextType;
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
