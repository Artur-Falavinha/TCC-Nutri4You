// Ambiente de PRODUÇÃO.
// Usado por padrão em `ng build` (build de produção).
// Para desenvolvimento local, o Angular CLI substitui este arquivo por
// `environment.development.ts` (ver "fileReplacements" em angular.json).
export const environment = {
  production: true,
  // Base da API REST (Sprint 1: versionamento /api/v1).
  // Em produção, defina a URL real do backend implantado.
  apiBaseUrl: 'https://api.nutri4you.com.br/api/v1'
};
