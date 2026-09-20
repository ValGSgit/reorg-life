import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Native side of getting a backup on and off the device. The file is written
 * to the app's own cache and handed straight to the share sheet, so you choose
 * where it lands; nothing is uploaded anywhere.
 */
export async function saveBackup(filename: string, payload: string): Promise<'shared' | 'saved'> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(payload);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save your ReorgLife backup',
    });
    return 'shared';
  }
  return 'saved';
}

/** Returns the file's text, or null if the picker was dismissed. */
export async function loadBackup(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  return new File(res.assets[0].uri).text();
}
