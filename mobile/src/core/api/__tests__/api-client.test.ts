/* eslint-disable import/first -- jest.mock precisa vir antes dos imports do SUT */
const mockGetToken = jest.fn();
const mockClearToken = jest.fn();
const mockSetToken = jest.fn();

jest.mock('../../auth/token-storage', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
  clearToken: (...args: unknown[]) => mockClearToken(...args),
  setToken: (...args: unknown[]) => mockSetToken(...args)
}));

jest.mock('../../config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8080/api/v1' }
}));

import { ApiError } from '../api-response.types';
import { apiClient } from '../api-client';
import { login } from '../../auth/auth.service';

describe('apiClient / auth', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockGetToken.mockReset();
    mockClearToken.mockReset();
    mockSetToken.mockReset();
    mockGetToken.mockResolvedValue(null);
    mockClearToken.mockResolvedValue(undefined);
    mockSetToken.mockResolvedValue(undefined);
    apiClient.setUnauthorizedHandler(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('login chama POST /auth/login e salva JWT de paciente', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: { token: 'jwt-paciente', tipoUsuario: 'PACIENTE' }
      })
    }) as unknown as typeof fetch;

    const result = await login('arthur@email.com', 'password');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'arthur@email.com',
          senha: 'password'
        })
      })
    );
    expect(mockSetToken).toHaveBeenCalledWith('jwt-paciente');
    expect(result.tipoUsuario).toBe('PACIENTE');
  });

  it('401 limpa token e dispara handler de logout', async () => {
    const onUnauthorized = jest.fn();
    apiClient.setUnauthorizedHandler(onUnauthorized);
    mockGetToken.mockResolvedValue('token-expirado');

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        status: 401,
        error: 'NAO_AUTORIZADO',
        message: 'Sessao expirada'
      })
    }) as unknown as typeof fetch;

    await expect(apiClient.get('/health')).rejects.toBeInstanceOf(ApiError);
    expect(mockClearToken).toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalled();
  });
});
