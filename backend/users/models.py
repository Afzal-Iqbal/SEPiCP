from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'user' 
        
    def __str__(self):
        return self.email

class Dataset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    original_data = models.JSONField()
    cleaned_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "datasets"
        
    def __str__(self):
        return f"Dataset {self.id} by {self.user.email}"
    

class AnalysisResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True)
    analysis_type = models.CharField(max_length=50) # 'regression' or 'pca'
    input_params = models.JSONField()
    output_results = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis_results"
        
    def __str__(self):
        return f"{self.analysis_type} result for {self.user.email} at {self.created_at}"