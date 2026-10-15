# pyrefly: ignore [missing-import]
from rest_framework import serializers

class AskRequestSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000, allow_blank=False)
    api_key = serializers.CharField(required=False, allow_blank=True, default="")
    provider = serializers.CharField(required=False, allow_blank=True, default="gemini")
    model_name = serializers.CharField(required=False, allow_blank=True, default="")

class ValidateKeySerializer(serializers.Serializer):
    provider = serializers.CharField(required=False, allow_blank=True, default="gemini")
    api_key = serializers.CharField(required=False, allow_blank=True, default="")
    model_name = serializers.CharField(required=False, allow_blank=True, default="")

class CitationSerializer(serializers.Serializer):
    marker = serializers.CharField()
    paper_title = serializers.CharField()
    page_number = serializers.IntegerField()
    section = serializers.CharField()

class AskResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    citations = CitationSerializer(many=True)
    suggested_topics = serializers.ListField(child=serializers.CharField(), required=False)
    refused = serializers.BooleanField()
