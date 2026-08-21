/**
 * TTS via Supabase Edge Function proxy
 * Calls our edge function which fetches from Google Translate TTS server-side
 * Avoids CORS issues, works in both browser and Tauri
 *
 * @module lib/tts
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TTS_ENDPOINT = `${SUPABASE_URL}/functions/v1/tts`;
const MAX_CHUNK_LENGTH = 180;

export class GoogleTTS {
  private currentAudio: HTMLAudioElement | null = null;
  private stopped = false;

  private splitText(text: string): string[] {
    if (text.length <= MAX_CHUNK_LENGTH) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length > MAX_CHUNK_LENGTH) {
        if (current) chunks.push(current.trim());
        if (sentence.length > MAX_CHUNK_LENGTH) {
          const words = sentence.split(' ');
          for (const word of words) {
            if ((current + ' ' + word).trim().length > MAX_CHUNK_LENGTH) {
              if (current) chunks.push(current.trim());
              current = word;
            } else {
              current = (current + ' ' + word).trim();
            }
          }
        } else {
          current = sentence;
        }
      } else {
        current = (current + ' ' + sentence).trim();
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }

  async speak(text: string): Promise<void> {
    this.stop();
    this.stopped = false;

    const chunks = this.splitText(text);
    console.log(`🔊 TTS: ${chunks.length} chunk(s) for "${text}"`);

    for (let i = 0; i < chunks.length; i++) {
      if (this.stopped) break;
      await this.playChunk(chunks[i], i + 1, chunks.length);
    }
  }

  private playChunk(text: string, index: number, total: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${TTS_ENDPOINT}?text=${encodeURIComponent(text)}`;
      console.log(`🔊 Playing chunk ${index}/${total}: "${text}"`);

      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        console.log(`✅ Chunk ${index}/${total} done`);
        resolve();
      };

      audio.onerror = () => {
        console.error(`❌ TTS error on chunk ${index}`);
        reject(new Error('TTS playback failed'));
      };

      audio.play().catch(err => {
        console.error(`❌ Play failed:`, err);
        reject(err);
      });
    });
  }

  stop() {
    this.stopped = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  get isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}

export const tts = new GoogleTTS();
