import { Share } from '@capacitor/share';

export async function shareText(title: string, text: string) {
  await Share.share({ title, text });
}
