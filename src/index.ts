import { ExtensionSettingsManager } from 'sillytavern-utils-lib';
import { context, extensionName, st_updateMessageBlock } from './config.js';
import { sendGenerateRequest } from './generate.js';
import { EventNames } from 'sillytavern-utils-lib/types';
import { AutoModeOptions } from 'sillytavern-utils-lib/types/translate';
import { st_echo } from 'sillytavern-utils-lib/config';

interface ExtensionSettings {
  version: string;
  formatVersion: string;
  profile: string;
  inputTargetLanguage: string;
  outputTargetLanguage: string;
  autoMode: AutoModeOptions;
  prompt: string;
}

const VERSION = '1.0.0';
const FORMAT_VERSION = 'F_1.0';

const DEFAULT_PROMPT = `<|im_start|>user
You are a professional translator.

Translate the text within <text> tags into {{lang}}.

Rules:
- Preserve the original meaning, tone, and structure
- Keep proper nouns unchanged unless they have standard translations
- Adapt idioms naturally for the target language
- Return ONLY the translation, without any prefixes or meta-commentary

<text>
{{text}}
</text>
<|im_end|>`;

const defaultSettings: ExtensionSettings = {
  version: VERSION,
  formatVersion: FORMAT_VERSION,
  profile: '',
  inputTargetLanguage: 'English',
  outputTargetLanguage: 'English',
  autoMode: AutoModeOptions.NONE,
  prompt: DEFAULT_PROMPT,
};

const EXTENSION_KEY = 'uwuTranslationSimple';

let generating: number[] = [];

const settingsManager = new ExtensionSettingsManager<ExtensionSettings>(EXTENSION_KEY, defaultSettings);

const incomingTypes = [AutoModeOptions.RESPONSES, AutoModeOptions.BOTH];
const outgoingTypes = [AutoModeOptions.INPUT, AutoModeOptions.BOTH];

interface ConnectionProfile {
  id: string;
  name?: string;
  api?: string;
}

/**
 * Get connection profile for translation
 * If a specific profile is selected, use it. Otherwise, find the first valid profile with API.
 */
function getConnectionProfile(): ConnectionProfile | null {
  if (!context.extensionSettings?.connectionManager?.profiles) {
    return null;
  }

  const profiles = context.extensionSettings.connectionManager.profiles as ConnectionProfile[];
  const settings = settingsManager.getSettings();

  // Use specified profile if set
  if (settings.profile) {
    const profile = profiles.find((p) => p.id === settings.profile);
    if (profile && profile.api) {
      return profile;
    }
  }

  // Auto mode: find first valid profile with API
  const validProfile = profiles.find((p) => p.api);
  return validProfile || null;
}

/**
 * Populate the connection profiles dropdown with available profiles
 */
function populateConnectionProfiles() {
  const $select = $('#uwu_translation_profile');

  // Keep the "Auto" option, remove others
  $select.find('option:not(:first)').remove();

  if (!context.extensionSettings?.connectionManager?.profiles) {
    return;
  }

  const profiles = context.extensionSettings.connectionManager.profiles as ConnectionProfile[];
  const settings = settingsManager.getSettings();

  // Add available profiles (only those with API configured)
  for (const profile of profiles) {
    if (profile.api) {
      const $option = $('<option></option>')
        .val(profile.id)
        .text(profile.name || profile.id);

      if (settings.profile === profile.id) {
        $option.prop('selected', true);
      }

      $select.append($option);
    }
  }
}

async function initUI() {
  if (!context.extensionSettings.connectionManager) {
    st_echo('error', 'Connection Manager is required to use UwU Translation');
    return;
  }

  await initSettings();

  // Add translation buttons to message template
  const showTranslateButton = $(
    `<div title="UwU Translate" class="mes_button mes_uwu_translation_button fa-solid fa-globe interactable" tabindex="0"></div>`,
  );
  const reTranslateButton = $(
    `<div title="Re-translate" class="mes_button mes_uwu_retranslate_button fa-solid fa-rotate interactable" tabindex="0" style="display: none;"></div>`,
  );
  $('#message_template .mes_buttons .extraMesButtons').prepend(reTranslateButton);
  $('#message_template .mes_buttons .extraMesButtons').prepend(showTranslateButton);

  // Translate button click handler (toggle translation)
  $(document).on('click', '.mes_uwu_translation_button', async function () {
    const messageBlock = $(this).closest('.mes');
    const messageId = Number(messageBlock.attr('mesid'));
    const message = context.chat[messageId];
    if (!message) {
      st_echo('error', `Could not find message with id ${messageId}`);
      return;
    }

    // State 1: Translation is showing → Hide (keep cache)
    if (message?.extra?.display_text) {
      delete message.extra.display_text;
      st_updateMessageBlock(messageId, message);
      await context.saveChat();
      messageBlock.find('.mes_uwu_retranslate_button').hide();
      return;
    }

    // State 2: Cache exists but hidden → Show cached
    if (message?.extra?.uwu_cached_translation) {
      message.extra.display_text = message.extra.uwu_cached_translation;
      st_updateMessageBlock(messageId, message);
      await context.saveChat();
      messageBlock.find('.mes_uwu_retranslate_button').show();
      return;
    }

    // State 3: No cache → Translate
    await generateMessage(messageId, 'incomingMessage');
    context.eventSource.emit('uwu_translation_done', { messageId, type: 'incomingMessage', auto: false });
  });

  // Re-translate button click handler
  $(document).on('click', '.mes_uwu_retranslate_button', async function () {
    const messageBlock = $(this).closest('.mes');
    const messageId = Number(messageBlock.attr('mesid'));
    const message = context.chat[messageId];
    if (!message) {
      st_echo('error', `Could not find message with id ${messageId}`);
      return;
    }
    if (message?.extra) {
      delete message.extra.display_text;
      delete message.extra.uwu_cached_translation;
    }
    await generateMessage(messageId, 'incomingMessage');
    context.eventSource.emit('uwu_translation_done', { messageId, type: 'incomingMessage', auto: false });
  });

  // Auto mode event handlers - get fresh settings each time to reflect user changes
  context.eventSource.on(EventNames.MESSAGE_UPDATED, async (messageId: number) => {
    const currentSettings = settingsManager.getSettings();
    if (incomingTypes.includes(currentSettings.autoMode)) {
      await generateMessage(messageId, 'incomingMessage');
    }
  });

  // @ts-ignore
  context.eventSource.makeFirst(EventNames.CHARACTER_MESSAGE_RENDERED, async (messageId: number) => {
    const currentSettings = settingsManager.getSettings();
    if (incomingTypes.includes(currentSettings.autoMode)) {
      await generateMessage(messageId, 'incomingMessage');
    }
  });

  // @ts-ignore
  context.eventSource.makeFirst(EventNames.USER_MESSAGE_RENDERED, async (messageId: number) => {
    const currentSettings = settingsManager.getSettings();
    if (outgoingTypes.includes(currentSettings.autoMode)) {
      await generateMessage(messageId, 'userInput');
    }
  });

  // Sync re-translate button visibility when chat changes
  context.eventSource.on(EventNames.CHAT_CHANGED, () => {
    setTimeout(() => {
      context.chat.forEach((message: any, idx: number) => {
        const hasDisplayText = message?.extra?.display_text;
        const messageBlock = $(`.mes[mesid="${idx}"]`);
        messageBlock.find('.mes_uwu_retranslate_button').toggle(!!hasDisplayText);
      });
    }, 100);
  });

  // Extension menu button
  const extensionsMenu = document.querySelector('#extensionsMenu');
  const uwuTranslateWandContainer = document.createElement('div');
  uwuTranslateWandContainer.id = 'uwu_translate_wand_container';
  uwuTranslateWandContainer.className = 'extension_container';
  extensionsMenu?.appendChild(uwuTranslateWandContainer);
  const buttonHtml = await context.renderExtensionTemplateAsync(`third-party/${extensionName}`, 'templates/buttons');
  uwuTranslateWandContainer.insertAdjacentHTML('beforeend', buttonHtml);
  extensionsMenu?.querySelector('#uwu_translate_input')?.addEventListener('click', async () => {
    const sendTextarea = document.querySelector('#send_textarea') as HTMLTextAreaElement;
    if (sendTextarea) {
      const selectionStart = sendTextarea.selectionStart;
      const selectionEnd = sendTextarea.selectionEnd;
      const selectedText = sendTextarea.value.substring(selectionStart, selectionEnd);

      let textToTranslate = sendTextarea.value;
      let isSelection = false;

      if (selectedText) {
        textToTranslate = selectedText;
        isSelection = true;
      }

      const settings = settingsManager.getSettings();
      const translatedText = await translateText(textToTranslate, settings.inputTargetLanguage);

      if (translatedText) {
        if (isSelection) {
          const fullText = sendTextarea.value;
          sendTextarea.value =
            fullText.substring(0, selectionStart) + translatedText + fullText.substring(selectionEnd);
        } else {
          sendTextarea.value = translatedText;
        }
      }
    }
  });
}

async function initSettings() {
  const settings = settingsManager.getSettings();

  const settingsHtml = await context.renderExtensionTemplateAsync(
    `third-party/${extensionName}`,
    'templates/settings',
  );
  $('#extensions_settings').append(settingsHtml);

  // Profile selection
  populateConnectionProfiles();
  $('#uwu_translation_profile').val(settings.profile);
  $('#uwu_translation_profile').on('change', function () {
    settings.profile = $(this).val() as string;
    settingsManager.saveSettings();
  });

  // Auto mode selection
  const autoModeElement = $('#uwu_translation_auto_mode');
  autoModeElement.val(settings.autoMode);
  autoModeElement.on('change', function () {
    settings.autoMode = autoModeElement.val() as AutoModeOptions;
    settingsManager.saveSettings();
  });

  // Input target language
  const inputTargetLanguageElement = $('#uwu_translation_input_language');
  inputTargetLanguageElement.val(settings.inputTargetLanguage);
  inputTargetLanguageElement.on('change', function () {
    settings.inputTargetLanguage = inputTargetLanguageElement.val() as string;
    settingsManager.saveSettings();
  });

  // Output target language
  const outputTargetLanguageElement = $('#uwu_translation_output_language');
  outputTargetLanguageElement.val(settings.outputTargetLanguage);
  outputTargetLanguageElement.on('change', function () {
    settings.outputTargetLanguage = outputTargetLanguageElement.val() as string;
    settingsManager.saveSettings();
  });

  // Prompt textarea
  const promptElement = $('#uwu_translation_prompt');
  promptElement.val(settings.prompt);
  promptElement.on('change', function () {
    settings.prompt = promptElement.val() as string;
    settingsManager.saveSettings();
  });
}

async function translateText(
  text: string,
  targetLanguage: string,
  profileId?: string,
): Promise<string | null> {
  const settings = settingsManager.getSettings();

  // Determine profile ID: use provided, or get from settings/auto
  let selectedProfileId = profileId;
  if (!selectedProfileId) {
    const profile = getConnectionProfile();
    if (!profile) {
      st_echo('warning', 'No valid connection profile available');
      return null;
    }
    selectedProfileId = profile.id;
  }

  if (!targetLanguage) {
    st_echo('error', 'Please specify a target language');
    return null;
  }

  // Simple variable substitution for {{lang}} and {{text}}
  let renderedPrompt = settings.prompt
    .replace(/\{\{lang\}\}/g, targetLanguage)
    .replace(/\{\{text\}\}/g, text);

  try {
    const response = await sendGenerateRequest(selectedProfileId, renderedPrompt);
    return response;
  } catch (error) {
    console.error(error);
    st_echo('error', `Translation failed: ${error}`);
    return null;
  }
}

async function generateMessage(messageId: number, type: 'userInput' | 'incomingMessage') {
  const settings = settingsManager.getSettings();

  const profile = getConnectionProfile();
  if (!profile) {
    st_echo('warning', 'No valid connection profile available');
    return;
  }

  const message = context.chat[messageId];
  if (!message) {
    st_echo('error', `Could not find message with id ${messageId}`);
    return;
  }
  if (generating.includes(messageId)) {
    st_echo('warning', 'Translation is already in progress');
    return;
  }

  const targetLanguage = type === 'userInput' ? settings.inputTargetLanguage : settings.outputTargetLanguage;

  generating.push(messageId);

  try {
    const textToTranslate = message.mes ?? '';
    const displayText = await translateText(textToTranslate, targetLanguage);

    if (!displayText) {
      return;
    }

    if (type === 'userInput') {
      message.mes = displayText;
    } else {
      if (typeof message.extra !== 'object') {
        message.extra = {};
      }
      message.extra.display_text = displayText;
      message.extra.uwu_cached_translation = displayText;
      $(`.mes[mesid="${messageId}"]`).find('.mes_uwu_retranslate_button').show();
    }
    st_updateMessageBlock(messageId, message);
    await context.saveChat();
  } catch (error) {
    console.error(error);
    st_echo('error', `Translation failed: ${error}`);
  } finally {
    generating = generating.filter((id) => id !== messageId);
  }
}

function main() {
  initUI();

  // Register slash command
  context.SlashCommandParser.addCommandObject(
    context.SlashCommand.fromProps({
      name: 'uwu-translate',
      callback: async (_args: any, value: String) => {
        const messageId = value ? Number(value.toString()) : -1;
        if (isNaN(messageId)) {
          return 'Invalid message ID.';
        }

        try {
          const actualMessageId = messageId === -1 ? context.chat.length - 1 : messageId;
          await generateMessage(actualMessageId, 'incomingMessage');
          return `Message translated.`;
        } catch (error) {
          return `Translation failed: ${error}`;
        }
      },
      returns: 'confirmation',
      unnamedArgumentList: [
        context.SlashCommandArgument.fromProps({
          description: 'message ID (-1 for latest)',
          typeList: [context.ARGUMENT_TYPE.NUMBER],
          isRequired: false,
        }),
      ],
      helpString: 'Translates a message using UwU Translation.',
    }),
  );
}

function importCheck(): boolean {
  return !!context.ConnectionManagerRequestService;
}

if (!importCheck()) {
  st_echo('error', `[${extensionName}] Make sure ST is updated.`);
} else {
  settingsManager
    .initializeSettings()
    .then(() => main())
    .catch((error) => {
      st_echo('error', error);
    });
}
