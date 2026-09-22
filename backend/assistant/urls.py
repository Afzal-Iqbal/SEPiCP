from django.urls import path
from .views import AskAssistantView, ValidateKeyView

urlpatterns = [
    path('ask/', AskAssistantView.as_view(), name='ask-assistant'),
    path('validate-key/', ValidateKeyView.as_view(), name='validate-key'),
]

