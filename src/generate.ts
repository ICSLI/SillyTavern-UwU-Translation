import { ExtractedData } from 'sillytavern-utils-lib/types';
import { context } from './config.js';
import { st_echo } from 'sillytavern-utils-lib/config';

const MAX_TOKENS = 4096;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Parses ChatML format tags from prompt and converts to messages array.
 * Format: <|im_start|>role\ncontent<|im_end|>
 * The closing <|im_end|> tag is optional - content extends to next <|im_start|> or end of string.
 * Fallback: Returns single user message if no tags found.
 */
export function parseChatML(prompt: string): ChatMessage[] {
  // Find all <|im_start|> tags and their positions
  const startPattern = /<\|im_start\|>(\w+)\s*\n/g;
  const starts: Array<{ role: string; index: number; contentStart: number }> = [];
  let match;

  while ((match = startPattern.exec(prompt)) !== null) {
    starts.push({
      role: match[1].toLowerCase(),
      index: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  // Fallback: if no ChatML tags found, treat entire prompt as user message
  if (starts.length === 0) {
    return [{ role: 'user', content: prompt.trim() }];
  }

  const messages: ChatMessage[] = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    // Content extends to next <|im_start|> or end of string
    const nextStart = i + 1 < starts.length ? starts[i + 1].index : prompt.length;

    // Extract content
    let content = prompt.substring(start.contentStart, nextStart);

    // Remove <|im_end|> tag if present (optional)
    content = content.replace(/<\|im_end\|>\s*$/, '').trim();

    // Validate role
    if (start.role === 'system' || start.role === 'user' || start.role === 'assistant') {
      messages.push({
        role: start.role as 'system' | 'user' | 'assistant',
        content: content,
      });
    } else {
      st_echo('warning', `Invalid ChatML role "${start.role}" - skipping message`);
    }
  }

  return messages;
}

export async function sendGenerateRequest(profileId: string, prompt: string): Promise<string | null> {
  const profile = context.extensionSettings.connectionManager!.profiles.find((p) => p.id === profileId);
  if (!profile) {
    st_echo('error', `Could not find profile with id ${profileId}`);
    return null;
  }
  if (!profile.api) {
    st_echo('error', 'Select a connection profile that has an API');
    return null;
  }
  if (!profile.preset) {
    st_echo('error', 'Select a connection profile that has a preset');
    return null;
  }

  // Parse prompt for ChatML format (fallback to single user message if no tags)
  const messages = parseChatML(prompt);

  const response = (await context.ConnectionManagerRequestService.sendRequest(
    profile.id,
    messages,
    MAX_TOKENS,
  )) as ExtractedData;
  return response.content;
}
