// End-to-end journeys of the Expo app against a disposable API/PostgreSQL.
// Start Expo with EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:18080/api/v1 on 18081.
// Set CLINICO_TEST_ISOLATED=1; NODE_PATH must include playwright.
// --setup creates synthetic users for manual/native emulator testing only.
/* global __dirname */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const API = 'http://127.0.0.1:18080/api/v1';
const output = path.resolve(__dirname, '../../backend/target/qa-agenda-mobile');
async function api(route, method = 'GET', data, token) {
  const response = await fetch(API + route, { method, headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {})
  }, body: data === undefined ? undefined : JSON.stringify(data) });
  const json = await response.json();
  assert.equal(response.ok, true, `${method} ${route}: ${response.status} ${JSON.stringify(json)}`);
  return json.data;
}
function dateKey(date) { return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); }

(async () => {
  assert.equal(process.env.CLINICO_TEST_ISOLATED, '1', 'Only run with the isolated test database.');
  fs.mkdirSync(output, { recursive: true });
  const suffix = Date.now();
  const senha = 'TesteLocal123!';
  const email = `paciente-${suffix}@example.invalid`;
  const nutriEmail = `nutri-${suffix}@example.invalid`;
  await api('/nutricionistas/autocadastro', 'POST', { nome: 'Nutri Teste Agenda', email: nutriEmail, senha, crn: `TESTE-${suffix}` });
  await api('/pacientes/autocadastro', 'POST', { nome: 'Paciente Teste Agenda', email, senha });
  const nutriToken = (await api('/auth/login', 'POST', { email: nutriEmail, senha })).token;
  const token = (await api('/auth/login', 'POST', { email, senha })).token;
  const nutri = await api('/usuarios/me', 'GET', undefined, nutriToken);
  const paciente = await api('/usuarios/me', 'GET', undefined, token);
  await api(`/gestao-pacientes/${paciente.id}/vincular`, 'POST', undefined, nutriToken);
  const sunday = new Date(); sunday.setDate(sunday.getDate() + (7 - sunday.getDay() || 7));
  const data = dateKey(sunday);
  await api('/agenda-nutricionista/horarios', 'PUT', [
    { diaSemana: 7, horario: '09:00' }, { diaSemana: 7, horario: '10:00' }, { diaSemana: 7, horario: '11:00' }
  ], nutriToken);
  const fixture = { email, senha, token, nutriToken, nutriId: nutri.id, pacienteId: paciente.id, data };
  // Disposable credentials only; kept with build outputs, never versioned.
  fs.writeFileSync(path.join(output, 'fixture.json'), JSON.stringify(fixture));
  if (process.argv.includes('--setup')) { console.log(`Fixture prepared for ${data}`); return; }
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/Sao_Paulo' });
  const page = await context.newPage();
  const texto = value => page.getByText(value, { exact: true }).filter({ visible: true });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto('http://localhost:18081', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('seu@email.com').fill(email);
    await page.getByPlaceholder('••••••••', { exact: true }).fill(senha);
    await page.getByText('Entrar', { exact: true }).click();
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await page.getByText('Agenda', { exact: true }).click();
    await texto('Nenhuma consulta agendada').waitFor();
    console.log('PASS login e acesso à agenda');
    if (sunday.getMonth() !== new Date().getMonth()) await page.getByRole('button', { name: 'Próximo mês', exact: true }).click();
    await page.getByRole('button', { name: `Dia ${sunday.getDate()}`, exact: true }).click();
    await texto('09:00-09:45').waitFor();
    const diaSelecionado = page.getByRole('button', { name: `Selecionar dia ${data}`, exact: true });
    const bounds = await diaSelecionado.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390, 'O domingo selecionado deve estar visível sem rolagem manual.');
    await diaSelecionado.click();
    await texto('09:00-09:45').click();
    await page.getByRole('button', { name: 'Confirmar Horário', exact: true }).click();
    await texto('AGUARDANDO CONFIRMAÇÃO').waitFor();
    console.log('PASS solicitação em domingo');
    assert.equal(await page.getByText('Cancelar', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Reagendar', { exact: true }).count(), 0);
    let consulta = (await api('/agenda/consultas', 'GET', undefined, token))[0];
    assert.equal(consulta.dataHora.slice(0, 16), data + 'T09:00');
    const action = async name => api(`/gestao-pacientes/${paciente.id}/consultas/${consulta.id}/${name}`, 'POST', { versao: consulta.versao }, nutriToken);
    await action('confirmacao');
    await page.reload();
    await texto('CONFIRMADO').waitFor();
    await texto('Reagendar').click();
    await texto('10:00-10:45').click();
    await page.getByRole('button', { name: 'Confirmar Horário', exact: true }).click();
    await texto('AGUARDANDO CONFIRMAÇÃO').waitFor();
    consulta = (await api('/agenda/consultas', 'GET', undefined, token))[0];
    assert.equal(consulta.dataHora.slice(0, 16), data + 'T10:00');
    await action('confirmacao');
    await page.reload();
    await texto('CONFIRMADO').waitFor();
    const calendar = page.getByRole('button', { name: 'Adicionar consulta ao Google Agenda', exact: true });
    await calendar.waitFor();
    // Capture the outgoing URL without sending an event or contacting Google.
    await page.evaluate(() => { window.open = url => { window.__calendarUrl = String(url); return null; }; });
    await calendar.click();
    const url = new URL(await page.evaluate(() => window.__calendarUrl));
    assert.equal(url.hostname, 'calendar.google.com');
    assert.equal(url.searchParams.get('ctz'), 'America/Sao_Paulo');
    await texto('Cancelar').click();
    await page.getByRole('button', { name: 'Manter Consulta', exact: true }).click();
    assert.equal((await api('/agenda/consultas', 'GET', undefined, token)).length, 1);
    await texto('Cancelar').click();
    await page.getByRole('button', { name: 'Confirmar Cancelamento', exact: true }).click();
    await texto('Nenhuma consulta agendada').waitFor();
    assert.equal((await api('/agenda/consultas', 'GET', undefined, token)).length, 0);
    const livre = await api(`/agenda/disponibilidade?nutricionistaId=${nutri.id}&data=${data}`, 'GET', undefined, token);
    assert.equal(livre.horarios.length, 3);
    await page.screenshot({ path: path.join(output, 'agenda-expo-web.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS Expo Web + API + PostgreSQL: login, domingo, solicitação, pendente sem ações, aprovação, reagendamento, Google Agenda e cancelamento.');
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'falha-expo-web.png'), fullPage: true });
    console.error((await page.locator('body').innerText()).slice(0, 2000));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
