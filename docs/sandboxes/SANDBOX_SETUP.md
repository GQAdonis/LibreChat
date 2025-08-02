You’ll need both the codesandbox-client (Sandpack bundler) and the static-browser-server—just bundler alone isn’t enough to reliably preview artifacts in LibreChat. The static-browser-server handles service-worker isolation, wildcard subdomain origins, and proper lifetime management for sandboxed previews.  The full self-host guide is available in the repo.  ￼

⸻

🚀 What You’re Hosting on Your VM
	•	LibreChat — runs from https://librechat.prometheusags.ai via Docker Compose (exposed on a host port, e.g. 1490).
	•	Sandpack Bundler — static build from codesandbox-client, served via static-browser-server.
	•	static-browser-server — Node (or Bun) preview server that runtime-isolates artifacts via random subdomains like abcd123-preview.yourdomain.com.
	•	Nginx Reverse Proxy — terminates TLS and routes:
	•	Requests to https://librechat.prometheusags.ai/ → LibreChat container.
	•	Requests to https://preview.prometheusags.ai/ → static-browser-server container.

⸻

📦 Deployment Overview

VM (GPU, 24 GB VRAM)
│
├─ Docker    
│   ├─ container: librechat_app         (Docker Compose)   → LibreChat app port 1490
│   ├─ container: static_browser_server (Docker or Bun)    → port 1580
│
└─ Nginx (host level reverse proxy)
    ├─ certs: from Let’s Encrypt (wildcard `preview.prometheusags.ai` and `librechat.prometheusags.ai`)
    ├─ proxy passes to host ports


⸻

🔧 Step 1: Clone & Build

A. codesandbox-client → build Sandpack bundler

git clone https://github.com/codesandbox/codesandbox-client.git
cd codesandbox-client
npm ci
npm run build:deps
npm run build:sandpack
# → Outputs `www/` directory

This builds the static assets that your sandbox runner will use (JS bundles, service worker, transpilable code).  ￼ ￼

B. static-browser-server → serve the www/

git clone https://github.com/LibreChat-AI/static-browser-server.git
cd static-browser-server
npm ci
npm run build

The build output includes bin/relay.js and a fallback demo; you’ll serve the bundler assets from /www/ of the codesandbox repo.  ￼

⸻

📦 Step 2: Docker Compose (on the host with GPU)

Create docker-compose.sandpack.yml:

version: "3.8"
services:

  static-browser:
    image: node:20-alpine
    working_dir: /srv/relay
    volumes:
      - ./codesandbox-client/www:/srv/relay/www:ro
      - ./static-browser-server/dist:/srv/relay/dist:ro
      - ./static-browser-server/Caddyfile:/srv/relay/Caddyfile:ro
    ports:
      - "1580:1580"
    command: ["node", "/srv/relay/dist/bin/relay.js", "--bundler-dir", "/srv/relay/www", "--hostname", "preview.prometheusags.ai", "--port", "1580"]
    restart: unless-stopped

  librechat:
    image: ghcr.io/LibreChat-AI/LibreChat:latest
    ports:
      - "1490:3000"
    environment:
      - SANDPACK_STATIC_BUNDLER_URL=https://preview.prometheusags.ai
      - TZ=America/Chicago
    depends_on:
      - static-browser

	•	Port 1580 is bound for static-browser-server; Sandpack preview connections go there.
	•	LibreChat connects to it via the SANDPACK_STATIC_BUNDLER_URL.  ￼ ￼ ￼

Then run:

docker compose -f docker-compose.sandpack.yml up -d


⸻

🔒 Step 3: DNS and TLS Certificates
	1.	Add DNS records in your DNS provider:
	•	librechat.prometheusags.ai → your VM’s public IP
	•	preview.prometheusags.ai → same public IP
	2.	Use Certbot with wildcard SAN support:

sudo certbot certonly --nginx -d librechat.prometheusags.ai -d preview.prometheusags.ai

This certificate must cover both domains so you can proxy TLS locally. Alternatively, you can obtain a second cert for the wildcard preview subdomain pattern (e.g. *.preview.prometheusags.ai). The static-browser-server requires each generated preview subdomain like id-preview.prometheusags.ai to be valid.  ￼

⸻

🧱 Step 4: Host-Level Nginx Config

(create /etc/nginx/sites-available/librechat, symlink activate)

server {
    listen 443 ssl http2;
    server_name librechat.prometheusags.ai;

    ssl_certificate     /etc/letsencrypt/live/librechat.prometheusags.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/librechat.prometheusags.ai/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:1490;
        include /etc/nginx/proxy_params;
    }
}

server {
    listen 443 ssl http2;
    server_name *.preview.prometheusags.ai;

    ssl_certificate     /etc/letsencrypt/live/librechat.prometheusags.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/librechat.prometheusags.ai/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:1580;
        include /etc/nginx/proxy_params;
        proxy_set_header Host $host;
    }
}

⚠️ Confirm proxy_params include:

proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

Reload Nginx after changes: sudo nginx -t && sudo systemctl reload nginx

⸻

✅ Step 5: LibreChat .env Setup

Make sure .env has the following:

APP_DOMAIN=https://librechat.prometheusags.ai
SANDPACK_STATIC_BUNDLER_URL=https://preview.prometheusags.ai

If LibreChat is older, you may need to use SANDPACK_BUNDLER_URL; newer versions accept either. Restart container after env changes.  ￼

Also update CSP in .env or through your LibreChat config:

CSP_FRAME_SRC="frame-src 'self' https://*.preview.prometheusags.ai"

This ensures LibreChat’s artifact iframe can load the preview origin.  ￼

⸻

🧪 Step 6: Test with a React Artifact
	1.	In LibreChat, generate a React artifact (e.g. a simple “Hello Component”).
	2.	Switch to the “Preview” tab — this is served from your id-preview.prometheusags.ai.
	3.	Open devtools ➜ Network tab. Do not see any timeout/404?
	4.	Refresh artifact → preview should persist; no timeouts, no TIME_OUT errors.
Common disconnect error message: TIME_OUT in artifact preview logs — indicates missing static browser orchestration.  ￼ ￼

⸻

📘 Why This Stack Fixes the Disconnects
	•	Wildcard subdomains (id-preview...) preserve browser isolation (same-origin) via service worker keying.
	•	Bundler served from your infra removes external reliance and random timeouts from Codesandbox CDN.
	•	HTTPS + CSP allow iframe preview to work fully in modern browsers.
	•	Stable Docker network between LibreChat and static preview container.

⸻

🧠 Additional Tips for GPU VM
	•	Since your VM has GPU with 24 GB VRAM, ensure LibreChat’s AI backend processes use GPUs via Docker with --gpus all in Compose (if you plan to run inference locally).
	•	This GPU configuration doesn’t impact Sandpack sandboxing—it’s fully JS-based and isolated.
	•	If you combine GPU workload inside same Docker network, keep I/O performance in mind (especially for AI models vs artifact execution).

⸻

📚 Citations & License
	•	Sandpack (bundler and client) is published under Apache-2.0 permissive license.  ￼ ￼ ￼ ￼ ￼ ￼
	•	Hosting guide for bundler and client is documented in the official guide.  ￼
	•	static-browser-server repo on GitHub has specialized instructions tailored to LibreChat.  ￼

⸻

✅ TL;DR
	•	✅ You need both the Sandpack bundler and static-browser-server—not just one.
	•	✅ Build local assets via codesandbox-client then serve through static-browser-server.
	•	✅ Use Docker Compose + Nginx proxy + proper TLS for both LibreChat and preview domains.
	•	✅ Test with React artifact to ensure previewing is reliable—no disconnects, no CDN dependencies.

Need help converting this into a Helm chart, Terraform/AWS Terraform module, or securing the preview path behind OAuth? Just say the word—I can help modularize it for your full AI-aware monorepo deployment flow.