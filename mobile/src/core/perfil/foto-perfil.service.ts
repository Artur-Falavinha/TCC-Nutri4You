import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { launchImageLibraryAsync, UIImagePickerPreferredAssetRepresentationMode } from 'expo-image-picker';
import { Platform } from 'react-native';
import { apiClient } from '../api/api-client';

const ROTA = '/usuarios/me/foto';
const LIMITE_BYTES = 5 * 1024 * 1024;

export function carregarFotoPerfil(): Promise<string | null> {
  return carregarFoto(ROTA);
}

export function carregarFotoNutricionista(id: number): Promise<string | null> {
  return carregarFoto(`/usuarios/me/nutricionistas/${id}/foto`);
}

async function carregarFoto(rota: string): Promise<string | null> {
  const foto = await apiClient.getBlob(rota);
  return foto?.size ? lerFoto(foto) : null;
}

export async function selecionarEEnviarFotoPerfil(): Promise<string | null> {
  const formulario = new FormData();
  if (Platform.OS === 'web') {
    const arquivo = await selecionarNoNavegador();
    if (!arquivo) return null;
    if (!arquivo.size || arquivo.size > LIMITE_BYTES
      || (arquivo.type && !['image/jpeg', 'image/png'].includes(arquivo.type))) {
      throw new Error('Selecione uma imagem JPEG ou PNG de até 5 MB.');
    }
    formulario.append('arquivo', arquivo);
  } else {
    const escolha = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible
    });
    if (escolha.canceled) return null;
    const foto = escolha.assets[0];
    const contexto = ImageManipulator.manipulate(foto.uri);
    const maiorLado = Math.max(foto.width, foto.height);
    if (maiorLado > 768) {
      contexto.resize(foto.width >= foto.height ? { width: 768 } : { height: 768 });
    }
    const imagem = await contexto.renderAsync();
    const arquivo = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
    formulario.append('arquivo', {
      uri: arquivo.uri,
      name: 'perfil.jpg',
      type: 'image/jpeg'
    } as unknown as Blob);
  }
  return lerFoto(await apiClient.postFormBlob(ROTA, formulario));
}

export function removerFotoPerfil(): Promise<void> {
  return apiClient.delete<void>(ROTA);
}

function lerFoto(foto: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => typeof leitor.result === 'string'
      ? resolve(leitor.result)
      : reject(new Error('Não foi possível exibir a foto.'));
    leitor.onerror = () => reject(new Error('Não foi possível exibir a foto.'));
    leitor.readAsDataURL(foto);
  });
}

function selecionarNoNavegador(): Promise<File | null> {
  return new Promise(resolve => {
    const seletor = document.createElement('input');
    seletor.type = 'file';
    seletor.accept = 'image/jpeg,image/png';
    seletor.hidden = true;
    const concluir = () => {
      const arquivo = seletor.files?.item(0) ?? null;
      seletor.remove();
      resolve(arquivo);
    };
    seletor.addEventListener('change', concluir, { once: true });
    seletor.addEventListener('cancel', concluir, { once: true });
    document.body.appendChild(seletor);
    seletor.click();
  });
}
