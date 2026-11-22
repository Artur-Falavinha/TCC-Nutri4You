import type { PropsWithChildren } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthScreenLayout({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/login-background.webp')}
        style={styles.background}
        resizeMode="cover"
        accessible={false}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <View style={styles.logoFrame}>
                <Image
                  source={require('../../../assets/logo-nutri4u.webp')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="Nutri4U — Nutri4You"
                />
              </View>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6ed'
  },
  fill: {
    flex: 1
  },
  background: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24
  },
  content: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 16,
    gap: 32
  },
  logoFrame: {
    width: '100%',
    aspectRatio: 2135 / 634
  },
  logo: {
    width: '100%',
    height: '100%'
  }
});
