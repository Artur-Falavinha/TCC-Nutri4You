import { useCallback, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { healthService } from '../../core/api/health.service';
import { ApiError, HealthStatus } from '../../core/api/api-response.types';

type ViewState = 'loading' | 'success' | 'error';

/**
 * Prova de fluxo ponta a ponta da Sprint 1: cliente -> API -> banco.
 * Chama GET /api/v1/health assim que a API Spring Boot estiver no ar.
 */
export function HealthScreen() {
  const [state, setState] = useState<ViewState>('loading');
  const [health, setHealth] = useState<HealthStatus>();
  const [error, setError] = useState<ApiError>();

  const fetchHealth = useCallback(() => {
    healthService
      .check()
      .then((result) => {
        setHealth(result);
        setState('success');
      })
      .catch((err: ApiError) => {
        setError(err);
        setState('error');
      });
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const reload = useCallback(() => {
    setState('loading');
    fetchHealth();
  }, [fetchHealth]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Status da API</Text>

      {state === 'loading' && <Text>Consultando a API…</Text>}

      {state === 'success' && (
        <View>
          <Text>
            API respondendo: <Text style={styles.bold}>{health?.status}</Text>
          </Text>
          {health?.service ? <Text>Serviço: {health.service}</Text> : null}
        </View>
      )}

      {state === 'error' && (
        <View>
          <Text>Não foi possível falar com a API ({error?.status}).</Text>
          <Text>{error?.message}</Text>
          <Text style={styles.hint}>
            Confira se a API Spring Boot está rodando e se EXPO_PUBLIC_API_BASE_URL aponta pra ela.
          </Text>
        </View>
      )}

      <Button title="Tentar novamente" onPress={reload} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24
  },
  title: {
    fontSize: 20,
    fontWeight: '700'
  },
  bold: {
    fontWeight: '700'
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  }
});
