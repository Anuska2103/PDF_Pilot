# PDF Bot

<!--
Place screenshots here. Add images in `assets/` and replace the placeholders below.
Example: ![Landing page](assets/screenshot 1.png)
-->

## **Project Description**

PDF Bot is an AI-powered assistant for processing PDF documents. It provides features such as text extraction, summarization, RAG-based chat (retrieval-augmented generation), audio overviews and podcast generation, PPT outline and download, and PDF→DOCX conversion. The backend is a Python ASGI application served with Uvicorn, and the frontend is a Next.js application that interacts with the API.


This README includes setup instructions, required environment variables and API keys, a summary of endpoints, and guidance for local development and deployment. Leave space above for screenshots and UI snippets to document the application visually.

## **Features**

- **PDF Upload & Text Extraction**: Extracts text from uploaded PDFs and stores session state.
- **Summarization**: Generates concise summaries of uploaded PDFs.
- **RAG Chat**: Retrieval-augmented chat based on ingested PDF content.
- **Audio Overview & Podcast**: Produce audio summaries and podcast-style audio from documents.
- **PPT Outline & Download**: Generate slide outlines and downloadable PPTX presentations.
- **PDF → DOCX Conversion**: Convert PDF files into editable DOCX documents.



## **Tech Stack**

| Component | Technology | Notes |
|---|---|---|
| Backend | Python, FastAPI, Uvicorn | ASGI backend in [main.py](main.py) |
| PDF Processing | pypdf, pdf2docx, python-pptx | Text extraction, conversion, and PPTX generation |
| Vector Store / RAG | Pinecone, LangChain | Stores embeddings and supports retrieval |
| LLM Integration | google-genai, langchain-google-genai | Used for summarization, scripts, audio prompts |
| Frontend | Next.js, React, Tailwind CSS (via dependencies) | Located in [frontend](frontend) |
| Hosting / Deployment | Any ASGI-compatible host for backend; Vercel/Netlify for frontend | Examples in Deploy section |


##**Application Overview**
Landing page overview of the application I made
![Landing page](assets/screenshot 1.png)


Dashboard page-
 Dashboard
![dashboard](assets/screenshot 3.png)

chat view with response
![chat overview](assets/screenshot 3.png)
## **Repository Layout (high level)**

- [main.py](main.py) - FastAPI application and routes
- [requirements.txt](requirements.txt) - Python dependencies
- [frontend](frontend) - Next.js frontend
- [src](src) - Backend source modules (agents, tools, graphs)
- [assets](assets) - Static files served at `/static`

## **API Keys & External Services**

You will need credentials for the external services the project integrates with.

| Service | Env var(s) | Required | Purpose / Notes |
|---|---|:---:|---|
| Pinecone | `PINECONE_API_KEY`, `PINECONE_INDEX` | Yes | Vector store for RAG / embeddings. See Pinecone docs for creating an index. |
| Google or llm api-key | `GOOGLE_API_KEY` | Yes  | API key for Google generative APIs used by `google-genai`. |
| Next.js Frontend | `NEXT_PUBLIC_API_URL` | Yes (for frontend dev) | Base URL for backend API (e.g., `http://localhost:8000`). |

Note: The codebase may support additional LLM backends; add their keys as needed (for example: OpenAI keys) depending on which `src.agents` graphs you enable.

## **Environment Variables**

Create a `.env` file in the project root (the project loads env via `python-dotenv`). Example variables:

| Name | Required | Example | Description |
|---|:---:|---|---|
| `PINECONE_API_KEY` | Yes | `abcd1234` | API key for Pinecone vector database |
| `PINECONE_ENV` | Yes | `us-west1-gcp` | Pinecone environment/region |
| `PINECONE_INDEX` | Yes | `pdf-bot-index` | Pinecone index name used by the app |
| `GOOGLE_API_KEY` | Conditionally | `AIza...` | Google GenAI API key (if using google-genai) |
| `NEXT_PUBLIC_API_URL` | For frontend | `http://localhost:8000` | Base URL the frontend uses to call the backend |
| `LOG_LEVEL` | Optional | `info` | App log level |

Add only the keys you need for your chosen providers. Keep secrets out of version control.

## **Local Development (Backend)**

1. Clone the repository:

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd repo-name  # or the folder you cloned into
```

2. Create and activate a virtual environment (Windows example):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` in the repository root and add required environment variables (see above).

5. Run the development server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## **Local Development (Frontend)**

1. Change into the frontend folder:

```bash
cd frontend
```

2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Open the frontend at the address printed by `next dev` (often `http://localhost:3000`). Ensure `NEXT_PUBLIC_API_URL` points to your backend.

## **API Endpoints (Summary)**

| Endpoint | Method | Description |
|---|---:|---|
| `/` | GET | Health/info endpoint; basic check |
| `/health` | GET | Health check returning `status: healthy` |
| `/upload` | POST | Upload a PDF file (multipart form). Returns `session_id` and text length. |
| `/summarize` | POST | Generate a summary for a `session_id` (body: `{ "session_id": "..." }`). |
| `/audio-overview` | POST | Generate an audio overview for a `session_id` (returns audio URL). |
| `/audio-podcast` | POST | Generate podcast audio and script for a `session_id`. |
| `/transcript` | POST | Retrieve generated podcast script for a `session_id`. |
| `/convert-pdf-to-docx` | POST | Convert an uploaded PDF to DOCX and return the file. |
| `/ppt-outline` | POST | Generate PPT slide outlines for a `session_id`. |
| `/download-ppt` | POST | Generate and download PPTX file for a `session_id`. |
| `/chat` | POST | RAG-based chat using the ingested PDF content (body: `{ "query": "..." }`). |

Example: Upload a file with `curl`:

```bash
curl -X POST "http://localhost:8000/upload" -F "file=@/path/to/your.pdf"
```

Example: Summarize a session:

```bash
curl -X POST "http://localhost:8000/summarize" -H "Content-Type: application/json" -d '{"session_id":"<session-id>"}'
```

## **Running Tests**

There are no test cases included by default. To add tests, create a `tests/` folder and use `pytest` or similar. You can install `pytest` and run `pytest` from the repo root.

## **Deployment Notes**

- Backend: Deploy any ASGI-compatible host (e.g., Uvicorn/Gunicorn on a VM, containerize with Docker, or use serverless platforms that support ASGI). Ensure your environment variables are configured securely.
- Frontend: Can be deployed to Vercel, Netlify, or any static host that supports Next.js builds. Configure `NEXT_PUBLIC_API_URL` in the deployment environment.
- Pinecone and GenAI credentials should be provisioned in the deployment environment's secret management.

## **Contributing**

- Fork the repo and create a branch for your feature or fix.
- Open a PR describing the change and include tests where appropriate.

## **Troubleshooting & Tips**

- If you get errors on Pinecone initialization, verify `PINECONE_API_KEY`, `PINECONE_ENV`, and that the index exists.
- If LLM calls fail, check API key validity and quota limits for your chosen provider.
- For large PDFs, consider increasing timeouts or chunking ingestion; the project uses lazy model loading to reduce memory footprint.

## **License**

This project does not include a license file by default. Add a `LICENSE` at the repo root if you wish to declare one (e.g., MIT, Apache-2.0).

## **Contact / Maintainers**

- Project lead: *Anuska Basak(anuskabasak42@gmail.com)*

----

