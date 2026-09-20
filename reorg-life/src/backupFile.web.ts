import * as DocumentPicker from 'expo-document-picker';

/**
 * Web preview equivalent of backupFile.ts. expo-file-system has no browser
 * backend, so the download goes through an object URL instead.
 */
export async function saveBackup(filename: string, payload: string): Promise<'shared' | 'saved'> {
  const blob = new Blob([payload], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}

export async function loadBackup(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
  if (res.canceled || !res.assets?.length) return null;
  // On web the asset uri is a data: or blob: URL, both readable by fetch.
  const r = await fetch(res.assets[0].uri);
  return r.text();
}
