import os
from dotenv import load_dotenv
from google import genai
from schemas import ReceiptExtractResponse

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY is missing.")

client = genai.Client(api_key=api_key)

def extract_receipt_with_gemini(image_bytes: bytes, mime_type: str) -> ReceiptExtractResponse:
    prompt = (
        "Extract structured receipt data from this bill image. "
        "Extract every itemized line item along with its price. "
        "Calculate the sum and compare it with the total payable amount. "
        "If numbers are unreadable, cut off, or handwritten totals contradict items, set is_doubtful to True.",
        "If numbers are unreadable, cut off, or handwritten totals contradict items, set is_doubtful to True."
    )

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=[
            genai.types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ],
        config={
            "response_mime_type": "application/json",
            "response_schema": ReceiptExtractResponse,
        }
    )
    return ReceiptExtractResponse.model_validate_json(response.text)

def validate_math_consistency(data: ReceiptExtractResponse) -> str:
    """Checks whether the extracted items match the final total."""
    if data.is_doubtful:
        return "NEEDS_REVIEW"
        
    if data.items:
        items_sum = sum(item.price for item in data.items)
        expected_total = items_sum + (data.tax_amount or 0.0)
        if abs(expected_total - data.total_amount) > 1.5:
            return "NEEDS_REVIEW"

    return "CONFIRMED"