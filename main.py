from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
# from src.agents.graph import ingest_graph, summarize_graph, audio_graph, chat_graph, script_graph, podcast_graph, ppt_graph, ppt_download_graph
from src.tools.database import init_pinecone_index
from src.tools.pdf_utils import convert_pdf_to_docx
from pydantic import BaseModel
from contextlib import asynccontextmanager
from pypdf import PdfReader
import io
import os
import uvicorn
import uuid
from typing import Dict, Optional, List



graphs = {}

def load_graphs():
    """Lazy load AI models only when needed to save memory"""
    if not graphs:
        print("🔄 Loading AI models...")
        from src.agents.graph import (
            ingest_graph, summarize_graph, audio_graph, chat_graph,
            script_graph, podcast_graph, ppt_graph, ppt_download_graph
        )
        
        graphs["ingest"] = ingest_graph
        graphs["summarize"] = summarize_graph
        graphs["audio"] = audio_graph
        graphs["chat"] = chat_graph
        graphs["script"] = script_graph
        graphs["podcast"] = podcast_graph
        graphs["ppt"] = ppt_graph
        graphs["ppt_download"] = ppt_download_graph
        print("✅ AI models loaded")
    return graphs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Only initialize lightweight components at startup
    print("🚀 Starting PDF Bot API...")
    
    # Initialize Pinecone (lightweight)
    from src.tools.database import init_pinecone_index
    init_pinecone_index()
    print("✅ Pinecone initialized")
    
    # Don't load heavy AI models here - load them lazily when needed
    print("✅ App ready - AI models will load on first request")

    yield   # ---- APP STARTS SERVING HERE ----

    print("🔄 Shutting down")

app = FastAPI(
    title="PDF Bot API",
    description="AI-powered PDF processing with chat, summarization, and presentation generation",
    version="1.0.0",
    lifespan=lifespan
)
# init_pinecone_index()


session_store: Dict[str, Dict] = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("assets", exist_ok=True)
app.mount("/static", StaticFiles(directory="assets"), name="static")

# Request/Response Models
class ChatRequest(BaseModel):
    query: str

class SummarizeRequest(BaseModel):
    session_id: str

class AudioOverviewRequest(BaseModel):
    session_id: str

class UploadResponse(BaseModel):
    session_id: str
    message: str
    text_length: int

class SummarizeResponse(BaseModel):
    session_id: str
    summary: str

class AudioOverviewResponse(BaseModel):
    session_id: str
    audio_url: str

class PodcastResponse(BaseModel):
    session_id: str
    audio_url: str
    script: str

class TranscriptRequest(BaseModel):
    session_id: str

class TranscriptResponse(BaseModel):
    session_id: str
    script: str

class PPTOutlineRequest(BaseModel):
    session_id: str

class SlideData(BaseModel):
    slide_number: int
    title: str
    caption: str
    bullets: List[str]

class PPTOutlineResponse(BaseModel):
    session_id: str
    slides: List[SlideData]

class DownloadPPTRequest(BaseModel):
    session_id: str

# ========== HEALTH CHECK ENDPOINTS ==========
@app.get("/")
async def root():
    return {
        "message": "PDF Bot API", 
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ========== ENDPOINT 1: /upload ==========
@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    
    
    pdf_data = await file.read()
    reader = PdfReader(io.BytesIO(pdf_data))
    
    if reader.is_encrypted:
        try:
            reader.decrypt("") 
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF is password protected: {str(e)}")
    
    extracted_text = ""
    for page in reader.pages:
        extracted_text += page.extract_text()
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No text content found in PDF")
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Store PDF content and ingest to Pinecone in background
    session_store[session_id] = {
        "pdf_text": extracted_text,
        "filename": file.filename
    }
    
    # Asynchronously ingest to Pinecone for RAG
    graphs = load_graphs()
    ingest_result = graphs["ingest"].invoke({"pdf_text": extracted_text})
    
    return UploadResponse(
        session_id=session_id,
        message=f"PDF '{file.filename}' uploaded successfully",
        text_length=len(extracted_text)
    )

# ========== ENDPOINT 2: /summarize ==========
@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    
    # Retrieve session data
    if request.session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    session_data = session_store[request.session_id]
    pdf_text = session_data.get("pdf_text")
    
    if not pdf_text:
        raise HTTPException(status_code=400, detail="No PDF text found in session")
    
    # Invoke summarizer agent
    graphs = load_graphs()
    summary_result = graphs["summarize"].invoke({"pdf_text": pdf_text})
    summary_text = summary_result.get("summary_text", "")
    
    # Store summary in session state for audio generation
    session_store[request.session_id]["summary_text"] = summary_text
    
    return SummarizeResponse(
        session_id=request.session_id,
        summary=summary_text
    )

# ========== ENDPOINT 3: /audio-overview ==========
@app.post("/audio-overview", response_model=AudioOverviewResponse)
async def audio_overview(request: AudioOverviewRequest):
    
    # Retrieve session data
    if request.session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    session_data = session_store[request.session_id]
    summary_text = session_data.get("summary_text")
    
    if not summary_text:
        raise HTTPException(
            status_code=400, 
            detail="No summary found. Please call /summarize endpoint first."
        )
    
    # Invoke audio generation agent
    graphs = load_graphs()
    audio_result = graphs["audio"].invoke({"summary_text": summary_text})
    audio_path = audio_result.get("audio_path", "")
    
    # Store audio path in session
    session_store[request.session_id]["audio_path"] = audio_path
    
    return AudioOverviewResponse(
        session_id=request.session_id,
        audio_url=f"/static/{os.path.basename(audio_path)}"
    )


# ========== ENDPOINT 4: /audio-podcast ==========
@app.post("/audio-podcast", response_model=PodcastResponse)
async def audio_podcast(request: AudioOverviewRequest):
   
    # Retrieve session data
    if request.session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    session_data = session_store[request.session_id]
    pdf_text = session_data.get("pdf_text")
    
    if not pdf_text:
        raise HTTPException(status_code=400, detail="No PDF text found in session")
    
    #  Generate podcast script
    graphs = load_graphs()
    script_result = graphs["script"].invoke({"pdf_text": pdf_text})
    script = script_result.get("script", "")
    
    if not script:
        raise HTTPException(status_code=500, detail="Failed to generate podcast script")
    
    # Generate audio from script with two different voices
    audio_result = graphs["podcast"].invoke({"script": script})
    audio_path = audio_result.get("audio_path", "")
    
    # Store both audio path and script in session
    session_store[request.session_id]["podcast_audio_path"] = audio_path
    session_store[request.session_id]["podcast_script"] = script
    
    return PodcastResponse(
        session_id=request.session_id,
        audio_url=f"/static/{os.path.basename(audio_path)}",
        script=script
    )


# ========== ENDPOINT 5: /transcript ==========
@app.post("/transcript", response_model=TranscriptResponse)
async def get_transcript(request: TranscriptRequest):
   
    # Retrieve session data
    if request.session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    session_data = session_store[request.session_id]
    script = session_data.get("podcast_script")
    
    if not script:
        raise HTTPException(
            status_code=400,
            detail="No podcast script found. Please call /audio-podcast endpoint first."
        )
    
    return TranscriptResponse(
        session_id=request.session_id,
        script=script
    )


# ========== ENDPOINT 6: /convert-pdf-to-docx ========== 
@app.post("/convert-pdf-to-docx")
async def convert_pdf_to_docx_endpoint(file: UploadFile = File(...)):
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    pdf_bytes = await file.read()
    try:
        docx_path = convert_pdf_to_docx(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    filename = file.filename.rsplit('.', 1)[0] + ".docx"
    return FileResponse(docx_path, filename=filename, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@app.post("/ppt-outline", response_model=PPTOutlineResponse)
async def ppt_outline(request: PPTOutlineRequest):
    
    # Retrieve session data
    if request.session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    session_data = session_store[request.session_id]
    summary_text = session_data.get("summary_text")
    
    if not summary_text:
        raise HTTPException(
            status_code=400, 
            detail="No summary found. Please call /summarize endpoint first."
        )
    
    # Invoke PPT outline generation
    graphs = load_graphs()
    ppt_result = graphs["ppt"].invoke({"summary_text": summary_text})
    ppt_outline_data = ppt_result.get("ppt_outline", [])
    
    # Convert to SlideData objects
    slides = [SlideData(**slide) for slide in ppt_outline_data]
    
    # Store outline in session for download endpoint
    session_store[request.session_id]["ppt_outline"] = ppt_outline_data
    
    return PPTOutlineResponse(
        session_id=request.session_id,
        slides=slides
    )


@app.post("/download-ppt")
async def download_ppt(request: DownloadPPTRequest):
    

    # Retrieve session data
    if request.session_id not in session_store:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    session_data = session_store[request.session_id]
    ppt_outline = session_data.get("ppt_outline")
    
    if not ppt_outline:
        raise HTTPException(
            status_code=400,
            detail="No PPT outline found. Please call /ppt-outline endpoint first."
        )
    
    # Use the PPT download graph to generate the file
    graphs = load_graphs()
    ppt_result = graphs["ppt_download"].invoke({"ppt_outline": ppt_outline})
    ppt_file_path = ppt_result.get("ppt_file_path")
    
    if not ppt_file_path or not os.path.exists(ppt_file_path):
        raise HTTPException(status_code=500, detail="Failed to generate PPT file")
    
    # Return the file for download
    filename = f"PDF_Summary_Presentation.pptx"
    return FileResponse(
        ppt_file_path, 
        filename=filename, 
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
# ========== EXISTING CHAT ENDPOINT ==========
@app.post("/chat")
async def chat(request: ChatRequest):
    """RAG-based chat endpoint using Pinecone vectorstore."""
    graphs = load_graphs()
    result = graphs["chat"].invoke({"user_query": request.query})
    return {"response": result.get("chat_response", "No response generated")}


