// Local browser smoke test with synthetic API fixtures. No real patient data or backend writes.
// Usage: NODE_PATH=<directory containing playwright> node scripts/smoke-clinico.cjs
// Requires ng serve on http://127.0.0.1:14200 (or CLINICO_PREVIEW_URL).
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => { localStorage.setItem('nutri4you.jwt', 'synthetic-test-token'); });
    let horarios = [{ diaSemana: 1, horario: '08:00' }];
    let plano = { id: 1, status: 'RASCUNHO', versao: 0, idConsulta: null,
      vigenciaInicio: '2030-01-01', vigenciaFim: null, metaKcal: 200, metaProteina: 50,
      metaCarboidratos: 100, metaGordura: 30, refeicoes: [
        { id: 1, nome: 'Almoço', horario: '12:00', diaSemana: 1, kcal: 300, proteina: 10,
          carboidratos: 40, gordura: null, itens: [{ alimentoId: 1, nome: 'Arroz integral', quantidadeGramas: 250 }] }
      ] };
    let deletes = 0;
    await context.route('http://localhost:8080/api/v1/**', async route => {
      const req = route.request(), url = new URL(req.url()), p = url.pathname;
      let data;
      if (p.endsWith('/usuarios/me')) data = { nome: 'Nutricionista de teste', perfil: 'NUTRICIONISTA', email: 'teste@example.invalid' };
      else if (p.endsWith('/agenda-nutricionista/horarios')) {
        if (req.method() === 'PUT') horarios = req.postDataJSON();
        data = horarios;
      } else if (p.endsWith('/alimentos')) data = [{ id: 2, nome: 'Banana prata', kcal: 100, proteina: 1, carboidratos: 25, gordura: 0 }];
      else if (p.endsWith('/planos')) data = [plano];
      else if (p.endsWith('/refeicoes') && req.method() === 'POST') {
        const r = req.postDataJSON();
        plano = { ...plano, versao: plano.versao + 1, refeicoes: [...plano.refeicoes,
          { ...r, id: 2, kcal: 100, proteina: 1, carboidratos: 25, gordura: 0,
            itens: r.itens.map(i => ({ ...i, nome: 'Banana prata' })) }] };
        data = plano;
      } else if (req.method() === 'DELETE') { deletes++; data = plano; }
      else throw new Error(`Unexpected API request: ${req.method()} ${p}`);
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const base = process.env.CLINICO_PREVIEW_URL || 'http://127.0.0.1:14200';
    await page.goto(base + '/agenda');
    await page.getByLabel('Horário de início', { exact: true }).fill('10:00');
    await page.getByRole('button', { name: 'Adicionar horário', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar disponibilidade', exact: true }).click();
    await page.getByText('Disponibilidade semanal salva.', { exact: true }).waitFor();
    assert.equal(horarios.length, 2);
    const output = path.resolve(__dirname, '../../backend/target/qa-clinico');
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'agenda-desktop.png'), fullPage: true });
    await page.goto(base + '/pacientes/1/plano-alimentar');
    await page.getByText('150%', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Terça', exact: true }).click();
    await page.getByText('Nenhuma refeição para este dia.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Adicionar refeição', exact: true }).click();
    await page.getByLabel('Nome', { exact: true }).fill('Lanche');
    await page.getByLabel('Buscar alimento', { exact: true }).fill('banana');
    await page.getByRole('button', { name: 'Banana prata', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar refeição', exact: true }).click();
    await page.getByRole('heading', { name: '08:00 · Lanche', exact: true }).waitFor();
    assert.equal(plano.refeicoes[1].diaSemana, 2);
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();
    assert.equal(deletes, 0);
    await page.getByRole('button', { name: 'Segunda', exact: true }).click();
    await page.screenshot({ path: path.join(output, 'plano-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => {
      const content = document.querySelector('.app-shell__content');
      return content.scrollWidth > content.clientWidth + 1;
    });
    assert.equal(overflow, false, 'Clinical content must not overflow on narrow screens');
    await page.screenshot({ path: path.join(output, 'plano-mobile.png'), fullPage: true });
    await page.locator('.app-shell__content').evaluate(e => { e.scrollTop = e.scrollHeight; });
    await page.screenshot({ path: path.join(output, 'plano-mobile-bottom.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: agenda, refeições por dia, busca, inclusão acima da meta e cancelamento da exclusão.');
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
