# 🌐 UwU Translation

A simple translation extension for SillyTavern using Connection Manager profiles.

## ✨ Features

- **Manual Translation**: Click the globe button on any message to translate
- **Auto Translation**: Automatically translate incoming responses or outgoing inputs
- **Custom Prompts**: Write your own translation prompt with ChatML support
- **Flexible Language**: Type any language directly (no dropdown limitations)

## 📋 Requirements

- SillyTavern (latest version)
- Connection Manager with at least one configured profile

## 📦 Installation

### Via SillyTavern (Recommended)

1. Open SillyTavern and go to **Extensions** tab
2. Click **Install extension**
3. Paste the repository URL: `https://github.com/ICSLI/SillyTavern-UwU-Translation`
4. Click **Save**

### Manual Installation

1. Clone or download this repository
2. Copy the folder to `SillyTavern/public/scripts/extensions/third-party/SillyTavern-UwU-Translation/`
3. Restart SillyTavern

## ⚙️ Settings

| Setting | Description |
|---------|-------------|
| **Connection Profile** | Select the LLM profile to use for translation |
| **Auto Mode** | `None` / `Responses` / `Inputs` / `Both` |
| **Input Target Language** | Language for translating your messages |
| **Output Target Language** | Language for translating AI responses |
| **Context Message Count** | Number of previous messages to include (1-10) |
| **Context User Label** | Label for user messages (e.g., `{{user}}`) |
| **Context Char Label** | Label for character messages (e.g., `{{char}}`) |
| **Context Separator** | Separator between label and message (e.g., `: `) |
| **Context Message Separator** | Separator between messages (e.g., `\n\n` for double line break) |
| **Translation Prompt** | Customizable prompt with ChatML support |

## 📖 Usage

### Manual Translation

1. Click the **globe icon** on any message to translate
2. Click again to **hide** translation (cache is preserved)
3. Click the **rotate icon** to **re-translate** with fresh request

### Auto Translation

Set **Auto Mode** in settings:

| Mode | Behavior |
|------|----------|
| None | Manual only |
| Responses | Auto-translate AI messages |
| Inputs | Auto-translate your messages |
| Both | Auto-translate all messages |

### Extension Menu

Click the translation button in the extensions menu (wand icon) to translate text in the input field. Supports partial selection.

### Slash Command

```
/uwu-translate [messageId]
```

- `/uwu-translate` - Translate the latest message
- `/uwu-translate 5` - Translate message #5

## 📝 Prompt Variables

| Variable | Description |
|----------|-------------|
| `{{lang}}` | Target language (from settings) |
| `{{text}}` | Text to translate |
| `{{context}}` | Previous message context (formatted with labels) |
| `{{name}}` | Speaker name of the message being translated |

### Default Prompt

```
<|im_start|>user
You are a professional translator.

{{context}}Translate the text within <text> tags into {{lang}}.

Rules:
- Preserve the original meaning, tone, and structure
- Keep proper nouns unchanged unless they have standard translations
- Adapt idioms naturally for the target language
- Consider the previous message context when provided
- Return ONLY the translation, without any prefixes or meta-commentary

<text>
{{text}}
</text>
<|im_end|>
```

## 💬 Context Feature

The `{{context}}` variable in your prompt includes previous messages to help maintain consistency and improve translation quality.

### Configuration

- **Context Message Count**: Number of previous messages to include (1-10, default: 3)
- **Context User Label**: Label for user messages (default: `{{user}}`)
- **Context Char Label**: Label for character messages (default: `{{char}}`)
- **Context Separator**: Separator between label and message (default: `: `)
- **Context Message Separator**: Separator between messages (default: `\n\n` - double line break)

### How It Works

Previous messages are formatted as: `[Label][Separator][Message]`

Messages are separated by the Context Message Separator to distinguish multi-line messages. With default settings:
```
{{user}}: Hello, how are you?

{{char}}: I'm doing great, thanks!
How about you?
```

The double line break (`\n\n`) makes it clear that "How about you?" belongs to the character's message, not a new message.

### Example Usage

With context count: 2, user label: `User`, char label: `Assistant`, separator: `:`, message separator: `\n\n`:

```
User: Hello, how are you?

Assistant: I'm doing great, thanks\!

Translate the text within <text> tags into English.
<text>
That's wonderful to hear\!
</text>
```

The translator can see the conversation flow and provide contextually appropriate translations.

### When Context is Empty

- Manual translation in input field (no messageId)
- No previous messages (first message in chat)
- Context count set to 0

The `{{context}}` variable will be replaced with an empty string.

## 💾 Data Storage

Translations are cached in `message.extra`:

- `display_text`: Currently displayed translation
- `uwu_cached_translation`: Cached translation for toggle

## 🙏 Credits

Inspired by [SillyTavern-Magic-Translation](https://github.com/bmen25124/SillyTavern-Magic-Translation) by bmen25124.

## 📄 License

[MIT](LICENSE)
