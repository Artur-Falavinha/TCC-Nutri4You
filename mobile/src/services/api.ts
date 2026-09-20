import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { env } from '../core/config/env';

export const TOKEN_KEY = 'nutri4you.jwt';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

export interface LoginResponse {
  token: string;
  tipoUsuario: 'PACIENTE' | 'NUTRICIONISTA' | string;
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});