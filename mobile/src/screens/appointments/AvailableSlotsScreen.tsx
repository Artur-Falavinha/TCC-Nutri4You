import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectionCardHeader, sectionCardStyles } from '../../components/layout/SectionCardHeader';
import { ApiError } from '../../core/api/api-response.types';
import { dataIsoDaClinica, formatarDataCivil, formatDateFromDate, toIsoDate } from '../../core/utils/date-mask.util';
import {
  getAppointmentAvailability, listAgendaNutritionists, listAppointments, rescheduleAppointment, scheduleAppointment
} from '../../features/appointments/appointments.service';
import {
  buildWeekDays, dateKeyFromLocalDateTime, groupSlotsByPeriod, timeRangeLabel, toDateKey, weekdayShort
} from '../../features/appointments/appointments-date.util';
import { AgendaNutritionist, Appointment, AppointmentAvailability } from '../../features/appointments/appointments.models';
import { AppointmentRequestReceipt } from '../../features/appointments/components/AppointmentRequestReceipt';
import { AppointmentSteps } from '../../features/appointments/components/AppointmentSteps';
import { CalendarCard } from '../../features/appointments/components/CalendarCard';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'HorariosDisponiveis'>;

export function AvailableSlotsScreen({ navigation, route }: Props) {
  const { nutricionistaId, data, consultaId, versao } = route.params ?? {};
  const hoje = dataIsoDaClinica();
  const reagendamento = consultaId !== undefined;
  const rotaValida = Number.isSafeInteger(nutricionistaId) && nutricionistaId > 0
    && (!reagendamento || (Number.isSafeInteger(consultaId) && consultaId > 0 && Number.isSafeInteger(versao)));
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const inicial = toIsoDate(data ?? '');
    return inicial && inicial >= hoje ? inicial : '';
  });
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [horario, setHorario] = useState<string>();
  const [profissional, setProfissional] = useState<AgendaNutritionist>();
  const [datasComConsulta, setDatasComConsulta] = useState<Set<string>>();
  const [disponibilidade, setDisponibilidade] = useState<AppointmentAvailability>();
  const [carregando, setCarregando] = useState(!!dataSelecionada);
  const [enviando, setEnviando] = useState(false);
  const [erroHorarios, setErroHorarios] = useState('');
  const [erroEnvio, setErroEnvio] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [solicitacao, setSolicitacao] = useState<Appointment>();
  const travaEnvio = useRef(false);
  const rolagem = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (!rotaValida) return;
    let ativa = true;
    if (!reagendamento) {
      void listAgendaNutritionists().then((opcoes) => {
        if (ativa) setProfissional(opcoes.find((item) => item.id === nutricionistaId));
      }).catch(() => undefined);
    }
    void listAppointments().then((consultas) => {
      if (ativa) setDatasComConsulta(new Set(consultas
        .filter((item) => !['CANCELADA', 'RECUSADA'].includes(item.status))
        .map((item) => dateKeyFromLocalDateTime(item.dataHora))));
    }).catch(() => undefined);
    return () => { ativa = false; };
  }, [nutricionistaId, reagendamento, rotaValida]);

  useEffect(() => {
    if (!rotaValida || !dataSelecionada) return;
    let ativa = true;
    void getAppointmentAvailability(nutricionistaId, dataSelecionada, consultaId)
      .then((resposta) => {
        if (ativa) setDisponibilidade(resposta);
      })
      .catch((falha: unknown) => {
        if (ativa) setErroHorarios(falha instanceof ApiError
          ? falha.message : 'Não foi possível carregar os horários disponíveis.');
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });
    return () => { ativa = false; };
  }, [nutricionistaId, dataSelecionada, consultaId, rotaValida, tentativa]);

  const mudarData = (novaData: string) => {
    setCalendarioAberto(false);
    if (novaData === dataSelecionada) return;
    setHorario(undefined);
    setDisponibilidade(undefined);
    setErroHorarios('');
    setErroEnvio('');
    setCarregando(true);
    setDataSelecionada(novaData);
  };

  const enviar = async () => {
    if (!horario || !rotaValida || travaEnvio.current) return;
    travaEnvio.current = true;
    setEnviando(true);
    setErroEnvio('');
    try {
      const consulta = consultaId !== undefined && versao !== undefined
        ? await rescheduleAppointment(consultaId, { dataHora: horario, versao })
        : await scheduleAppointment({ nutricionistaId, dataHora: horario });
      setSolicitacao({ ...consulta, avulsa: consulta.avulsa ?? (!reagendamento && profissional?.vinculado === false) });
      rolagem.current?.scrollTo({ y: 0, animated: false });
    } catch (falha) {
      setErroEnvio(falha instanceof ApiError ? falha.message : 'Não foi possível enviar a solicitação.');
    } finally {
      travaEnvio.current = false;
      setEnviando(false);
    }
  };

  const voltar = () => navigation.popTo('Agenda');
  const nome = disponibilidade?.nutricionistaNome ?? profissional?.nome;
  const duracao = disponibilidade?.duracaoMinutos ?? 45;
  const escolherData = calendarioAberto || !dataSelecionada;
  const periodos = groupSlotsByPeriod(disponibilidade?.horarios ?? []);
  const temHorarios = !!(disponibilidade?.horarios.length);
  const titulo = solicitacao ? 'Acompanhe o pedido' : reagendamento ? 'Reagendar consulta' : 'Agendar consulta';

  const voltarAgenda = (
    <Pressable style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]} onPress={voltar} accessibilityRole="button">
      <Text style={styles.botaoTexto}>{solicitacao ? 'Acompanhar na agenda' : 'Voltar à agenda'}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.barra}>
        <View style={styles.barraConteudo}>
          <Pressable style={styles.voltar} onPress={voltar} disabled={enviando} accessibilityRole="button" accessibilityLabel="Voltar à agenda">
            <Feather name="arrow-left" size={22} color={colors.brandDeep} aria-hidden />
          </Pressable>
          <Text style={styles.tituloPagina} accessibilityRole="header" aria-level={1}>{titulo}</Text>
        </View>
      </View>

      <ScrollView ref={rolagem} style={styles.scroll} contentContainerStyle={styles.conteudo}>
        {!reagendamento && rotaValida && <AppointmentSteps atual={solicitacao ? 3 : 2} />}
        {!rotaValida ? (
          <View style={sectionCardStyles.superficie}>
            <Text style={styles.erro} accessibilityRole="alert">Agendamento indisponível. Escolha um nutricionista na Agenda.</Text>
            {voltarAgenda}
          </View>
        ) : solicitacao ? (
          <>
            <AppointmentRequestReceipt consulta={solicitacao} reagendamento={reagendamento} duracao={duracao} />
            {voltarAgenda}
          </>
        ) : (
          <>
            {nome && (
              <View style={[sectionCardStyles.superficie, styles.perfil]}>
                <SectionCardHeader icone="user" titulo={nome} />
                {disponibilidade?.especialidade && <Text style={styles.descricao}>{disponibilidade.especialidade}</Text>}
              </View>
            )}
            {escolherData ? (
              <>
                <CalendarCard
                  selectedDate={dataSelecionada || undefined}
                  appointmentDates={datasComConsulta}
                  onSelectDate={(novaData) => {
                    mudarData(novaData);
                    rolagem.current?.scrollTo({ y: 0, animated: false });
                  }}
                />
                {!!dataSelecionada && (
                  <Pressable onPress={() => setCalendarioAberto(false)} accessibilityRole="button" style={styles.acaoSecundaria}>
                    <Text style={styles.acaoTexto}>Voltar aos horários</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <View style={sectionCardStyles.superficie}>
                  <SectionCardHeader titulo="Data da consulta" icone="calendar" />
                  <View style={styles.dataLinha}>
                    <Text style={[styles.dataTexto, styles.dadosData]}>{formatarDataCivil(dataSelecionada)}</Text>
                    <Pressable onPress={() => setCalendarioAberto(true)} disabled={enviando} accessibilityRole="button" style={styles.acaoSecundaria}>
                      <Text style={styles.acaoTexto}>Alterar data</Text>
                    </Pressable>
                  </View>
                  <View style={styles.dias}>
                    {buildWeekDays(dataSelecionada).map((dia) => {
                      const chave = toDateKey(dia);
                      const ativo = chave === dataSelecionada;
                      const desabilitado = enviando || chave < hoje;
                      return (
                        <Pressable
                          key={chave}
                          style={[styles.dia, ativo && styles.selecionado, desabilitado && styles.desabilitado]}
                          accessibilityRole="button"
                          accessibilityLabel={`Selecionar dia ${formatDateFromDate(dia)}`}
                          accessibilityState={{ selected: ativo, disabled: desabilitado }}
                          onPress={() => mudarData(chave)}
                          disabled={desabilitado}
                        >
                          <Text style={[styles.diaRotulo, ativo && styles.selecionadoTexto]}>{weekdayShort(dia)}</Text>
                          <Text style={[styles.diaNumero, ativo && styles.selecionadoTexto]}>{dia.getDate()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={sectionCardStyles.superficie}>
                  <SectionCardHeader titulo="Escolha o horário" icone="clock" />
                  {carregando ? (
                    <View style={styles.carregando} aria-busy>
                      <ActivityIndicator color={colors.brand} />
                      <Text style={styles.descricao}>Buscando horários…</Text>
                    </View>
                  ) : erroHorarios ? (
                    <View style={styles.avisoErro}>
                      <Text style={styles.erro} accessibilityRole="alert">{erroHorarios}</Text>
                      <Pressable accessibilityRole="button" style={styles.acaoSecundaria} onPress={() => {
                        setErroHorarios('');
                        setCarregando(true);
                        setTentativa((valor) => valor + 1);
                      }}>
                        <Text style={styles.acaoTexto}>Tentar novamente</Text>
                      </Pressable>
                    </View>
                  ) : temHorarios ? (
                    <>
                      <Periodos titulo="Manhã" horarios={periodos.morning} selecionado={horario} duracao={duracao} desabilitado={enviando} selecionar={setHorario} />
                      <Periodos titulo="Tarde" horarios={periodos.afternoon} selecionado={horario} duracao={duracao} desabilitado={enviando} selecionar={setHorario} />
                      <Text style={styles.descricao}>Duração aproximada de {duracao} minutos. Chegue com 10 minutos de antecedência.</Text>
                    </>
                  ) : (
                    <View style={styles.vazio}>
                      <Text style={styles.dataTexto}>Não há horários disponíveis nesta data.</Text>
                      <Text style={styles.descricao}>Escolha outro dia para continuar.</Text>
                    </View>
                  )}
                  {!!erroEnvio && <Text style={[styles.erro, styles.avisoErro]} accessibilityRole="alert">{erroEnvio}</Text>}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {!solicitacao && !escolherData && temHorarios && (
        <View style={styles.rodape}>
          <View style={styles.rodapeConteudo}>
            {horario ? (
              <View style={styles.dadosData} aria-live="polite">
                <Text style={styles.dataTexto}>{formatarDataCivil(dataSelecionada)} · {timeRangeLabel(horario, duracao)}</Text>
                <Text style={styles.descricao}>
                  {profissional?.vinculado === false && !reagendamento
                    ? 'O nutricionista precisa aceitar a consulta para confirmar o horário e criar o vínculo.'
                    : 'O horário depende da confirmação do nutricionista.'}
                </Text>
              </View>
            ) : <Text style={styles.descricao}>Selecione um horário para enviar a solicitação.</Text>}
            <Pressable
              style={({ pressed }) => [styles.botao, (!horario || enviando) && styles.botaoDesabilitado, pressed && styles.botaoPressionado]}
              onPress={() => void enviar()}
              disabled={!horario || enviando}
              accessibilityRole="button"
              accessibilityState={{ disabled: !horario || enviando, busy: enviando }}
            >
              <Text style={styles.botaoTexto}>{enviando ? 'Enviando…' : reagendamento ? 'Solicitar reagendamento' : 'Solicitar consulta'}</Text>
              {enviando ? <ActivityIndicator color={colors.white} /> : <Feather name="arrow-right" size={18} color={colors.white} aria-hidden />}
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

interface PeriodosProps {
  titulo: string;
  horarios: string[];
  selecionado?: string;
  duracao: number;
  desabilitado: boolean;
  selecionar: (valor: string) => void;
}

function Periodos({ titulo, horarios, selecionado, duracao, desabilitado, selecionar }: PeriodosProps) {
  if (!horarios.length) return null;
  return (
    <View style={styles.periodo}>
      <Text style={styles.dataTexto} accessibilityRole="header">{titulo}</Text>
      <View style={styles.horarios}>
        {horarios.map((opcao) => {
          const ativo = selecionado === opcao;
          return (
            <Pressable
              key={opcao}
              style={[styles.horario, ativo && styles.selecionado]}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              disabled={desabilitado}
              onPress={() => selecionar(opcao)}
            >
              <Text style={[styles.horarioTexto, ativo && styles.selecionadoTexto]}>{timeRangeLabel(opcao, duracao)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { flex: 1 },
  barra: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  barraConteudo: {
    width: '100%', maxWidth: 560, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm
  },
  voltar: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  tituloPagina: { flex: 1, color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 21, lineHeight: 28 },
  conteudo: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: spacing.md, gap: spacing.md },
  perfil: { gap: spacing.xs },
  descricao: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  dataLinha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  dadosData: { flexGrow: 1, gap: spacing.xxs },
  dataTexto: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22 },
  dias: { flexDirection: 'row', gap: spacing.xxs },
  dia: { flex: 1, minHeight: 50, borderRadius: radius.sm, backgroundColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  diaRotulo: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  diaNumero: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 21 },
  desabilitado: { opacity: 0.48 },
  acaoSecundaria: {
    alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.confirmedBackground
  },
  acaoTexto: { color: colors.brandDark, fontFamily: fontFamily.bold, fontSize: 13, lineHeight: 19 },
  carregando: { minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  vazio: { padding: spacing.sm, gap: spacing.xxs, backgroundColor: colors.subtle, borderRadius: radius.md },
  avisoErro: { padding: spacing.sm, gap: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.dangerButtonBackground },
  erro: { color: colors.dangerText, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  periodo: { gap: spacing.xs },
  horarios: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xs, rowGap: spacing.xs },
  horario: {
    flexBasis: '46%', flexGrow: 1, minHeight: 48, padding: spacing.xs, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md
  },
  horarioTexto: { color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 20 },
  selecionado: { backgroundColor: colors.brand, borderColor: colors.brand },
  selecionadoTexto: { color: colors.white },
  rodape: { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  rodapeConteudo: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: spacing.md, gap: spacing.xs },
  botao: {
    minHeight: 48, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, backgroundColor: colors.brand
  },
  botaoDesabilitado: { backgroundColor: colors.textSecondary },
  botaoPressionado: { backgroundColor: colors.brandDark },
  botaoTexto: { flexShrink: 1, color: colors.white, fontFamily: fontFamily.bold, fontSize: 15, lineHeight: 22 }
});
