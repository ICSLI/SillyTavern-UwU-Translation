# SillyTavern UwU Translation

A [SillyTavern](https://docs.sillytavern.app/) extension that provides real-time translation of chat messages using your configured Language Model APIs, with support for ChatML format multi-message prompts.

This is a fork of [SillyTavern-Magic-Translation](https://github.com/bmen25124/SillyTavern-Magic-Translation) with ChatML parsing capabilities.

## Features

- **Real-time Translation:** Translate chat messages using any configured LLM.
- **Configurable API:** Uses SillyTavern's built-in [Connection Profiles](https://docs.sillytavern.app/usage/core-concepts/connection-profiles/).
- **Customizable Prompts:** Create and manage multiple prompt presets to fine-tune translation results.
- **ChatML Format Support:** Use multi-role message structures (system/user/assistant) in your prompts.
- **Automatic Translation:** Automatically translate incoming responses, outgoing messages, or both.
- **Manual Translation:** On-demand translation via a button on each message or with slash commands.
- **Slash Commands:**
  - `/uwu-translate [message_id]`: Translates a specific message. Defaults to the last message.
  - `/uwu-translate-text <text>`: Translates any text you provide.

## Installation

Install manually by copying the folder to:
```
/SillyTavern/public/scripts/extensions/third-party/SillyTavern-UwU-Translation/
```

Then reload SillyTavern.

## How to Use

1. **Configure a Connection Profile:**
   - Go to the **API Settings** tab (the plug icon on the top bar).
   - Set up a **Connection Profile** for the LLM you want to use for translation. This is the same as setting up a profile for a character to chat with.

2. **Configure Translation Settings:**
   - Go to the **Extensions** tab (the plug icon on the right sidebar) and find the **UwU Translation** settings panel.
   - **Connection Profile:** Select the profile you configured in the previous step.
   - **Target Language:** Choose the language you want messages translated into.
   - **Auto Mode:** Select if you want automatic translation for incoming messages (`Responses`), outgoing messages (`Inputs`), or `Both`. Leave as `None` for manual-only translation.

3. **Translate Messages:**
   - **Manual:** Click the **globe icon** on any chat message to translate it.
   - **Automatic:** If Auto Mode is enabled, messages will be translated automatically based on your settings.
   - **Slash Command:** Use `/uwu-translate` or `/uwu-translate-text` in the chat input.

## ChatML Format Support

This extension supports ChatML format tags in your prompt templates, allowing you to send multi-message conversations to the LLM API.

### ChatML Syntax

```
<|im_start|>role
content
<|im_end|>
```

Where `role` can be:
- `system` - System instructions
- `user` - User messages
- `assistant` - Assistant responses (for few-shot examples)

### Example ChatML Prompts

#### Basic System + User

```
<|im_start|>system
You are an expert translator. Always translate to {{language}} while maintaining the original tone and style.<|im_end|>
<|im_start|>user
{{prompt}}<|im_end|>
```

#### Few-Shot Translation

```
<|im_start|>system
Translate to {{language}}. Maintain formality level and context.<|im_end|>
<|im_start|>user
Hello, how are you?<|im_end|>
<|im_start|>assistant
안녕하세요, 어떻게 지내세요?<|im_end|>
<|im_start|>user
{{prompt}}<|im_end|>
```

#### With Context

```
<|im_start|>system
You are translating a conversation to {{language}}.<|im_end|>
<|im_start|>user
Previous context: {{#each (slice chat -3)}}{{this.name}}: {{this.mes}}
{{/each}}

Current message to translate:
{{prompt}}

Keep consistency with previous translations.<|im_end|>
```

### How ChatML Parsing Works

1. Your prompt template contains ChatML tags and Handlebars variables (like `{{language}}`, `{{prompt}}`)
2. Handlebars renders the template first → variables are replaced
3. The ChatML parser extracts messages with their roles
4. Messages are sent to the LLM API in proper chat completion format

**Example Processing Flow:**

```
Input template:
<|im_start|>system
Translate to {{language}}<|im_end|>
<|im_start|>user
{{prompt}}<|im_end|>

After Handlebars rendering (language="Korean", prompt="Hello"):
<|im_start|>system
Translate to Korean<|im_end|>
<|im_start|>user
Hello<|im_end|>

Sent to API as:
[
  { role: "system", content: "Translate to Korean" },
  { role: "user", content: "Hello" }
]
```

### Backward Compatibility

If your prompt doesn't use ChatML tags, the entire prompt will be sent as a single user message (same behavior as the original Magic Translation extension). This means:

- Existing prompts continue to work without modification
- You can gradually migrate to ChatML format
- No breaking changes for existing users

## Settings Explained

- **Connection Profile:** The LLM profile used for translation.
- **Prompt Presets:** Manage different prompts for translation. You can create, rename, and delete presets. The `default` preset cannot be deleted.
- **Prompt:** The instruction template sent to the LLM. Key placeholders:
  - `{{prompt}}`: The text to be translated.
  - `{{language}}`: The target language name (e.g., "Spanish", "Korean").
  - `{{chat}}`: An array of previous chat messages for context.
  - You can use ChatML tags to structure multi-role messages.
- **Filter Code Block:** If your prompt instructs the LLM to wrap the translation in a code block, this option will automatically extract the text from it.
- **Target Language:** The language to translate messages into.
- **Auto Mode:**
  - `None`: Manual translation only.
  - `Responses`: Automatically translate messages from the character.
  - `Inputs`: Automatically translate your messages before sending.
  - `Both`: Translate both incoming and outgoing messages.

## Troubleshooting

- **Extension not showing:** Make sure it's installed and enabled in the Extensions tab, then reload SillyTavern.
- **Translation errors:**
  - Verify your selected **Connection Profile** is working correctly.
  - Check the prompt for any issues. Try restoring the default prompt.
  - Some LLMs may refuse to translate if the content violates their safety policies.
- **ChatML not working:**
  - Ensure you're using the correct syntax: `<|im_start|>role\ncontent<|im_end|>`
  - Role names must be: `system`, `user`, or `assistant` (case-insensitive)
  - Check browser console for parsing warnings

## Differences from Magic Translation

- **Extension Name:** UwU Translation (to avoid conflicts)
- **Settings Key:** Stored separately (`uwuTranslation` vs `magicTranslation`)
- **Slash Commands:** `/uwu-translate` and `/uwu-translate-text`
- **ChatML Support:** Can parse multi-role message structures from prompts
- Both extensions can be installed side-by-side without conflicts

## Credits

- Original extension: [SillyTavern-Magic-Translation](https://github.com/bmen25124/SillyTavern-Magic-Translation) by bmen25124
- UwU Translation fork by ICSLI
  - ChatML format support
  - Translation caching with toggle behavior
  - Re-translate button for forced re-translation

## License

MIT License - See [LICENSE](LICENSE) for details.
