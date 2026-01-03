import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface TranscriptResult {
  text: string;
  title: string;
  duration: number;
  timestamp: string;
}

interface JSON3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
}

interface JSON3Transcript {
  events?: JSON3Event[];
}

export class TranscriptService {
  /**
   * Fetches the transcript for a given YouTube video ID using yt-dlp
   * @param videoId - YouTube video ID
   * @returns Promise containing the transcript text and metadata
   * @throws Error if transcript is not available
   */
  async getTranscript(videoId: string): Promise<TranscriptResult> {
    const tempId = randomBytes(8).toString('hex');
    const tempDir = os.tmpdir();
    const outputTemplate = path.join(tempDir, `transcript-${tempId}`);
    const subtitleFile = `${outputTemplate}.en.json3`;

    try {
      // Validate video ID format
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        throw new Error('Invalid video ID format');
      }

      // Use yt-dlp to download subtitles and get video info
      const command = `yt-dlp --write-auto-sub --write-sub --sub-lang en --skip-download --sub-format json3 --output "${outputTemplate}.%(ext)s" --print-json "https://www.youtube.com/watch?v=${videoId}" 2>&1`;

      const { stdout } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
      });

      // Parse video info from JSON output
      let title = `YouTube Video ${videoId}`;
      let duration = 0;

      // yt-dlp outputs JSON with --print-json
      const jsonMatch = stdout.match(/\{[\s\S]*"id":\s*"[^"]*"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const videoInfo = JSON.parse(jsonMatch[0]);
          title = videoInfo.title || title;
          duration = Math.round(videoInfo.duration || 0);
        } catch (e) {
          // If JSON parsing fails, use defaults
          console.warn('Could not parse video info JSON');
        }
      }

      // Read and parse the subtitle file
      const subtitleContent = await readFile(subtitleFile, 'utf-8');
      const subtitleData: JSON3Transcript = JSON.parse(subtitleContent);

      // Extract text from JSON3 format
      const textParts: string[] = [];
      const events = subtitleData.events || [];

      for (const event of events) {
        if (event.segs) {
          for (const seg of event.segs) {
            if (seg.utf8) {
              textParts.push(seg.utf8);
            }
          }
        }
      }

      const text = textParts.join(' ').replace(/\s+/g, ' ').trim();

      // Clean up temporary file
      await unlink(subtitleFile).catch(() => {
        /* ignore cleanup errors */
      });

      if (!text) {
        throw new Error('No transcript available');
      }

      return {
        text,
        title,
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Clean up temporary file if it exists
      await unlink(subtitleFile).catch(() => {
        /* ignore cleanup errors */
      });

      console.error('Transcript fetch error:', error.message);

      // Check for specific error messages from yt-dlp
      if (
        error.message?.includes('Subtitles are disabled') ||
        error.message?.includes('No subtitles') ||
        error.message?.includes('ENOENT')
      ) {
        throw new Error('No transcript available');
      }

      // All other errors are treated as "No transcript available"
      throw new Error('No transcript available');
    }
  }
}
