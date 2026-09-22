<p align="center">
  <img src="./docs/assets/email-mcp-hero.png" alt="One MCP server connecting multiple email accounts" width="100%" />
</p>

# Email SMTP/IMAP MCP

One local MCP server for every inbox: search, read, send, reply, forward, and organize email across multiple accounts.

[![release](https://img.shields.io/github/v/release/samihalawa/email-smtp-imap-mcp)](https://github.com/samihalawa/email-smtp-imap-mcp/releases/latest)
[![npm](https://img.shields.io/npm/v/email-smtp-imap-mcp?color=cb3837)](https://www.npmjs.com/package/email-smtp-imap-mcp)
[![downloads](https://img.shields.io/npm/dm/email-smtp-imap-mcp)](https://www.npmjs.com/package/email-smtp-imap-mcp)
[![CI](https://github.com/samihalawa/email-smtp-imap-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/samihalawa/email-smtp-imap-mcp/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![stars](https://img.shields.io/github/stars/samihalawa/email-smtp-imap-mcp?style=flat)](https://github.com/samihalawa/email-smtp-imap-mcp/stargazers)
[![license](https://img.shields.io/github/license/samihalawa/email-smtp-imap-mcp)](LICENSE)

## Why this server

- **No account-count cap** — add work, personal, support, or client inboxes and switch with `account_name`.
- **SMTP + IMAP together** — send and receive through one small MCP server.
- **Complete everyday workflow** — search, read, reply, forward, attach files, flag, archive, move, and list folders.
- **Provider-agnostic** — works with Gmail, iCloud Mail, Fastmail, Outlook, self-hosted mail, and other standard SMTP/IMAP providers.
- **Local stdio transport** — no hosted relay and no separate control panel.

<p align="center">
  <img src="./docs/assets/email-mcp-features.png" alt="Search, send, respond, organize, and browse folders across accounts" width="100%" />
</p>

## Quick start

### 1. Create your `.env`

Copy [.env.example](.env.example) to a private location and add as many named accounts as you need:

```dotenv
EMAIL_ACCOUNTS_JSON='{
  "work": {
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "user": "work@example.com",
      "password": "app-password"
    },
    "imap": {
      "host": "imap.gmail.com",
      "port": 993,
      "secure": true,
      "user": "work@example.com",
      "password": "app-password"
    },
    "default_from_name": "Your Name",
    "sender_emails": ["work@example.com", "alias@example.com"]
  },
  "personal": {
    "smtp": {
      "host": "smtp.mail.me.com",
      "port": 587,
      "secure": false,
      "user": "you@icloud.com",
      "password": "app-password"
    },
    "imap": {
      "host": "imap.mail.me.com",
      "port": 993,
      "secure": true,
      "user": "you@icloud.com",
      "password": "app-password"
    }
  }
}'

DEFAULT_EMAIL_ACCOUNT="work"
```

The server loads `.env` from its working directory automatically. `EMAIL_ENV_FILE` lets an MCP client use an `.env` stored anywhere.

### 2. Add the MCP server

For Claude Desktop, edit:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "email": {
      "command": "npx",
      "args": ["-y", "email-smtp-imap-mcp"],
      "env": {
        "EMAIL_ENV_FILE": "/absolute/path/to/your/.env"
      }
    }
  }
}
```

Use an absolute path, restart your MCP client, then ask: **“List my configured email accounts.”**

<details>
<summary>Pass account JSON directly from the MCP client</summary>

You can skip the `.env` file and set `EMAIL_ACCOUNTS_JSON` plus `DEFAULT_EMAIL_ACCOUNT` directly in the MCP client’s `env` object. The JSON must be escaped into a single string.

```json
{
  "env": {
    "EMAIL_ACCOUNTS_JSON": "{\"work\":{\"smtp\":{\"host\":\"smtp.gmail.com\",\"port\":587,\"user\":\"work@example.com\",\"password\":\"app-password\"},\"imap\":{\"host\":\"imap.gmail.com\",\"port\":993,\"user\":\"work@example.com\",\"password\":\"app-password\"}}}",
    "DEFAULT_EMAIL_ACCOUNT": "work"
  }
}
```

</details>

<details>
<summary>Single-account `.env` variables</summary>

Use `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `IMAP_HOST`, `IMAP_PORT`, `IMAP_SECURE`, `IMAP_USER`, and `IMAP_PASS` instead of `EMAIL_ACCOUNTS_JSON`.

`SMTP_USERNAME`/`SMTP_PASSWORD` and `IMAP_USERNAME`/`IMAP_PASSWORD` are accepted aliases. IMAP credentials default to the SMTP credentials when omitted. Use `SENDER_EMAILS` as a comma-separated allowlist for optional `from_email` selection.

For SMTP sending only, the IMAP variables can be omitted:

```dotenv
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="you@gmail.com"
SMTP_PASS="your-16-character-app-password"
DEFAULT_FROM_NAME="Your Name"
SENDER_EMAILS="you@gmail.com"
```

Add the IMAP variables only when you also want to search, read, reply to, or organize messages.

</details>

## Tools

| Tool | What it does |
| --- | --- |
| `accounts_list` | List every configured account and identify the default without exposing credentials. |
| `emails_find` | Search by text, sender, recipient, subject, date, read state, flag state, or attachments. Optionally return bodies and attachments. |
| `email_send` | Send plain-text or HTML email with CC, BCC, sender aliases, and base64 attachments. |
| `email_respond` | Reply, reply-all, or forward by email UID with threading and optional original attachments. |
| `emails_modify` | Mark read/unread, flag/unflag, or move messages to another folder. |
| `folders_list` | List folders with optional total and unread counts. |

Every email tool accepts an optional `account_name`. Without it, the server uses `DEFAULT_EMAIL_ACCOUNT` or the first configured account. There is no application-level account-count limit.

## Verify your setup

After restarting the MCP client, try these in order:

1. “List my configured email accounts.”
2. “List folders for my `work` account.”
3. “Find the five newest unread emails in my `personal` account.”
4. “Send a plain-text email from my `work` account.”

## Provider settings

| Provider | SMTP | IMAP | Credential |
| --- | --- | --- | --- |
| Gmail | `smtp.gmail.com:587` | `imap.gmail.com:993` | [App password](https://support.google.com/accounts/answer/185833) |
| iCloud Mail | `smtp.mail.me.com:587` | `imap.mail.me.com:993` | [App-specific password](https://support.apple.com/en-us/102654) |
| Other providers | Use the provider's SMTP host | Use the provider's IMAP host | Provider password or app password |

Use `secure: true` for implicit TLS ports such as 465/993. Port 587 normally uses `secure: false` and upgrades with STARTTLS.

## Development

```bash
git clone https://github.com/samihalawa/email-smtp-imap-mcp.git
cd email-smtp-imap-mcp
npm ci
npm test
```

Run the compiled stdio server with `npm start`. Build a production container with `docker build -t email-smtp-imap-mcp .`.

## Docker Compose

The server uses MCP stdio transport, so it does not expose an HTTP port. Create the environment file in the repository root, then build and start the container:

```bash
cp .env.example .env
# Edit .env and add your SMTP/IMAP account details.
docker compose up --build
```

That command keeps the MCP server running with its stdin/stdout attached to the Compose process. To connect an MCP client, configure the client to launch the Compose service as its stdio command instead:

```json
{
  "mcpServers": {
    "email": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/absolute/path/to/email-smtp-imap-mcp/docker-compose.yml",
        "run",
        "--rm",
        "-T",
        "email-mcp"
      ]
    }
  }
}
```

The Compose file mounts `.env` read-only into the container. Do not commit that file because it contains email credentials. Use app-specific passwords where your provider supports them.

### LiteLLM Proxy with Docker

This server currently uses MCP stdio, so its LiteLLM entry is different from an HTTP server such as Atlassian MCP. Add this under `mcp_servers` in the LiteLLM config:

```yaml
mcp_servers:
  email:
    command: docker
    args:
      - compose
      - -f
      - /home/ehanhmed/email-smtp-imap-mcp/docker-compose.yml
      - run
      - --rm
      - -T
      - email-mcp
```

If LiteLLM runs directly on the host, this is sufficient. If LiteLLM runs in a Docker container, that container must also have access to the Docker daemon and this repository path, for example:

```yaml
services:
  litellm:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /home/ehanhmed/email-smtp-imap-mcp:/home/ehanhmed/email-smtp-imap-mcp:ro
```

The external `litellm-langfuse-net` network is not used for this stdio connection. LiteLLM launches the email container locally and communicates with it through stdin/stdout. The email container still needs normal outbound access to the SMTP provider. After restarting LiteLLM, first verify that `accounts_list` and the other email tools appear; calling `email_send` sends a real message to the configured recipient.

### Recreate the Setup on Another System

1. Install Docker Compose, then clone this repository:

```bash
git clone <repository-url> email-smtp-imap-mcp
cd email-smtp-imap-mcp
cp .env.example .env
```

2. Edit `.env` with the SMTP credentials, sender allowlist, and optional `DEFAULT_TO_EMAIL`. Do not copy the old app password into source control; create a new provider app password when moving systems.

3. Build and verify the MCP:

```bash
npm ci
npm run build
docker compose build
docker compose config --quiet
```

4. In the LiteLLM `config.yaml`, use the direct Node stdio entry below. Replace both `/home/you/email-smtp-imap-mcp` paths with the absolute path on the new system:

```yaml
mcp_servers:
  email:
    transport: stdio
    command: node
    args:
      - /home/you/email-smtp-imap-mcp/build/index.js
    env:
      EMAIL_ENV_FILE: /home/you/email-smtp-imap-mcp/.env
```

5. If LiteLLM runs in Docker, mount the repository and its config into the LiteLLM container. The LiteLLM image must contain Node.js; no separate LiteLLM package install is needed:

```yaml
volumes:
  - /home/you/email-smtp-imap-mcp:/home/you/email-smtp-imap-mcp:ro
  - ./config.yaml:/app/config.yaml
```

6. Reload LiteLLM using the normal deployment procedure. Then use the LiteLLM UI to list tools and confirm that `accounts_list`, `emails_find`, `email_send`, `email_respond`, `emails_modify`, and `folders_list` are visible. Do not call `email_send` during setup verification unless you intend to send a real email.

The `litellm-langfuse-net` network is not required for this stdio MCP connection. The LiteLLM container only needs access to the mounted repository, Node.js, and outbound SMTP networking.

## Contributing

Issues and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and [SECURITY.md](SECURITY.md) for vulnerability reports.

## License

[MIT](LICENSE) © Sami Halawa
