// Browser journeys against a REAL API and a disposable PostgreSQL database.
// Requires Angular on 127.0.0.1:14200, API on 127.0.0.1:18080 with Flyway V13,
// and CLINICO_TEST_ISOLATED=1. Creates synthetic accounts/plans; never use real data.
// NODE_PATH must contain playwright. Screenshots stay in backend/target.
const { chromium, request } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  assert.equal(process.env.CLINICO_TEST_ISOLATED, '1', 'Use only with a disposable API/database.');
  const api = 'http://127.0.0.1:18080/api/v1';
  const base = 'http://127.0.0.1:14200';
  const output = path.resolve(__dirname, '../../backend/target/qa-taco');
  fs.mkdirSync(output, { recursive: true });
  const http = await request.newContext();
  const email = `usabilidade-${Date.now()}@example.invalid`;
  const senha = 'TesteLocal123!';
  const cadastro = await http.post(`${api}/nutricionistas/autocadastro`, {
    data: { nome: 'Nutricionista de teste', email, senha, crn: `TESTE-${Date.now()}` }
  });
  assert.equal(cadastro.status(), 201, await cadastro.text());
  const login = await http.post(`${api}/auth/login`, { data: { email, senha } });
  assert.equal(login.status(), 200);
  const token = (await login.json()).data.token;
  const headers = { Authorization: `Bearer ${token}` };
  assert.equal((await http.post(`${api}/gestao-pacientes/1/vincular`, { headers })).status(), 200);
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(token => localStorage.setItem('nutri4you.jwt', token), token);
      let failSearch = false;
      await context.route('http://localhost:8080/api/v1/**', async route => {
        const url = new URL(route.request().url());
        if (failSearch && url.pathname.endsWith('/alimentos')) {
          failSearch = false;
          await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Falha simulada de rede' }) });
          return;
        }
        const response = await route.fetch({ url: `http://127.0.0.1:18080${url.pathname}${url.search}` });
        await route.fulfill({ response });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.setDefaultTimeout(12000);
      try {
        await page.goto(base + '/agenda');
        await page.getByLabel('Horário de início', { exact: true }).fill(width === 1440 ? '10:00' : '11:00');
        await page.getByRole('button', { name: 'Adicionar horário', exact: true }).click();
        await page.getByRole('button', { name: 'Salvar disponibilidade', exact: true }).click();
        await page.getByText('Disponibilidade semanal salva.', { exact: true }).waitFor();
        await page.goto(base + '/pacientes/1/plano-alimentar');
        await page.getByRole('button', { name: 'Novo plano', exact: true }).click();
        await page.getByLabel('Início da vigência', { exact: true }).fill('2030-01-01');
        await page.getByLabel('Energia (kcal)', { exact: true }).fill('100');
        await page.getByRole('button', { name: 'Salvar metas', exact: true }).click();
        await page.getByRole('button', { name: 'Adicionar refeição', exact: true }).click();
        await page.getByLabel('Nome', { exact: true }).fill('Almoço de teste');
        const busca = page.getByLabel('Buscar alimento', { exact: true });
        await busca.fill('feijao carioca cozido');
        await page.getByRole('button', { name: 'Feijão, carioca, cozido', exact: true }).waitFor();
        await busca.press('Tab');
        await page.keyboard.press('Enter');
        const quantidade = page.getByLabel('Feijão, carioca, cozido (gramas)', { exact: true });
        await quantidade.waitFor();
        await page.waitForFunction(e => e === document.activeElement, await quantidade.elementHandle());
        await quantidade.fill('250');
        await busca.fill('carne');
        await page.getByText('30 alimentos encontrados.', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Carregar mais alimentos', exact: true }).click();
        await page.getByText('60 alimentos encontrados.', { exact: true }).waitFor();
        await busca.fill('alimentoquenaoexiste');
        await page.getByText('Nenhum alimento encontrado.', { exact: true }).waitFor();
        failSearch = true;
        await busca.fill('banana');
        await page.getByRole('button', { name: 'Tentar busca novamente', exact: true }).click();
        await page.getByRole('button', { name: 'Banana, prata, crua', exact: true }).waitFor();
        await busca.fill('');
        await page.getByRole('button', { name: 'Salvar refeição', exact: true }).click();
        await page.getByText('191%', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Replicar', exact: true }).click();
        await page.waitForFunction(() => document.activeElement === document.querySelector('.replicacao input'));
        await page.getByLabel('Terça', { exact: true }).check();
        await page.getByLabel('Domingo', { exact: true }).check();
        await page.locator('.replicacao').getByRole('button', { name: 'Replicar', exact: true }).click();
        await page.locator('.replicacao').waitFor({ state: 'hidden' });
        await page.getByRole('button', { name: 'Terça', exact: true }).click();
        await page.getByRole('button', { name: 'Editar', exact: true }).click();
        await quantidade.fill('100');
        await page.getByRole('button', { name: 'Salvar refeição', exact: true }).click();
        await page.getByText('76%', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Segunda', exact: true }).click();
        await page.getByText('191%', { exact: true }).waitFor();
        page.once('dialog', d => d.dismiss());
        await page.getByRole('button', { name: 'Excluir', exact: true }).click();
        await page.getByRole('heading', { name: '08:00 · Almoço de teste', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Domingo', exact: true }).click();
        page.once('dialog', d => d.accept());
        await page.getByRole('button', { name: 'Excluir', exact: true }).click();
        await page.getByText('Nenhuma refeição para este dia.', { exact: true }).waitFor();
        await page.reload();
        await page.getByText('191%', { exact: true }).waitFor();
        const plans = (await (await http.get(`${api}/gestao-pacientes/1/planos`, { headers })).json()).data;
        const plan = plans.find(p => p.status === 'RASCUNHO');
        assert.equal(plan.refeicoes.length, 2);
        assert.equal(plan.refeicoes.find(r => r.diaSemana === 1).kcal, 191.05);
        assert.equal(plan.refeicoes.find(r => r.diaSemana === 2).kcal, 76.42);
        assert.equal(plan.refeicoes.find(r => r.diaSemana === 1).gordura, 1.35);
        assert.equal(await page.locator('.app-shell__content').evaluate(e => e.scrollWidth > e.clientWidth + 1), false);
        await page.screenshot({ path: path.join(output, `plano-${width}.png`), fullPage: true });
        // Exercise the longest results and editor on a narrow screen as well.
        await page.getByRole('button', { name: 'Editar', exact: true }).click();
        await busca.fill('carne');
        await page.getByText('30 alimentos encontrados.', { exact: true }).waitFor();
        await busca.scrollIntoViewIfNeeded();
        await page.locator('.resultados').evaluate(e => e.scrollIntoView({ block: 'center' }));
        assert.equal(await page.locator('.app-shell__content').evaluate(e => e.scrollWidth > e.clientWidth + 1), false);
        await page.screenshot({ path: path.join(output, `busca-${width}.png`), fullPage: true });
        page.once('dialog', d => d.accept());
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
        page.once('dialog', d => d.accept());
        await page.getByRole('button', { name: 'Publicar plano', exact: true }).click();
        await page.getByRole('heading', { name: `Plano ${plan.id} · PUBLICADO`, exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Editar', exact: true }).count(), 0);
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: agenda, TACO, teclado, paginação, erro/retry, totais, excesso, replicação independente, exclusão, persistência e publicação.`);
      } catch (error) {
        await page.screenshot({ path: path.join(output, `falha-${width}.png`), fullPage: true });
        throw error;
      } finally { await context.close(); }
    }
  } finally { await browser.close(); await http.dispose(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
