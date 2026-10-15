# Local language and vision models

The API talks to its models through one OpenAI-compatible client
(`POST {url}/v1/chat/completions`). Any server that implements that API can be
used. Two setups are documented here:

| Setup | Where it is used | Text | Vision |
|---|---|---|---|
| **A. llama.cpp**, two `llama-server` processes | development, servers with a GPU or spare RAM | Qwen3-4B-Instruct-2507 on :8081 | Qwen2.5-VL-3B-Instruct on :8082 |
| **B. Ollama**, one server | reference production server (shared host) | `qwen2.5vl:3b` on :11434 | the same model |

Qwen2.5-VL-3B is the vision model evaluated in the article (509 images:
sensitivity 100 %, specificity 62 %, macro-F1 0.55). Because specificity is
moderate, the application presents every pest result as a first check, not a
final diagnosis. Both model families are Apache 2.0.

The environment variables keep the `LLAMACPP_` prefix in both setups:

| Variable | A. llama.cpp | B. Ollama |
|---|---|---|
| `LLM_PROVIDER` | `llamacpp` | `llamacpp` |
| `LLAMACPP_TEXT_URL` | `http://127.0.0.1:8081` | `http://127.0.0.1:11434` |
| `LLAMACPP_VISION_URL` | `http://127.0.0.1:8082` | `http://127.0.0.1:11434` |
| `LLAMACPP_TEXT_MODEL` | `qwen3-4b-instruct` (the `--alias`) | `qwen2.5vl:3b` |
| `LLAMACPP_VISION_MODEL` | `qwen2.5-vl-3b` (the `--alias`) | `qwen2.5vl:3b` |
| `LLAMACPP_API_KEY` | only with `--api-key` | empty |

A trailing `/v1` in a URL is accepted. The API checks availability with
`GET {url}/health` and, when that fails, `GET {url}/v1/models`; llama.cpp
answers the first, Ollama the second. `GET /api/health` reports the result as
`llm` and `vision` (`ok` or `unavailable`).

With `LLM_PROVIDER=llamacpp` no text and no image leaves the host.
`LLM_PROVIDER=groq` (or the admin setting) moves only the text features to the
Groq API; photographs always go to `LLAMACPP_VISION_URL`.

A diagnosis is made in two steps: the vision model identifies the plant and
the problem (strict JSON, temperature 0), then the text model explains it to
the farmer in the chosen language, with doses per 20-litre backpack sprayer.
The text model also writes the assistant replies, the weekly weather plan, the
pest management plan and the advisory drafts. The API waits up to 150 s for a
text answer and 180 s for a photo; nginx allows 300 s on `/api/`.

## A. llama.cpp

### A.1 Install on Debian

Option 1, build from source (uses every instruction set of the CPU):

```bash
sudo apt install -y build-essential cmake git libcurl4-openssl-dev
git clone --depth 1 https://github.com/ggml-org/llama.cpp /tmp/llama.cpp
cd /tmp/llama.cpp
cmake -B build -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=ON -DLLAMA_CURL=ON
cmake --build build --config Release -j"$(nproc)" --target llama-server
sudo install -d /opt/llama.cpp/bin
sudo install -m 0755 build/bin/llama-server /opt/llama.cpp/bin/
sudo cp -a build/bin/*.so* /opt/llama.cpp/bin/ 2>/dev/null || true
/opt/llama.cpp/bin/llama-server --version
```

With an NVIDIA GPU, install the CUDA toolkit and add `-DGGML_CUDA=ON`; then add
`-ngl 99` to both units so that every layer runs on the GPU.

Option 2, release binaries: download `llama-<tag>-bin-ubuntu-x64.zip` from
<https://github.com/ggml-org/llama.cpp/releases>, unzip it and copy the content
of `build/bin/` to `/opt/llama.cpp/bin/`.

On macOS, `brew install llama.cpp` provides `llama-server`.

### A.2 Service user and models

| Purpose | Port | Alias | GGUF files | Approx. RAM |
|---|---|---|---|---|
| Text | 8081 | `qwen3-4b-instruct` | `Qwen3-4B-Instruct-2507-Q4_K_M.gguf` | 3 GB |
| Vision | 8082 | `qwen2.5-vl-3b` | `Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf` + `mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf` | 3.5 GB |

```bash
sudo useradd --system --home /var/lib/llama --shell /usr/sbin/nologin llama
sudo install -d -o llama -g llama /var/lib/llama/models
cd /var/lib/llama/models

base=https://huggingface.co
sudo -u llama curl -fL -O "$base/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf"
sudo -u llama curl -fL -O "$base/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf"
sudo -u llama curl -fL -O "$base/ggml-org/Qwen2.5-VL-3B-Instruct-GGUF/resolve/main/mmproj-Qwen2.5-VL-3B-Instruct-f16.gguf"
ls -lh
```

`pip install -U huggingface_hub` and `hf download <repo> <file> --local-dir .`
do the same and resume interrupted downloads.

### A.3 systemd units

The units are in [`systemd/`](systemd/): `agroyachay-llm-text.service`
(127.0.0.1:8081) and `agroyachay-llm-vision.service` (127.0.0.1:8082).

```bash
sudo cp deploy/systemd/agroyachay-llm-text.service deploy/systemd/agroyachay-llm-vision.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now agroyachay-llm-text agroyachay-llm-vision
ss -ltnp | grep -E '808[12]'                 # must show 127.0.0.1 only
curl -s http://127.0.0.1:8081/health         # {"status":"ok"}
curl -s http://127.0.0.1:8082/v1/models      # alias qwen2.5-vl-3b
```

Flags used:

| Flag | Why |
|---|---|
| `--host 127.0.0.1` | llama-server has no user accounts; it must never be reachable from the network |
| `-c 8192` | context for the longest prompt (weather plan) or a photo plus the prompt |
| `--jinja` | uses the chat template stored in the GGUF (needed for Qwen3 and for images) |
| `--parallel 2` / `--parallel 1` | two simultaneous text requests share the context; vision serves one photo at a time |
| `--alias` | the model name the API sends; must match `LLAMACPP_TEXT_MODEL` / `LLAMACPP_VISION_MODEL` |
| `--no-webui` | the built-in chat page is not needed |

`/health` answers 503 while a model is loading and 200 when it is ready.

Quick test:

```bash
curl -s http://127.0.0.1:8081/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"qwen3-4b-instruct","messages":[{"role":"user","content":"En una frase: ¿cuándo se siembra la papa en el Altiplano?"}]}'
```

### A.4 A larger text model

On a machine with 24 GB of RAM or more, a mixture-of-experts model such as
Qwen3-30B-A3B-Instruct-2507 (Q4_K_M, about 18 GB) gives clearly better answers
at a speed close to the 4B model, because only about 3B parameters are active
per token. Change the `-m` path and `--alias` in
`agroyachay-llm-text.service`, set `LLAMACPP_TEXT_MODEL` to the same alias,
and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart agroyachay-llm-text agroyachay-api
```

## B. Ollama

One Ollama server can serve both roles with the vision model, which keeps the
memory footprint to one model (about 3–4 GB) on a shared host.

```bash
curl -fsSL https://ollama.com/install.sh | sh     # ollama.service on 127.0.0.1:11434
ollama pull qwen2.5vl:3b
curl -s http://127.0.0.1:11434/v1/models          # lists qwen2.5vl:3b
curl -s http://127.0.0.1:11434/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"qwen2.5vl:3b","messages":[{"role":"user","content":"En una frase: ¿cuándo se siembra la papa en el Altiplano?"}]}'
```

Then set the four `LLAMACPP_*` variables as in the table above and restart the
API. Ollama binds to 127.0.0.1 by default; keep it that way. Ollama loads the
model on the first request and unloads it after a period of inactivity, so the
first answer after a pause takes longer. A separate text model can be pulled
(for example a Qwen3 instruct model) and set in `LLAMACPP_TEXT_MODEL`; the
vision model must stay a vision-language model.

## Latency

Measured on the development machine with llama.cpp (Apple M1 Pro, both models
on the GPU, one request at a time, Q4_K_M): weather plan 16–18 s, assistant
reply 3–5 s, photo diagnosis 7–10 s (vision 2–3 s plus wording 5–7 s),
management plan 7–8 s. On a CPU-only server expect roughly:

| Host | Assistant reply | Weather plan | Photo diagnosis |
|---|---|---|---|
| 4 vCPU, 8 GB RAM | 15–40 s | 60–120 s | 40–120 s |
| 8 cores, 16 GB RAM | 8–20 s | 30–60 s | 20–60 s |
| NVIDIA GPU ≥ 8 GB VRAM | 1–3 s | 5–10 s | 3–8 s |

Reserve about 7 GB of RAM for the two llama.cpp servers, or about 4 GB for
Ollama with `qwen2.5vl:3b`.

## Running the models on another machine

On a separate GPU host, bind the model server to a private address, allow its
ports only from the API server in the firewall, and point
`LLAMACPP_TEXT_URL` / `LLAMACPP_VISION_URL` to it. If the link crosses an
untrusted network, put the server behind a TLS proxy that requires a key and
set `LLAMACPP_API_KEY` (llama.cpp can also check the key itself with
`--api-key`). Never expose a model server to the internet.
