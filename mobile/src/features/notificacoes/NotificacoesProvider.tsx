import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { getToken } from '../../core/auth/token-storage';
import { carregarPerfil } from '../../core/perfil/perfil.service';
import type { RootStackParamList } from '../../navigation/types';
import type { Appointment } from '../appointments/appointments.models';
import { listAppointments } from '../appointments/appointments.service';
import { chaveLembrete, selecionarLembretes } from './lembretes';
import { gravarVistas, lerVistas } from './leitura-storage';
import { chaveAviso, listarAvisosConsulta, listarAvisosPlanos, type AvisoPaciente } from './notificacoes.service';

interface Sessao {
  token: string;
  id: number;
  nome: string;
  vistas: Set<string>;
}

interface DadosNotificacoes {
  avisos: AvisoPaciente[];
  lembretes: Appointment[];
  quantidade: number;
  nome: string;
}

type Modo = 'abertura' | 'gesto' | 'silencioso';

interface EstadoNotificacoes extends DadosNotificacoes {
  carregando: boolean;
  atualizando: boolean;
  erro: string;
  carregar: (modo: Modo) => Promise<void>;
}

const inicial: DadosNotificacoes = { avisos: [], lembretes: [], quantidade: 0, nome: '' };
const mensagemErro = 'Não foi possível carregar suas notificações. Tente novamente.';
const rotasPublicas = new Set<keyof RootStackParamList>(['Login', 'CriarConta', 'Health']);
const ContextoNotificacoes = createContext<EstadoNotificacoes | null>(null);

export function NotificacoesProvider({ children, rota }: PropsWithChildren<{ rota?: keyof RootStackParamList }>) {
  const [dados, setDados] = useState(inicial);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const sessaoAtual = useRef<Sessao | null>(null);
  const revisao = useRef(0);
  const rotaAtiva = rota !== undefined && !rotasPublicas.has(rota);
  const telaAberta = rota === 'Notificacoes';
  const invalidar = useCallback(() => { revisao.current++; }, []);

  const carregar = useCallback(async (modo: Modo) => {
    const requisicao = ++revisao.current;
    const vigente = () => revisao.current === requisicao;
    if (modo !== 'silencioso') {
      setCarregando(modo === 'abertura');
      setAtualizando(modo === 'gesto');
      setErro('');
    }

    try {
      const token = await (rotaAtiva ? getToken() : null);
      if (!vigente()) return;
      if (!token) {
        sessaoAtual.current = null;
        setDados(inicial);
        if (telaAberta) setErro(mensagemErro);
        return;
      }

      let sessao = sessaoAtual.current;
      if (sessao?.token !== token) {
        setDados(inicial);
        const { id, nome } = await carregarPerfil();
        const vistas = await lerVistas(id);
        if (!vigente()) return;
        sessao = { token, id, nome, vistas };
        sessaoAtual.current = sessao;
      }

      const [consultas, avisosConsultas, avisosPlanos] = await Promise.all([
        listAppointments(), listarAvisosConsulta(), listarAvisosPlanos()
      ]);
      if (!vigente()) return;
      const avisos = [...avisosConsultas, ...avisosPlanos]
        .sort((a, b) => Date.parse(b.criadaEm) - Date.parse(a.criadaEm))
        .slice(0, 50);
      const statusNotificados = new Set(avisosConsultas.map(({ consultaId, tipo }) =>
        consultaId + ':' + (tipo === 'REAGENDADA' ? 'CONFIRMADA' : tipo)
      ));
      const lembretes = selecionarLembretes(consultas ?? [], new Date(Date.now()))
        .filter(({ id, status }) => !statusNotificados.has(id + ':' + status));
      const chaves = new Set([...avisos.map(chaveAviso), ...lembretes.map(chaveLembrete)]);
      const quantidade = [...chaves].filter(chave => !sessao.vistas.has(chave)).length;
      if (telaAberta && (quantidade > 0 || chaves.size !== sessao.vistas.size)) {
        sessao.vistas = chaves;
        gravarVistas(sessao.id, chaves);
      }
      setDados({ avisos, lembretes, quantidade: telaAberta ? 0 : quantidade, nome: sessao.nome });
      setErro('');
    } catch {
      if (vigente() && modo !== 'silencioso') setErro(mensagemErro);
    } finally {
      if (vigente()) {
        setCarregando(false);
        setAtualizando(false);
      }
    }
  }, [rotaAtiva, telaAberta]);

  useEffect(() => {
    const consultar = () => void carregar(telaAberta ? 'abertura' : 'silencioso');
    consultar();
    if (!rotaAtiva) return invalidar;

    const retomada = AppState.addEventListener('change', estado => {
      if (estado === 'active') consultar();
    });
    const intervalo = setInterval(() => {
      if (AppState.currentState === 'active') void carregar('silencioso');
    }, 30_000);
    return () => {
      invalidar();
      retomada.remove();
      clearInterval(intervalo);
    };
  }, [rota, rotaAtiva, telaAberta, carregar, invalidar]);

  const valor = useMemo(() => ({
    ...(rotaAtiva ? dados : inicial), carregando, atualizando, erro, carregar
  }), [rotaAtiva, dados, carregando, atualizando, erro, carregar]);

  return <ContextoNotificacoes.Provider value={valor}>{children}</ContextoNotificacoes.Provider>;
}

export function useNotificacoes() {
  const contexto = useContext(ContextoNotificacoes);
  if (!contexto) throw new Error('NotificacoesProvider ausente.');
  return contexto;
}
