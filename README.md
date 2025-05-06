# sniff 🕵️

![Image](https://github.com/user-attachments/assets/12bc66e6-65c1-4796-bec1-b7b4c1228d89)
#
**sniff** is a fast and developer-friendly CLI tool that scans your project's dependencies to identify outdated, unmaintained, or low-quality npm packages.  
It leverages the powerful [npms.io](https://npms.io) API to analyze package health and suggests modern, actively maintained alternatives — helping you keep your project clean, secure, and up-to-date.

Use **sniff** to:

- Detect risks in your `node_modules`
- Replace legacy or abandoned packages
- Improve project stability and maintainability
- Export detailed reports in JSON or Markdown

---

## 🚀 Install

```bash
npm install -g @jayanithu/sniff
```

---

## 🔧 Usage

```bash
sniff [options]
```

---

### ⚙️ Options

| Flag                    | Description                                          |
|-------------------------|------------------------------------------------------|
| `-V, --version`         | Output the version number                            |
| `-t, --top <number>`    | Analyze only top N dependencies                      |
| `-r, --report <format>` | Export results to file (`json`, `markdown`)         |
| `-f, --find-alternatives` | Suggest better packages for weak dependencies     |
| `-u, --unused`          | List unused dependencies                             |
| `-o, --outdated`        | List outdated dependencies                           |
| `-s, --scores`          | Show npms.io scores for each package                 |
| `--json`                | Output raw JSON for scripting or pipelines           |
| `-v, --verbose`         | Show detailed output                                 |
| `-h, --help`            | Display help for command                             |

---

## 📊 Features

- **Package Health Analysis**: Evaluates quality, maintenance, and popularity
- **Outdated Detection**: Identifies packages that need updating
- **Unused Package Detection**: Finds dependencies not used in your codebase
- **Alternative Suggestions**: Recommends better maintained alternatives
- **Export Options**: JSON or Markdown report generation
- **Customizable Analysis**: Analyze specific metrics using flags

---

## 📄 License

MIT © 2025 — [@jayanithu](https://npmjs.com/~jayanithu)
