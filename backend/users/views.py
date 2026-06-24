# from django.shortcuts import render
# from rest_framework.decorators import api_view
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework import status
from .models import Dataset
from .serializers import RegisterSerializer, UserSerializer, DatasetSerializer      
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from .services.cleaning_service import clean_dataset
from .services.analysis.regression_service import perform_regression_analysis
from .services.analysis.pca_service import perform_pca_analysis
from .services.analysis.basic_analysis_service import perform_basic_analysis
from .models import AnalysisResult

User = get_user_model()


#CreateAPIView internally does 
# serializer = RegisterSerializer(data=request.data)
# if serializer.is_valid():
#     serializer.save()
# else:
#     return serializer.errors

# 1️⃣ Register View
# class RegisterView(generics.CreateAPIView):
#     queryset = User.objects.all()
#     serializer_class = RegisterSerializer
class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response({
                "success": True,
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


# 2️⃣ Get Logged-in User Profile
class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# 3️⃣ Admin - View All Users
class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


# 4️⃣ Admin Dashboard Stats (Optional but Professional)
class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        admin_users = User.objects.filter(is_staff=True).count()

        return Response({
            "total_users": total_users,
            "admin_users": admin_users,
        })

import pandas as pd
import json

class UploadDatasetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        file = request.FILES.get("file")

        if not file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 🔥 Read Excel file
            df = pd.read_excel(file)

            # Convert to list of dicts (raw data)
            # original_data = df.to_dict(orient='records')
            original_data = json.loads(df.to_json(orient='records', date_format='iso'))

            # Clean data
            cleaned_data = clean_dataset(original_data)
            # cleaned_data = json.loads(df.to_json(orient='records', date_format='iso'))

            # Save to DB
            dataset = Dataset.objects.create(
                user=request.user,
                original_data=original_data,
                cleaned_data=cleaned_data
            )

            serializer = DatasetSerializer(dataset)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": "Processing failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class UserDatasetListView(generics.ListAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

class MultipleLinearRegressionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        independent_vars = request.data.get("independent_vars")
        dependent_var = request.data.get("dependent_var")
        data = request.data.get("data")
        missing_values = request.data.get("missing_values", "drop")

        if not all([independent_vars, dependent_var, data]):
            return Response({"error": "Missing required parameters: independent_vars, dependent_var, and data"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            results = perform_regression_analysis(independent_vars, dependent_var, data, missing_values)
            
            # Store in database
            AnalysisResult.objects.create(
                user=request.user,
                analysis_type='regression',
                input_params={
                    "independent_vars": independent_vars,
                    "dependent_var": dependent_var,
                    "missing_values": missing_values
                },
                output_results=results
            )

            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PCAAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.get("data")
        selected_columns = request.data.get("selected_columns")
        n_components = request.data.get("n_components")
        variance_threshold = request.data.get("variance_threshold")
        missing_values = request.data.get("missing_values", "drop")

        if not all([data, selected_columns]):
            return Response({"error": "Missing required parameters: data and selected_columns"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            results = perform_pca_analysis(
                data, 
                selected_columns, 
                n_components=n_components, 
                variance_threshold=variance_threshold, 
                missing_values=missing_values
            )

            # Store in database
            AnalysisResult.objects.create(
                user=request.user,
                analysis_type='pca',
                input_params={
                    "selected_columns": selected_columns,
                    "n_components": n_components,
                    "variance_threshold": variance_threshold,
                    "missing_values": missing_values
                },
                output_results=results
            )

            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BasicAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.get("data")

        if not data:
            return Response({"error": "Missing required parameter: data"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            results = perform_basic_analysis(data)

            # Store in database
            AnalysisResult.objects.create(
                user=request.user,
                analysis_type='basic',
                input_params={},
                output_results=results
            )

            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)