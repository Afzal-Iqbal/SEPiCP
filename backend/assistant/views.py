from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import AskRequestSerializer, AskResponseSerializer, ValidateKeySerializer
from rag_pipeline.graph import graph
from rag_pipeline.nodes import get_llm

def _sanitize_llm_error(err: Exception) -> str:

    msg = str(err)
    if "API_KEY_INVALID" in msg or "API key not valid" in msg or "Incorrect API key" in msg or "invalid_api_key" in msg:
        return "Invalid API Key. Please double check the key provided."
    if "404" in msg or "not found" in msg.lower() or "model_not_found" in msg.lower():
        return "Selected model name not found or not supported on this key."
    if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "rate limit" in msg.lower():
        return "API Rate limit exceeded. Please wait a moment or check your key quota."
    return msg[:200]

class AskAssistantView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        req_serializer = AskRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)
        question = req_serializer.validated_data["question"]
        user_api_key = req_serializer.validated_data.get("api_key", "").strip()
        provider = req_serializer.validated_data.get("provider", "gemini").strip().lower() or "gemini"
        model_name = req_serializer.validated_data.get("model_name", "").strip()

        initial_state = {
            "question": question,
            # Only pass api_key if it's a non-empty string; otherwise leave it
            # absent so _get_api_key() cleanly falls back to .env defaults.
            **({"api_key": user_api_key} if user_api_key else {}),
            "provider": provider,
            "model_name": model_name,
            "chunks": [],
            "max_similarity": 0.0,
            "refused": False,
            "answer": "",
            "citations": [],
            "suggested_topics": [],
            "verification_passed": False,
            "retry_count": 0
        }

        try:
            result = graph.invoke(initial_state)
            response_data = {
                "answer": result.get("answer", ""),
                "citations": result.get("citations", []),
                "suggested_topics": result.get("suggested_topics", []),
                "refused": result.get("refused", False)
            }
            return Response(AskResponseSerializer(response_data).data, status=status.HTTP_200_OK)
        except Exception as e:
            clean_err = _sanitize_llm_error(e)
            return Response(
                {"error": f"Request failed: {clean_err}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class ValidateKeyView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ValidateKeySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = (serializer.validated_data.get("provider", "gemini").strip().lower() or "gemini")
        api_key = serializer.validated_data.get("api_key", "").strip()
        model_name = serializer.validated_data.get("model_name", "").strip()

        state = {
            "provider": provider,
            # Only include api_key if the user actually provided one
            **({ "api_key": api_key } if api_key else {}),
            "model_name": model_name
        }

        try:
            llm = get_llm(state)
            res = llm.invoke("Test connection. Answer with 'OK'.")
            return Response({
                "valid": True,
                "message": f"Successfully verified {provider.upper()} key with model '{model_name or 'default'}'.",
                "sample_output": str(res.content)[:50]
            }, status=status.HTTP_200_OK)
        except Exception as e:
            clean_err = _sanitize_llm_error(e)
            return Response({
                "valid": False,
                "error": f"Validation failed: {clean_err}"
            }, status=status.HTTP_200_OK)


