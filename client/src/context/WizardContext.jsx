import { createContext, useContext } from "react";

const WizardContext = createContext(null);

export function WizardProvider({ value, children }) {
  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizardContext() {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error("useWizardContext must be used within a WizardProvider");
  }

  return context;
}
