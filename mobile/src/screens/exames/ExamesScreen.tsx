import { DialogoConfirmacao } from '../../components/feedback/DialogoConfirmacao';
import { toast } from '../../components/feedback/toast';
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DragEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import {
  ArquivoExameSelecionado,
  ExamePedido
} from '../../features/exames/exames.models';
import {
  baixarResultadoExame,
  enviarResultadoExame,
  inferMimeTypeFromFileName,
  listarMeusExames,
  prepararArquivoWeb,
  removerResultadoExame,
  selecionarArquivoDispositivo,
  validarArquivoExame
} from '../../features/exames/exames.service';
import { RootStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, shadows, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Exames'>;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function formatFileSize(bytes?: number): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes <= 0) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1).replace('.', ',')} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2).replace('.', ',')} MB`;
}

export function ExamesScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;

  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exames, setExames] = useState<ExamePedido[]>([]);

  const [selectedExame, setSelectedExame] = useState<ExamePedido | null>(null);
  const [selectedFile, setSelectedFile] = useState<ArquivoExameSelecionado | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exameParaRemover, setExameParaRemover] = useState<ExamePedido | null>(null);
  const [erroRemocao, setErroRemocao] = useState('');
  const [uploadError, setUploadError] = useState('');

  const requestId = useRef(0);

  const carregarExames = useCallback(async (isRefresh = false) => {
    const currentRequest = ++requestId.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const lista = await listarMeusExames();
      if (currentRequest === requestId.current) {
        setExames(lista);
      }
    } catch (failure) {
      if (currentRequest === requestId.current) {
        setError(
          extractErrorMessage(
            failure,
            'Não foi possível carregar seus pedidos de exames. Tente novamente.'
          )
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const currentRequest = ++requestId.current;

    void listarMeusExames()
      .then((lista) => {
        if (active && currentRequest === requestId.current) {
          setExames(lista);
        }
      })
      .catch((failure: unknown) => {
        if (active && currentRequest === requestId.current) {
          setError(
            extractErrorMessage(
              failure,
              'Não foi possível carregar seus pedidos de exames. Tente novamente.'
            )
          );
        }
      })
      .finally(() => {
        if (active && currentRequest === requestId.current) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (currentRequest === requestId.current) {
        requestId.current += 1;
      }
    };
  }, []);

  const signOut = async () => {
    await logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  const navigateFromMenu = async (destination: MenuDestination) => {
    setMenuVisible(false);
    switch (destination) {
      case 'home':
        navigation.navigate('Dashboard');
        return;
      case 'profile':
        navigation.navigate('DadosPessoais');
        return;
      case 'results':
        navigation.navigate('Evolucao');
        return;
      case 'appointments':
        navigation.navigate('Agenda');
        return;
      case 'diet':
        navigation.navigate('Dieta');
        return;
      case 'shopping':
        navigation.navigate('Compras');
        return;
      case 'exams':
        return;
      case 'password':
        navigation.navigate('TrocarSenha');
        return;
      case 'logout':
        await signOut();
        return;
    }
  };

  const abrirModalEnvio = (exame: ExamePedido) => {
    setSelectedExame(exame);
    setSelectedFile(null);
    setIsDraggingOver(false);
    setUploadError('');
  };

  const fecharModalEnvio = () => {
    if (uploading) {
      return;
    }
    setSelectedExame(null);
    setSelectedFile(null);
    setIsDraggingOver(false);
    setUploadError('');
  };

  const aplicarArquivoEscolhido = (arquivo: ArquivoExameSelecionado | null) => {
    if (!arquivo) {
      return;
    }
    const validationError = validarArquivoExame(arquivo);
    if (validationError) {
      setSelectedFile(null);
      setUploadError(validationError);
      return;
    }
    setSelectedFile(arquivo);
    setUploadError('');
  };

  const selecionarArquivo = async () => {
    if (!selectedExame || uploading) {
      return;
    }
    try {
      const arquivo = await selecionarArquivoDispositivo();
      aplicarArquivoEscolhido(arquivo);
    } catch (failure) {
      setUploadError(
        extractErrorMessage(
          failure,
          'Não foi possível abrir o seletor de arquivos do dispositivo.'
        )
      );
    }
  };

  const limparArquivoSelecionado = () => {
    setSelectedFile(null);
    setUploadError('');
  };

  const baixarExame = async (exame: ExamePedido) => {
    try {
      const blob = await baixarResultadoExame(exame.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exame.arquivoNome || `exame-${exame.id}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      toast.erro(extractErrorMessage(failure, 'Não foi possível baixar o resultado.'));
    }
  };

  const fecharConfirmacaoRemocao = () => {
    setExameParaRemover(null);
    setErroRemocao('');
  };

  const handleRemoverExameEnviado = async (exame: ExamePedido) => {
    setErroRemocao('');
    try {
      const atualizado = await removerResultadoExame(exame.id, exame.versao);
      setExames((prev) =>
        prev.map((item) =>
          item.id === exame.id
            ? {
                ...item,
                ...atualizado,
                nome: item.nome,
                status: 'PENDENTE',
                arquivoNome: null,
                arquivoUrl: null,
                dataEnvio: null
              }
            : item
        )
      );
      toast.sucesso(
        `Envio de "${exame.nome}" removido. O exame voltou para PENDENTE.`
      );
      if (selectedExame?.id === exame.id) {
        setSelectedExame(null);
        setSelectedFile(null);
      }
      fecharConfirmacaoRemocao();
    } catch (failure) {
      setErroRemocao(extractErrorMessage(failure, 'Não foi possível remover o arquivo. Tente novamente.'));
    }
  };

  const confirmarEnvio = async () => {
    if (!selectedExame) {
      return;
    }
    if (!selectedFile || !selectedFile.nome.trim()) {
      setUploadError('Selecione um arquivo antes de confirmar o envio.');
      return;
    }

    const validationError = validarArquivoExame(selectedFile);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const atualizado = await enviarResultadoExame(selectedExame.id, {
        versao: selectedExame.versao,
        arquivo: {
          ...selectedFile,
          nome: selectedFile.nome.trim(),
          tipo: selectedFile.tipo || inferMimeTypeFromFileName(selectedFile.nome)
        }
      });

      setExames((prev) =>
        prev.map((item) =>
          item.id === selectedExame.id
            ? {
                ...item,
                ...atualizado,
                nome: item.nome,
                status: 'ENVIADO',
                arquivoNome: atualizado.arquivoNome ?? selectedFile.nome.trim()
              }
            : item
        )
      );
      toast.sucesso(`Resultado de "${selectedExame.nome}" enviado com sucesso.`);
      setSelectedExame(null);
      setSelectedFile(null);
    } catch (failure) {
      setUploadError(
        extractErrorMessage(
          failure,
          'Não foi possível enviar o resultado do exame. Tente novamente.'
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const soltarArquivo = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const arquivo = event.dataTransfer.files[0];
    if (arquivo && !uploading) {
      aplicarArquivoEscolhido(prepararArquivoWeb(arquivo));
    }
  };


  const envioDesabilitado = !selectedFile || uploading;
  const uploadArea = (
    <Pressable
      style={({ pressed }) => [
        styles.uploadDropArea,
        isDraggingOver && styles.uploadDropAreaDragging,
        uploading && styles.buttonDisabled,
        pressed && styles.pressed
      ]}
      onPress={() => void selecionarArquivo()}
      disabled={uploading}
      accessibilityRole="button"
      accessibilityLabel="Clique para selecionar arquivo PDF ou imagem do exame"
      accessibilityState={{ disabled: uploading }}
      testID="exame-upload-select-area"
    >
      <View style={styles.iconBadge} aria-hidden>
        <Feather name="upload-cloud" size={22} color={colors.brand} />
      </View>
      <View style={styles.uploadCopy}>
        <Text style={styles.uploadPromptText}>Clique para selecionar</Text>
        <Text style={styles.uploadFormatHint}>
          Formatos aceitos: PDF, PNG ou JPEG (máx. 5 MiB)
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <AppHeader onOpenMenu={() => setMenuVisible(true)} />
      <SideMenu
        visible={menuVisible}
        activeItem="exams"
        userName="Paciente"
        onClose={() => setMenuVisible(false)}
        onNavigate={(destination) => void navigateFromMenu(destination)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, width < 420 && styles.contentCompact, { maxWidth: wide ? 760 : 560 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void carregarExames(true)}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.title} accessibilityRole="header" aria-level={1}>Pedidos de Exames</Text>
          <Text style={styles.bodyText}>Envie seus resultados para análise nutricional personalizada.</Text>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert" testID="exames-error-box">
            <Text style={styles.errorTitle}>Não foi possível carregar os exames</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.pressed]}
              onPress={() => void carregarExames()}
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
              testID="exames-retry-button"
            >
              <Text style={[styles.buttonText, styles.primaryText]}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && exames.length === 0 ? (
          <View style={[styles.surface, styles.stateCard]} aria-live="polite" testID="exames-loading">
            <ActivityIndicator color={colors.brand} />
            <Text style={[styles.bodyText, styles.centered]}>Carregando pedidos de exames...</Text>
          </View>
        ) : error && exames.length === 0 ? null : exames.length === 0 ? (
          <View style={[styles.surface, styles.stateCard]} testID="exames-empty">
            <View style={styles.iconBadge} aria-hidden>
              <Feather name="clipboard" size={22} color={colors.brand} />
            </View>
            <Text style={styles.stateTitle} accessibilityRole="header" aria-level={2}>Nenhum pedido de exame</Text>
            <Text style={[styles.bodyText, styles.centered]}>
              Quando sua nutricionista solicitar exames laboratoriais, eles aparecerão aqui para envio.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList} testID="exames-cards-list">
            {exames.map(exame => {
              const pendente = exame.status === 'PENDENTE';
              const enviado = exame.status === 'ENVIADO';
              const podeBaixar = Platform.OS === 'web' && exame.possuiArquivo;

              return (
                <View key={exame.id} style={styles.surface} testID={`exame-card-${exame.id}`}>
                  <View style={styles.examHeader}>
                    <View style={styles.iconBadge} aria-hidden>
                      <Feather name="file-text" size={20} color={colors.brand} />
                    </View>
                    <View style={styles.examIdentity}>
                      <Text style={styles.examName} accessibilityRole="header" aria-level={2}>{exame.nome}</Text>
                      <Text
                        style={[styles.statusLabel, pendente && styles.statusPending, enviado && styles.statusSent]}
                        testID={`exame-status-${exame.id}`}
                      >
                        {exame.status}
                      </Text>
                    </View>
                  </View>

                  {exame.arquivoNome ? (
                    <View style={styles.fileRow}>
                      <Feather name="paperclip" size={16} color={colors.brandDeep} aria-hidden />
                      <Text style={styles.fileCaption}>Arquivo: {exame.arquivoNome}</Text>
                    </View>
                  ) : null}
                  {exame.parecer ? (
                    <View style={styles.report}>
                      <Text style={styles.reportText}><Text style={styles.fieldLabel}>Parecer: </Text>{exame.parecer}</Text>
                    </View>
                  ) : null}

                  {(pendente || enviado || podeBaixar) && (
                    <View style={styles.cardActionsRow}>
                      {(pendente || enviado) && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.button, pendente ? styles.primaryButton : styles.secondaryButton, pressed && styles.pressed
                          ]}
                          onPress={() => abrirModalEnvio(exame)}
                          accessibilityRole="button"
                          accessibilityLabel={pendente ? `Enviar resultado de ${exame.nome}` : `Substituir ou gerenciar resultado de ${exame.nome}`}
                          testID={`exame-action-button-${exame.id}`}
                        >
                          <Feather name={pendente ? 'upload' : 'repeat'} size={16} color={pendente ? colors.white : colors.brandDeep} aria-hidden />
                          <Text style={[styles.buttonText, pendente && styles.primaryText]}>{pendente ? 'Enviar resultado' : 'Substituir arquivo'}</Text>
                        </Pressable>
                      )}
                      {podeBaixar && (
                        <Pressable
                          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.pressed]}
                          onPress={() => void baixarExame(exame)}
                          accessibilityRole="button"
                          accessibilityLabel={`Baixar resultado de ${exame.nome}`}
                        >
                          <Feather name="download" size={16} color={colors.brandDeep} aria-hidden />
                          <Text style={styles.buttonText}>Baixar resultado</Text>
                        </Pressable>
                      )}
                      {enviado && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.button, styles.dangerButton, pressed && styles.pressed
                          ]}
                          onPress={() => setExameParaRemover(exame)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover envio de ${exame.nome}`}
                          testID={`exame-remove-button-${exame.id}`}
                        >
                          <Feather name="trash-2" size={16} color={colors.dangerText} aria-hidden />
                          <Text style={[styles.buttonText, styles.dangerText]}>Remover</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {(selectedExame || exameParaRemover) && (
        <DialogoConfirmacao
          titulo={exameParaRemover ? 'Remover resultado enviado?' : 'Enviar Resultado de Exame'}
          descricao={exameParaRemover
            ? `O arquivo de ${exameParaRemover.nome} será removido e o pedido voltará a ficar pendente.`
            : selectedExame?.nome}
          icone={exameParaRemover ? 'trash-2' : 'upload'}
          fechar={exameParaRemover ? fecharConfirmacaoRemocao : fecharModalEnvio}
          testID={exameParaRemover ? 'exame-confirmar-remocao' : 'exame-upload-modal'}
          acoes={exameParaRemover ? [
            { rotulo: 'Manter resultado', variante: 'secundaria', executar: fecharConfirmacaoRemocao },
            {
              rotulo: 'Remover resultado',
              variante: 'perigo',
              executar: () => handleRemoverExameEnviado(exameParaRemover),
              rotuloOcupado: 'Removendo…',
              testID: 'exame-confirmar-remocao-botao'
            }
          ] : [
            { rotulo: 'Cancelar', variante: 'secundaria', executar: fecharModalEnvio, testID: 'exame-upload-cancel-button' },
            {
              rotulo: selectedExame?.status === 'ENVIADO' ? 'Substituir resultado' : 'Enviar resultado',
              executar: confirmarEnvio,
              desabilitada: envioDesabilitado,
              rotuloOcupado: 'Enviando…',
              testID: 'exame-upload-confirm-button'
            }
          ]}
        >
          {selectedExame && !exameParaRemover && (
            <>
              {selectedExame.status === 'ENVIADO' && selectedExame.arquivoNome ? (
                <View style={styles.attachmentBox} testID="exame-current-sent-box">
                  <View style={styles.attachmentDetails}>
                    <Text style={styles.fieldLabel}>Arquivo enviado atualmente:</Text>
                    <Text style={styles.attachmentName}>{selectedExame.arquivoNome}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.button, styles.dangerButton, pressed && styles.pressed]}
                    onPress={() => setExameParaRemover(selectedExame)}
                    disabled={uploading}
                    accessibilityRole="button"
                    accessibilityLabel="Remover exame enviado"
                    testID="exame-modal-remove-sent-button"
                  >
                    <Feather name="trash-2" size={16} color={colors.dangerText} aria-hidden />
                    <Text style={[styles.buttonText, styles.dangerText]}>Remover</Text>
                  </Pressable>
                </View>
              ) : null}

              {Platform.OS === 'web' ? (
                <div
                  style={{ width: '100%' }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingOver(!uploading);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={soltarArquivo}
                >
                  {uploadArea}
                </div>
              ) : uploadArea}

              {selectedFile ? (
                <View style={[styles.attachmentBox, styles.selectedFileCard]} testID="exame-selected-file-pill">
                  <View style={styles.attachmentDetails}>
                    <Text style={styles.attachmentName} testID="exame-selected-file-name">
                      {selectedFile.nome}
                    </Text>
                    {selectedFile.tamanhoBytes ? <Text style={styles.uploadFormatHint}>{formatFileSize(selectedFile.tamanhoBytes)}</Text> : null}
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.button, styles.secondaryButton, uploading && styles.buttonDisabled, pressed && styles.pressed
                    ]}
                    onPress={limparArquivoSelecionado}
                    disabled={uploading}
                    accessibilityRole="button"
                    accessibilityLabel="Remover arquivo selecionado"
                    testID="exame-clear-selected-file-button"
                  >
                    <Feather name="x" size={16} color={colors.brandDeep} aria-hidden />
                    <Text style={styles.buttonText}>Remover</Text>
                  </Pressable>
                </View>
              ) : null}

              {uploadError ? (
                <View style={styles.errorBox} accessibilityRole="alert" testID="exame-upload-error">
                  <Text style={styles.errorText}>{uploadError}</Text>
                </View>
              ) : null}
            </>
          )}
          {exameParaRemover && erroRemocao ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{erroRemocao}</Text>
            </View>
          ) : null}
        </DialogoConfirmacao>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { flex: 1 },
  content: {
    width: '100%', alignSelf: 'center', padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md
  },
  contentCompact: { paddingHorizontal: spacing.sm },
  headerSection: { paddingTop: spacing.xs, gap: spacing.xxs },
  title: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 30, lineHeight: 38 },
  bodyText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 23 },
  centered: { textAlign: 'center' },
  surface: {
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.xl,
    padding: spacing.md, gap: spacing.sm, ...shadows.card
  },
  errorBox: {
    backgroundColor: colors.dangerButtonBackground, borderColor: colors.dangerBackground, borderWidth: 1,
    borderRadius: radius.md, padding: spacing.sm, gap: spacing.xs, alignItems: 'flex-start'
  },
  errorTitle: { color: colors.dangerText, fontFamily: fontFamily.extrabold, fontSize: 16, lineHeight: 23 },
  errorText: { color: colors.dangerText, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  stateCard: { alignItems: 'center', padding: spacing.xl, gap: spacing.xs },
  stateTitle: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 19, lineHeight: 26, textAlign: 'center' },
  cardsList: { gap: spacing.sm },
  examHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconBadge: {
    width: 40, height: 40, flexShrink: 0, borderRadius: radius.md,
    backgroundColor: colors.confirmedBackground, alignItems: 'center', justifyContent: 'center'
  },
  examIdentity: { flex: 1, minWidth: 0, gap: spacing.xxs },
  examName: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 18, lineHeight: 25 },
  statusLabel: {
    alignSelf: 'flex-start', color: colors.text, fontFamily: fontFamily.bold, fontSize: 12, lineHeight: 18,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs, borderRadius: radius.sm, backgroundColor: colors.subtle
  },
  statusPending: { color: colors.pending, backgroundColor: colors.pendingBackground },
  statusSent: { color: colors.brandDeep, backgroundColor: colors.confirmedBackground },
  fileRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    backgroundColor: colors.page, borderRadius: radius.md, padding: spacing.sm
  },
  fileCaption: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  report: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs },
  reportText: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 21 },
  fieldLabel: { color: colors.text, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 21 },
  cardActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  button: {
    minHeight: 48, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md
  },
  buttonText: { flexShrink: 1, color: colors.brandDeep, fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { backgroundColor: colors.brand },
  primaryText: { color: colors.white },
  secondaryButton: { backgroundColor: colors.confirmedBackground },
  dangerButton: { backgroundColor: colors.dangerButtonBackground },
  dangerText: { color: colors.dangerText },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  uploadDropArea: {
    width: '100%', minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.textSecondary, borderRadius: radius.md, backgroundColor: colors.page
  },
  uploadDropAreaDragging: { backgroundColor: colors.confirmedBackground, borderColor: colors.brand },
  uploadCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  uploadPromptText: { color: colors.brandDeep, fontFamily: fontFamily.extrabold, fontSize: 15, lineHeight: 22 },
  uploadFormatHint: { color: colors.textSecondary, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 19 },
  attachmentBox: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, padding: spacing.sm,
    backgroundColor: colors.page, borderRadius: radius.md, borderColor: colors.border, borderWidth: 1
  },
  selectedFileCard: { borderColor: colors.brand },
  attachmentDetails: { flexGrow: 1, flexShrink: 1, flexBasis: 140, minWidth: 0, gap: spacing.xxs },
  attachmentName: { color: colors.text, fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 21 }
});
