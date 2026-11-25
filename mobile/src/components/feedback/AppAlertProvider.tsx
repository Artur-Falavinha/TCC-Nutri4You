import React, { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';

import { DialogoConfirmacao, type AcaoDialogo } from './DialogoConfirmacao';

interface AppAlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AppAlert {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
}

interface AppAlertContextValue {
  showAlert: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [alerta, setAlerta] = useState<AppAlert | null>(null);

  const showAlert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setAlerta({ title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] });
  }, []);

  const fechar = () => setAlerta(null);
  const criarAcao = (botao: AppAlertButton): AcaoDialogo => ({
    rotulo: botao.text ?? 'OK',
    variante: botao.style === 'cancel' ? 'secundaria' : botao.style === 'destructive' ? 'perigo' : undefined,
    executar: () => {
      fechar();
      botao.onPress?.();
    }
  });

  return (
    <AppAlertContext.Provider value={{ showAlert }}>
      {children}
      {alerta && (
        <DialogoConfirmacao
          titulo={alerta.title}
          descricao={alerta.message}
          fechar={fechar}
          acoes={[
            ...alerta.buttons.filter((botao) => botao.style === 'cancel'),
            ...alerta.buttons.filter((botao) => botao.style !== 'cancel')
          ].map(criarAcao)}
        />
      )}
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert deve ser usado dentro de AppAlertProvider.');
  }
  return context;
}