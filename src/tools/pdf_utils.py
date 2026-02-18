from langchain_text_splitters import RecursiveCharacterTextSplitter

# PDF to DOCX conversion
from pdf2docx import Converter
import tempfile
import os

def convert_pdf_to_docx(pdf_bytes: bytes) -> str:
    """
    Convert PDF bytes to a DOCX file using pdf2docx.
    Returns the path to the generated DOCX file (in a temp directory).
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(pdf_bytes)
        temp_pdf_path = temp_pdf.name
    temp_docx_path = temp_pdf_path.replace(".pdf", ".docx")
    cv = Converter(temp_pdf_path)
    cv.convert(temp_docx_path, start=0, end=None)
    cv.close()
    os.remove(temp_pdf_path)
    return temp_docx_path

def chunk_text(text: str):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=100
    )
    return text_splitter.split_text(text)