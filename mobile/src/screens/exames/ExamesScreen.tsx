import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import Svg, { Circle, Path } from 'react-native-svg';

import { AppHeader } from '../../components/layout/AppHeader';
import { MenuDestination, SideMenu } from '../../components/navigation/SideMenu';
import { ApiError } from '../../core/api/api-response.types';
import { logout } from '../../core/auth/auth.service';
import {
  ArquivoExameSelecionado,
  ExamePedido
} from '../../features/exames/exames.models';
import {
  enviarResultadoExame,
  inferMimeTypeFromFileName,
  listarMeusExames,
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

function UploadTrayIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 10.5V12.5C2 13.3284 2.67157 14 3.5 14H12.5C13.3284 14 14 13.3284 14 12.5V10.5M8 10V2M8 2L4.5 5.5M8 2L11.5 5.5"
        stroke={colors.white}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SentExamIcon({ index }: { index: number }) {
  if (index % 2 === 1) {
    return (
      <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
        <Path
          d="M10 1H3C1.89543 1 1 1.89543 1 3V17C1 18.1046 1.89543 19 3 19H13C14.1046 19 15 18.1046 15 17V6L10 1Z"
          stroke="#2d3335"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10 1V6H15M5 10H11M5 14H11"
          stroke="#2d3335"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={8} stroke="#2d3335" strokeWidth={1.8} />
      <Path
        d="M6.8 10.2L9 12.4L13.4 7.8"
        stroke="#2d3335"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon({ color = '#ba1a1a' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 4H14M5.5 4V2.5C5.5 1.94772 5.94772 1.5 6.5 1.5H9.5C10.0523 1.5 10.5 1.94772 10.5 2.5V4M12.5 4V13C12.5 13.8284 11.8284 14.5 11 14.5H5C4.17157 14.5 3.5 13.8284 3.5 13V4H12.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloudUploadIcon() {
  return (
    <Svg width={24} height={20} viewBox="0 0 24 20" fill="none">
      <Path
        d="M19.35 8.04C18.67 4.59 15.64 2 12 2C9.11 2 6.6 3.64 5.35 6.04C2.34 6.36 0 8.91 0 12C0 15.31 2.69 18 6 18H19C21.76 18 24 15.76 24 13C24 10.36 21.95 8.22 19.35 8.04ZM14 11V15H10V11H7L12 6L17 11H14Z"
        fill="#005414"
      />
    </Svg>
  );
}

export function ExamesScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 640;

  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exames, setExames] = useState<ExamePedido[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const [selectedExame, setSelectedExame] = useState<ExamePedido | null>(null);
  const [selectedFile, setSelectedFile] = useState<ArquivoExameSelecionado | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
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

  const handleRemoverExameEnviado = async (exame: ExamePedido) => {
    if (removingId !== null || uploading) {
      return;
    }
    setRemovingId(exame.id);
    setUploadError('');
    try {
      const atualizado = await removerResultadoExame(exame.id);
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
      setFeedbackMessage(
        `Envio de "${exame.nome}" removido. O exame voltou para PENDENTE.`
      );
      if (selectedExame?.id === exame.id) {
        setSelectedExame(null);
        setSelectedFile(null);
      }
    } catch (failure) {
      const msg = extractErrorMessage(
        failure,
        'Não foi possível remover o arquivo do exame.'
      );
      if (selectedExame?.id === exame.id) {
        setUploadError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setRemovingId(null);
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
        arquivoNome: selectedFile.nome.trim(),
        arquivoTipo:
          selectedFile.tipo || inferMimeTypeFromFileName(selectedFile.nome),
        arquivoConteudoBase64: selectedFile.conteudoBase64
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
      setFeedbackMessage(`Resultado de "${selectedExame.nome}" enviado com sucesso.`);
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

  const webDropProps =
    Platform.OS === 'web'
      ? ({
          onDragOver: (event: { preventDefault?: () => void }) => {
            event.preventDefault?.();
            setIsDraggingOver(true);
          },
          onDragLeave: (event: { preventDefault?: () => void }) => {
            event.preventDefault?.();
            setIsDraggingOver(false);
          },
          onDrop: (event: {
            preventDefault?: () => void;
            dataTransfer?: { files?: FileList };
          }) => {
            event.preventDefault?.();
            setIsDraggingOver(false);
            const droppedFile = event.dataTransfer?.files?.[0];
            if (!droppedFile) {
              return;
            }
            aplicarArquivoEscolhido({
              nome: droppedFile.name,
              tipo:
                droppedFile.type || inferMimeTypeFromFileName(droppedFile.name),
              tamanhoBytes: droppedFile.size
            });
          }
        } as Record<string, unknown>)
      : {};

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
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
        contentContainerStyle={[styles.content, { maxWidth: wide ? 680 : 448 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void carregarExames(true)}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.title} accessibilityRole="header">
            Pedidos de Exames
          </Text>
          <Text style={styles.subtitle}>
            Envie seus resultados para análise nutricional personalizada.
          </Text>
        </View>

        {feedbackMessage ? (
          <View
            style={styles.feedbackBox}
            accessibilityRole="alert"
            testID="exames-feedback-banner"
          >
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert" testID="exames-error-box">
            <Text style={styles.errorTitle}>Não foi possível carregar os exames</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => void carregarExames()}
              accessibilityRole="button"
              accessibilityLabel="Tentar novamente"
              testID="exames-retry-button"
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && exames.length === 0 ? (
          <View style={styles.stateCard} testID="exames-loading">
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.stateBodyText}>Carregando pedidos de exames...</Text>
          </View>
        ) : !error && exames.length === 0 ? (
          <View style={styles.stateCard} testID="exames-empty">
            <Text style={styles.stateTitle}>Nenhum pedido de exame</Text>
            <Text style={styles.stateBodyText}>
              Quando sua nutricionista solicitar exames laboratoriais, eles aparecerão aqui para envio.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsList} testID="exames-cards-list">
            {exames.map((exame, index) => {
              const isPending = exame.status === 'PENDENTE';
              const statusLabel = isPending ? 'PENDENTE' : 'ENVIADO';
              const isRemovingThis = removingId === exame.id;

              return (
                <View
                  key={exame.id}
                  style={styles.examCard}
                  testID={`exame-card-${exame.id}`}
                >
                  <View style={styles.examCardInfo}>
                    <Text style={styles.examName} accessibilityRole="header">
                      {exame.nome}
                    </Text>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          isPending ? styles.statusDotPending : styles.statusDotSent
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusLabel,
                          isPending ? styles.statusLabelPending : styles.statusLabelSent
                        ]}
                        testID={`exame-status-${exame.id}`}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                    {exame.arquivoNome ? (
                      <Text style={styles.fileCaption} numberOfLines={1}>
                        Arquivo: {exame.arquivoNome}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.cardActionsRow}>
                    {!isPending ? (
                      <Pressable
                        style={styles.cardRemoveButton}
                        onPress={() => void handleRemoverExameEnviado(exame)}
                        disabled={isRemovingThis}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover envio de ${exame.nome}`}
                        testID={`exame-remove-button-${exame.id}`}
                      >
                        {isRemovingThis ? (
                          <ActivityIndicator size="small" color="#ba1a1a" />
                        ) : (
                          <TrashIcon color="#ba1a1a" />
                        )}
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={[
                        styles.cardActionButton,
                        isPending ? styles.cardActionButtonPending : styles.cardActionButtonSent
                      ]}
                      onPress={() => abrirModalEnvio(exame)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isPending
                          ? `Enviar resultado de ${exame.nome}`
                          : `Substituir ou gerenciar resultado de ${exame.nome}`
                      }
                      testID={`exame-action-button-${exame.id}`}
                    >
                      {isPending ? <UploadTrayIcon /> : <SentExamIcon index={index} />}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedExame !== null}
        transparent
        animationType="fade"
        onRequestClose={fecharModalEnvio}
      >
        <View style={styles.modalBackdrop} testID="exame-upload-modal">
          <View style={styles.modalCard}>
            <View style={styles.modalHeadingBlock}>
              <Text style={styles.modalTitle} accessibilityRole="header">
                Enviar Resultado de Exame
              </Text>
              {selectedExame ? (
                <Text style={styles.modalExamSubtitle}>{selectedExame.nome}</Text>
              ) : null}
            </View>

            {selectedExame?.status === 'ENVIADO' && selectedExame.arquivoNome ? (
              <View style={styles.currentSentBox} testID="exame-current-sent-box">
                <View style={styles.currentSentInfo}>
                  <Text style={styles.currentSentLabel}>Arquivo enviado atualmente:</Text>
                  <Text style={styles.currentSentFileName} numberOfLines={1}>
                    {selectedExame.arquivoNome}
                  </Text>
                </View>
                <Pressable
                  style={styles.removeSentInlineBtn}
                  onPress={() => void handleRemoverExameEnviado(selectedExame)}
                  disabled={removingId === selectedExame.id || uploading}
                  accessibilityRole="button"
                  accessibilityLabel="Remover exame enviado"
                  testID="exame-modal-remove-sent-button"
                >
                  <TrashIcon color="#ba1a1a" />
                  <Text style={styles.removeSentInlineText}>Remover</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.uploadDropArea,
                isDraggingOver && styles.uploadDropAreaDragging
              ]}
              onPress={() => void selecionarArquivo()}
              accessibilityRole="button"
              accessibilityLabel="Clique para selecionar arquivo PDF ou imagem do exame"
              testID="exame-upload-select-area"
              {...webDropProps}
            >
              <View style={styles.uploadIconCircle}>
                <CloudUploadIcon />
              </View>
              <Text style={styles.uploadPromptText}>Clique para selecionar</Text>
              <Text style={styles.uploadFormatHint}>
                Formatos aceitos: PDF, PNG, JPG ou WEBP (máx. 10 MB)
              </Text>
            </Pressable>

            {selectedFile ? (
              <View style={styles.selectedFileCard} testID="exame-selected-file-pill">
                <View style={styles.selectedFileDetails}>
                  <Text
                    style={styles.selectedFileText}
                    numberOfLines={1}
                    testID="exame-selected-file-name"
                  >
                    {selectedFile.nome}
                  </Text>
                  {selectedFile.tamanhoBytes ? (
                    <Text style={styles.selectedFileMeta}>
                      {formatFileSize(selectedFile.tamanhoBytes)}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  style={styles.clearSelectedFileBtn}
                  onPress={limparArquivoSelecionado}
                  accessibilityRole="button"
                  accessibilityLabel="Remover arquivo selecionado"
                  testID="exame-clear-selected-file-button"
                >
                  <Text style={styles.clearSelectedFileText}>✕ Remover</Text>
                </Pressable>
              </View>
            ) : null}

            {uploadError ? (
              <View
                style={styles.modalErrorBox}
                accessibilityRole="alert"
                testID="exame-upload-error"
              >
                <Text style={styles.modalErrorText}>{uploadError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.confirmButton,
                  (!selectedFile || uploading) && styles.buttonDisabled
                ]}
                onPress={() => void confirmarEnvio()}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel="Confirmar Envio"
                testID="exame-upload-confirm-button"
              >
                {uploading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar Envio</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={fecharModalEnvio}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                testID="exame-upload-cancel-button"
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  scroll: {
    flex: 1
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: 32
  },
  headerSection: {
    gap: 8
  },
  title: {
    color: '#2d3335',
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.75
  },
  subtitle: {
    color: '#2d3335',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20
  },
  feedbackBox: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  feedbackText: {
    color: colors.brandDeep,
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 19
  },
  cardsList: {
    gap: 20
  },
  examCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(191, 202, 185, 0.15)',
    borderRadius: 12,
    padding: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    ...shadows.card
  },
  examCardInfo: {
    flex: 1,
    gap: 4
  },
  examName: {
    color: '#2d3335',
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22.5
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 9999
  },
  statusDotPending: {
    backgroundColor: '#ba1a1a'
  },
  statusDotSent: {
    backgroundColor: '#005414'
  },
  statusLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  statusLabelPending: {
    color: '#2d3335'
  },
  statusLabelSent: {
    color: '#005414'
  },
  fileCaption: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardRemoveButton: {
    width: 40,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff4f2',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardActionButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardActionButtonPending: {
    backgroundColor: '#006f1e'
  },
  cardActionButtonSent: {
    backgroundColor: '#e8e8e8'
  },
  stateCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card
  },
  stateTitle: {
    color: '#2d3335',
    fontFamily: fontFamily.bold,
    fontSize: 17,
    textAlign: 'center'
  },
  stateBodyText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  errorBox: {
    backgroundColor: '#fff4f2',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs
  },
  errorTitle: {
    color: colors.dangerText,
    fontFamily: fontFamily.bold,
    fontSize: 15
  },
  errorText: {
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19
  },
  retryButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: 4
  },
  retryButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 14
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  },
  modalCard: {
    width: '100%',
    maxWidth: 342,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    gap: 18,
    ...shadows.card
  },
  modalHeadingBlock: {
    gap: 4
  },
  modalTitle: {
    color: '#2d3335',
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5
  },
  modalExamSubtitle: {
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18
  },
  currentSentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12
  },
  currentSentInfo: {
    flex: 1,
    gap: 2
  },
  currentSentLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 11
  },
  currentSentFileName: {
    color: '#2d3335',
    fontFamily: fontFamily.bold,
    fontSize: 12
  },
  removeSentInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff4f2',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  removeSentInlineText: {
    color: '#ba1a1a',
    fontFamily: fontFamily.bold,
    fontSize: 12
  },
  uploadDropArea: {
    backgroundColor: '#f3f3f3',
    borderWidth: 2,
    borderColor: '#6f7a6c',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  uploadDropAreaDragging: {
    backgroundColor: '#ecfdf5',
    borderColor: '#005414'
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 84, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadPromptText: {
    color: '#2d3335',
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  uploadFormatHint: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center'
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  selectedFileDetails: {
    flex: 1,
    gap: 2
  },
  selectedFileText: {
    color: '#005414',
    fontFamily: fontFamily.bold,
    fontSize: 13
  },
  selectedFileMeta: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 11
  },
  clearSelectedFileBtn: {
    backgroundColor: '#fff4f2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearSelectedFileText: {
    color: '#ba1a1a',
    fontFamily: fontFamily.bold,
    fontSize: 11
  },
  modalErrorBox: {
    backgroundColor: '#fff4f2',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm
  },
  modalErrorText: {
    color: colors.dangerText,
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    textAlign: 'center'
  },
  modalActions: {
    gap: 12
  },
  confirmButton: {
    backgroundColor: '#005414',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card
  },
  buttonDisabled: {
    opacity: 0.55
  },
  confirmButtonText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  },
  cancelButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    color: '#005414',
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 24
  }
});
