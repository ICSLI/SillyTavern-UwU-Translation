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

### Default Prompt

```
<|im_start|>user
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
<|im_end|>
```

## 💾 Data Storage

Translations are cached in `message.extra`:

- `display_text`: Currently displayed translation
- `uwu_cached_translation`: Cached translation for toggle

## 🙏 Credits

Inspired by [SillyTavern-Magic-Translation](https://github.com/bmen25124/SillyTavern-Magic-Translation) by bmen25124.

## 📄 License

[MIT](LICENSE)
