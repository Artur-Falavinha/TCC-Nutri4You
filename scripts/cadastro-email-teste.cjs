const assert = require('node:assert/strict');
const { setTimeout: aguardar } = require('node:timers/promises');

async function confirmarCadastroTeste(post, email, tipoUsuario) {
  const caixa = new URL(process.env.CLINICO_MAILPIT_URL || 'http://127.0.0.1:18025');
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(caixa.hostname), 'Use o Mailpit do ambiente isolado.');

  async function consultar(caminho) {
    const resposta = await fetch(new URL('/api/v1/' + caminho, caixa), { signal: AbortSignal.timeout(4000) });
    assert.ok(resposta.ok, 'O Mailpit do ambiente isolado precisa estar disponível.');
    return resposta.json();
  }

  await consultar('messages');
  await post('/cadastros/iniciar', { email, tipoUsuario });
  const limite = Date.now() + 15000;
  do {
    const { messages } = await consultar('messages');
    const mensagem = messages?.find((item) => item.To.some((destino) => destino.Address === email));
    if (mensagem) {
      const { Text } = await consultar('message/' + mensagem.ID);
      const tokenCadastro = /#cadastro=([0-9a-f-]{36})/i.exec(Text)?.[1];
      assert.ok(tokenCadastro, 'Link de confirmação ausente no e-mail de teste.');
      await post('/cadastros/confirmar', { token: tokenCadastro, tipoUsuario });
      return { tokenCadastro, versaoTermos: '2026-11-22' };
    }
    await aguardar(500);
  } while (Date.now() < limite);

  throw new Error('O e-mail de cadastro não chegou ao Mailpit do ambiente isolado.');
}

module.exports = { confirmarCadastroTeste };
