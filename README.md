# sniff 🕵️ 

**sniff** is a fast and developer-friendly CLI tool that scans your project's dependencies to identify outdated, unmaintained, or low-quality npm packages.  
It leverages the powerful [npms.io](https://npms.io) API to analyze package health and suggests modern, actively maintained alternatives—helping you keep your project clean, secure, and up-to-date.

Use **sniff** to:

- Detect risks in your `node_modules`
- Replace legacy or abandoned packages
- Improve project stability and maintainability

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

### Common Commands

```bash
sniff             # Full analysis
sniff -t 10       # Top 10 dependencies
sniff -r json     # Export as JSON
sniff -f          # Suggest better packages
sniff -u -o       # Unused & outdated
sniff -s          # Show health scores
sniff --json | jq # Raw output for pipelines
```

---

## 📄 License

MIT © 2025 — [@jayanithu](https://npmjs.com/~jayanithu)
