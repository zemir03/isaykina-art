# Автодеплой на Beget (GitHub Actions)

## Секреты в GitHub

В `Settings → Secrets → Actions` должны быть:

| Имя | Пример |
|-----|--------|
| `BEGET_HOST` | `zrvziru5.beget.tech` |
| `BEGET_USER` | твой SSH-логин (как в панели Beget) |
| `BEGET_PATH` | путь к сайту, часто **`isaykina-art/public_html`** (проверь в файловом менеджере) |
| `BEGET_SSH_KEY` | **приватный** ключ OpenSSH — см. ниже |

**FTP-аккаунт в панели не обязателен:** для деплоя достаточно SSH + ключ. Если в интерфейсе не видишь раздел FTP, открой **«Сайты»** → твой сайт → часто там же **SSH** и путь к каталогу, либо напиши в поддержку Beget с вопросом «где включить SSH и куда класть ключ».

## Как сделать правильный ключ (важно)

В секрет кладём **приватный** ключ в формате OpenSSH (файл без `.pub`).

### Вариант 1: Git Bash (если установлен Git for Windows)

1. Открой **Git Bash**.
2. Выполни (одной строкой):

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ./github-beget -N ""
```

3. Открой файл **`github-beget.pub`** — **одна строка** вида `ssh-ed25519 AAAA...` — её добавь в **Beget** в файл `~/.ssh/authorized_keys` (в новую строку).
4. Открой файл **`github-beget`** (без `.pub`) — весь текст целиком, с первой строкой `-----BEGIN ...` и последней `-----END ...` — вставь в секрет **`BEGET_SSH_KEY`** на GitHub.

Старый нерабочий ключ из секрета удали или полностью замени этим.

### Вариант 2: PuTTYgen

1. Сгенерируй **Ed25519**.
2. Скопируй **public key** для OpenSSH (бокс сверху) → в `authorized_keys` на Beget.
3. Меню **Conversions → Export OpenSSH key** (нужен именно OpenSSH, не `.ppk`) → сохрани файл, открой в блокноте и вставь **весь** текст в `BEGET_SSH_KEY`.

После этого в GitHub: **Actions → Deploy To Beget → Run workflow.**
