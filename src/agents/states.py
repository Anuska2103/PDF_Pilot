from typing import TypedDict, Annotated, List, Optional, Dict, Any

class GraphState(TypedDict, total=False):
    pdf_text: Optional[str]
    summary_text: Optional[str]
    audio_path: Optional[str]
    ppt_outline: Optional[List[Dict[str, Any]]]
    ppt_file_path: Optional[str]
    user_query: Optional[str]
    chat_response: Optional[str]
    suggested_questions: Optional[List[str]]
    next_step: Optional[str]
    script: Optional[str]