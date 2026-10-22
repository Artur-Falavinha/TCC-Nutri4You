import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren
} from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

interface AppAlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AppAlert {
  title: string;
  message: string;
  buttons: AppAlertButton[];
}

interface AppAlertContextValue {
  showAlert: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [activeAlert, setActiveAlert] = useState<AppAlert | null>(null);

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AppAlertButton[]) => {
      if (Platform.OS !== 'web') {
        Alert.alert(title, message, buttons);
        return;
      }

      setActiveAlert({
        title,
        message: message ?? '',
        buttons: buttons?.length ? buttons : [{ text: 'OK' }]
      });
    },
    []
  );

  const closeAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const handleButtonPress = (button: AppAlertButton) => {
    closeAlert();
    button.onPress?.();
  };

  return (
    <AppAlertContext.Provider value={{ showAlert }}>
      {children}
      {Platform.OS === 'web' ? (
        <Modal
          visible={activeAlert !== null}
          transparent
          animationType="fade"
          accessibilityLabel={activeAlert?.title}
          onRequestClose={closeAlert}
        >
          {activeAlert ? (
            <View style={styles.overlay}>
              <View
                style={styles.dialog}
                accessibilityRole="alert"
                accessibilityLabel={
                  activeAlert.message
                    ? `${activeAlert.title}. ${activeAlert.message}`
                    : activeAlert.title
                }
                accessibilityLiveRegion="assertive"
              >
                <Text style={styles.title}>{activeAlert.title}</Text>
                {activeAlert.message ? (
                  <Text style={styles.message}>{activeAlert.message}</Text>
                ) : null}
                <View style={styles.actions}>
                  {activeAlert.buttons.map((button, index) => (
                    <Pressable
                      key={`${button.text ?? 'OK'}-${index}`}
                      style={[
                        styles.button,
                        button.style === 'destructive' && styles.destructive,
                        button.style === 'cancel' && styles.cancel
                      ]}
                      onPress={() => handleButtonPress(button)}
                      accessibilityRole="button"
                      accessibilityLabel={button.text ?? 'OK'}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          button.style === 'destructive' && styles.destructiveText,
                          button.style === 'cancel' && styles.cancelText
                        ]}
                      >
                        {button.text ?? 'OK'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </Modal>
      ) : null}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)'
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    gap: 16,
    elevation: 12
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700'
  },
  message: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8
  },
  button: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#006f1e'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  destructive: {
    backgroundColor: '#b42318'
  },
  cancel: {
    backgroundColor: '#f1f5f9'
  },
  destructiveText: {
    color: '#ffffff'
  },
  cancelText: {
    color: '#334155'
  }
});
