from langgraph.graph import StateGraph, END
from src.agents.states import GraphState
from src.agents.nodes import (
    ingest_to_pinecone_node, 
    summarize_pdf_node, 
    generate_tts_node, 
    generate_suggestions_node,
    rag_chat_node,
    ppt_outline_node,
    generate_script_node,
    generate_tts_script_node,
    generate_ppt_file_node
)

# Create separate graphs for different workflows

# 1. Ingest workflow - Store PDF chunks in Pinecone
ingest_workflow = StateGraph(GraphState)
ingest_workflow.add_node("ingest", ingest_to_pinecone_node)
ingest_workflow.set_entry_point("ingest")
ingest_workflow.add_edge("ingest", END)
ingest_graph = ingest_workflow.compile()

# 2. Summarize workflow - Generate summary from PDF text
summarize_workflow = StateGraph(GraphState)
summarize_workflow.add_node("summarize", summarize_pdf_node)
summarize_workflow.set_entry_point("summarize")
summarize_workflow.add_edge("summarize", END)
summarize_graph = summarize_workflow.compile()

# 3. Audio generation workflow - Convert summary to audio
audio_workflow = StateGraph(GraphState)
audio_workflow.add_node("tts", generate_tts_node)
audio_workflow.set_entry_point("tts")
audio_workflow.add_edge("tts", END)
audio_graph = audio_workflow.compile()

# 4. script genration workflow-generating script for podcast
script_workflow=StateGraph(GraphState)
script_workflow.add_node("script", generate_script_node)
script_workflow.set_entry_point("script")
script_workflow.add_edge("script", END)
script_graph=script_workflow.compile()


# 5 . podcaast audio generationn workflow
podcast_workflow=StateGraph(GraphState)
podcast_workflow.add_node("tts_podcast", generate_tts_script_node)
podcast_workflow.set_entry_point("tts_podcast")
podcast_workflow.add_edge("tts_podcast", END)
podcast_graph = podcast_workflow.compile()

# 6. Suggestions workflow - Generate questions
suggestions_workflow = StateGraph(GraphState)
suggestions_workflow.add_node("suggestions", generate_suggestions_node)
suggestions_workflow.set_entry_point("suggestions")
suggestions_workflow.add_edge("suggestions", END)
suggestions_graph = suggestions_workflow.compile()

# 7. Chat workflow - RAG chat
chat_workflow = StateGraph(GraphState)
chat_workflow.add_node("chat", rag_chat_node)
chat_workflow.set_entry_point("chat")
chat_workflow.add_edge("chat", END)
chat_graph = chat_workflow.compile()

# 8. PPT workflow - PPT generation
ppt_workflow = StateGraph(GraphState)
ppt_workflow.add_node("ppt", ppt_outline_node)
ppt_workflow.set_entry_point("ppt")
ppt_workflow.add_edge("ppt", END)
ppt_graph = ppt_workflow.compile()

# 9. PPT Download workflow - Generate actual PPTX file
ppt_download_workflow = StateGraph(GraphState)
ppt_download_workflow.add_node("generate_ppt_file", generate_ppt_file_node)
ppt_download_workflow.set_entry_point("generate_ppt_file")
ppt_download_workflow.add_edge("generate_ppt_file", END)
ppt_download_graph = ppt_download_workflow.compile()

# full upload workflow (for backward compatibility)
upload_workflow = StateGraph(GraphState)
upload_workflow.add_node("ingest", ingest_to_pinecone_node)
upload_workflow.add_node("summarize", summarize_pdf_node)
upload_workflow.add_node("tts", generate_tts_node)
upload_workflow.add_node("script",generate_script_node)
upload_workflow.add_node("tts_podcast", generate_tts_script_node)
upload_workflow.add_node("suggestions", generate_suggestions_node)

upload_workflow.set_entry_point("ingest")
upload_workflow.add_edge("ingest", "summarize")
upload_workflow.add_edge("summarize", "tts")
upload_workflow.add_edge("tts", "suggestions")
upload_workflow.add_edge("summarize", "suggestions")
upload_workflow.add_edge("ingest", "script")
upload_workflow.add_edge("script", "tts_podcast")
upload_workflow.add_edge("suggestions", END)

upload_graph = upload_workflow.compile()
app_graph = upload_graph