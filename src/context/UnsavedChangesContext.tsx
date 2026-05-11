import React, { createContext, useContext, useState } from 'react';

interface UnsavedChangesContextValue {
    isDirty: boolean;
    setIsDirty: (dirty: boolean) => void;
    pendingAction: (() => void) | null;
    setPendingAction: (action: (() => void) | null) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
    isDirty: false,
    setIsDirty: () => {},
    pendingAction: null,
    setPendingAction: () => {},
});

export const useUnsavedChanges = () => useContext(UnsavedChangesContext);

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDirty, setIsDirty] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    return (
        <UnsavedChangesContext.Provider value={{ isDirty, setIsDirty, pendingAction, setPendingAction }}>
            {children}
        </UnsavedChangesContext.Provider>
    );
};
