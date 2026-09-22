/**
 * Tipos das rotas do stack principal. Ao adicionar uma tela nova em
 * RootNavigator, registrar aqui também para manter a navegação tipada
 * (navigation.navigate('Nome') com autocomplete e checagem de parâmetros).
 */
export type RootStackParamList = {
  Login: undefined;
  TrocarSenha: undefined;
  NovaSenha: { token: string };
  CriarConta: undefined;
  Home: undefined;
  Health: undefined;
};
