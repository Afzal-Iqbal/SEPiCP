# from django.shortcuts import render
# from rest_framework.decorators import api_view
# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework import status
from .models import Dataset, InstructorSurvey, StudentSurvey
from .serializers import RegisterSerializer, UserSerializer, DatasetSerializer, InstructorSurveySerializer, StudentSurveySerializer
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
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

import logging

logger = logging.getLogger(__name__)

class UploadDatasetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("file")
        json_data = request.data.get("data")
        sheet_name = request.data.get("sheet_name", 0)

        if file is None and not json_data:
            return Response(
                {"error": "No file or data uploaded, or dataset is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if file:
                # Read Excel file with specified sheet name if provided
                try:
                    df = pd.read_excel(file, sheet_name=sheet_name if sheet_name != 'sheet1' else 0)
                except Exception:
                    df = pd.read_excel(file, sheet_name=0)
                    
                # Standardize survey feature names for both instructor and student datasets
                col_rename = {}
                for i in range(1, 7):
                    col_rename[f'content_p_{i}'] = f'content_{i}'
                    col_rename[f'content_s_{i}'] = f'content_{i}'
                for i in range(1, 5):
                    col_rename[f'relevance_{i}p'] = f'relevance_{i}'
                    col_rename[f'relevance_{i}s'] = f'relevance_{i}'
                for i in range(1, 7):
                    col_rename[f'discuss_{i}p'] = f'discuss_{i}'
                    col_rename[f'discuss_{i}s'] = f'discuss_{i}'
                for i in range(1, 9):
                    col_rename[f'act_part_{i}p'] = f'act_part_{i}'
                    col_rename[f'act_part_{i}s'] = f'act_part_{i}'
                for i in range(1, 6):
                    col_rename[f'cls_org_{i}p'] = f'cls_org_{i}'
                    col_rename[f'cls_org_{i}s'] = f'cls_org_{i}'
                for i in range(1, 7):
                    col_rename[f'cncts_{i}p'] = f'cncts_{i}'
                    col_rename[f'cncts_{i}s'] = f'cncts_{i}'
                for i in range(1, 5):
                    col_rename[f'challenge_level_{i}p'] = f'challenge_level_{i}'
                    col_rename[f'challenge_level_{i}s'] = f'challenge_level_{i}'
                for i in range(1, 20):
                    col_rename[f'methods_p_{i}'] = f'methods_{i}'
                    col_rename[f'methods_s_{i}'] = f'methods_{i}'
                for i in [16, 17, 18]:
                    col_rename[f'methods_p_{i}_text'] = f'methods_{i}_text'
                    col_rename[f'methods_s_{i}_text'] = f'methods_{i}_text'

                # Metadata column corrections (name, university, etc.)
                col_rename['q1_name'] = 'name'
                col_rename['q2_university'] = 'university'
                col_rename['q108_email'] = 'email'
                col_rename['q109_location'] = 'location'
                col_rename['q3_semester'] = 'semester'
                col_rename['q4_course'] = 'course'
                col_rename['q111_degree_level'] = 'degree_level'
                col_rename['q104_student_count'] = 'student_count'
                col_rename['q105_class_format'] = 'class_format'
                col_rename['q107_1_online_pct'] = 'online_pct'
                col_rename['q6_role'] = 'role'
                col_rename['q6_2_text'] = 'professor_name'

                df.rename(columns=col_rename, inplace=True)
                original_data = json.loads(df.to_json(orient='records', date_format='iso'))
            else:
                original_data = json_data

            # Clean data using updated clean_dataset service
            cleaned_data = clean_dataset(original_data)

            # Save to DB
            dataset = Dataset.objects.create(
                user=request.user,
                original_data=original_data,
                cleaned_data=cleaned_data
            )

            serializer = DatasetSerializer(dataset)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Upload failed: {str(e)}", exc_info=True)
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


class UserDatasetDetailView(generics.RetrieveAPIView):
    serializer_class = DatasetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(user=self.request.user)

class MultipleLinearRegressionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        independent_vars = request.data.get("independent_vars")
        dependent_var = request.data.get("dependent_var")
        data = request.data.get("data")
        dataset_id = request.data.get("dataset_id")
        missing_values = request.data.get("missing_values", "drop")

        # Only fetch from DB if no data was provided in the request body.
        # dataset_id may be a course/survey ID (not a Dataset ID) when coming from course mode.
        if dataset_id and (not data or (isinstance(data, list) and len(data) == 0)):
            try:
                ds = Dataset.objects.get(id=dataset_id, user=request.user)
                data = ds.cleaned_data or ds.original_data
            except Dataset.DoesNotExist:
                pass  # dataset_id was a course id — data must be in request body

        if isinstance(data, str):
            try:
                data = json.loads(data)
            except Exception:
                pass

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
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PCAAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.get("data")
        dataset_id = request.data.get("dataset_id")
        selected_columns = request.data.get("selected_columns")
        n_components = request.data.get("n_components")
        variance_threshold = request.data.get("variance_threshold")
        missing_values = request.data.get("missing_values", "drop")

        # Only fetch from DB if no data was provided in the request body.
        # dataset_id may be a course/survey ID (not a Dataset ID) when coming from course mode.
        if dataset_id and (not data or (isinstance(data, list) and len(data) == 0)):
            try:
                ds = Dataset.objects.get(id=dataset_id, user=request.user)
                data = ds.cleaned_data or ds.original_data
            except Dataset.DoesNotExist:
                pass  # dataset_id was a course id — data must be in request body

        if isinstance(data, str):
            try:
                data = json.loads(data)
            except Exception:
                pass

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
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class BasicAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.get("data")
        dataset_id = request.data.get("dataset_id")

        # Only fetch from DB if no data was provided in the request body.
        # dataset_id may be a course/survey ID (not a Dataset ID) when coming from course mode.
        if dataset_id and (not data or (isinstance(data, list) and len(data) == 0)):
            try:
                ds = Dataset.objects.get(id=dataset_id, user=request.user)
                data = ds.cleaned_data or ds.original_data
            except Dataset.DoesNotExist:
                pass  # dataset_id was a course id — data must be in request body

        if isinstance(data, str):
            try:
                data = json.loads(data)
            except Exception:
                pass

        if not data or not isinstance(data, list) or len(data) == 0:
            return Response({"error": "Missing required parameter: dataset contains no valid rows."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Apply column filter if selected_columns is provided
        selected_columns = request.data.get("selected_columns")
        if selected_columns and isinstance(selected_columns, list) and len(selected_columns) > 0:
            sel_set = {str(c).strip().lower() for c in selected_columns}
            filtered_data = []
            for row in data:
                if isinstance(row, dict):
                    filtered_row = {k: v for k, v in row.items() if str(k).strip().lower() in sel_set}
                    filtered_data.append(filtered_row)
                else:
                    filtered_data.append(row)
            data = filtered_data

        try:
            results = perform_basic_analysis(data)

            # Store in database
            input_params = {}
            if dataset_id:
                input_params["dataset_id"] = dataset_id
            if selected_columns:
                input_params["selected_columns"] = selected_columns

            AnalysisResult.objects.create(
                user=request.user,
                analysis_type='basic',
                input_params=input_params,
                output_results=results
            )

            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class TeacherDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response({'error': 'Forbidden'}, status=403)

        surveys = InstructorSurvey.objects.filter(teacher=request.user).order_by('-updated_at')
        data = []

        for survey in surveys:
            responses = survey.student_surveys.all()
            published  = responses.filter(is_published=True).count()
            saved      = responses.filter(is_published=False).count()

            from django.db.models import Avg
            avg_engage = responses.aggregate(
                avg=Avg('total_engage_score_s')
            )['avg']

            data.append({
                'id':                   survey.id,
                'course_code':          survey.course_code,
                'course_name':          survey.q4_course or 'Unnamed Course',
                'semester':             f"{survey.q3_semester} {getattr(survey, 'year', '')}".strip(),
                'status':               survey.status,
                'is_completed':         survey.status == InstructorSurvey.STATUS_PUBLISHED,
                'total_responses':      responses.count(),
                'published_responses':  published,
                'published_count':      published,
                'saved_responses':      saved,
                'avg_engagement':       round(avg_engage, 2) if avg_engage else None,
            })

        has_survey = surveys.exists()

        return Response({
            'has_survey': has_survey,
            'instructor_name': request.user.first_name or request.user.username,
            'instructor_email': request.user.email,
            'courses': data
        })

# ─────────────────────────────────────────────────────────────────────────────
# SURVEY VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class InstructorSurveyView(APIView):
    """GET list / POST create — teacher must be authenticated."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        surveys = InstructorSurvey.objects.filter(teacher=request.user).order_by('-created_at')
        return Response(InstructorSurveySerializer(surveys, many=True).data)

    def post(self, request):
        serializer = InstructorSurveySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(teacher=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InstructorSurveyDetailView(APIView):
    """GET one / PATCH update — teacher must own the survey."""
    permission_classes = [IsAuthenticated]

    def _get_survey(self, pk, user):
        try:
            return InstructorSurvey.objects.get(pk=pk, teacher=user)
        except InstructorSurvey.DoesNotExist:
            return None

    def get(self, request, pk):
        survey = self._get_survey(pk, request.user)
        if not survey:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(InstructorSurveySerializer(survey).data)

    def patch(self, request, pk):
        survey = self._get_survey(pk, request.user)
        if not survey:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InstructorSurveySerializer(survey, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublishInstructorSurveyView(APIView):
    """POST — set status=published and return the course_code."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            survey = InstructorSurvey.objects.get(pk=pk, teacher=request.user)
        except InstructorSurvey.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        survey.status = InstructorSurvey.STATUS_PUBLISHED
        survey.save()
        return Response({'message': 'Survey published.', 'course_code': survey.course_code})


class StudentSurveyLookupView(APIView):
    """GET ?course_code=XXXX — anonymous; returns teacher/course info for confirmation."""
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get('course_code', '').strip().upper()
        if not code:
            return Response({'error': 'course_code is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            survey = InstructorSurvey.objects.select_related('teacher').get(course_code=code)
        except InstructorSurvey.DoesNotExist:
            return Response({'error': 'Invalid course code. Check with your instructor.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'survey_id':       survey.id,
            'course_code':     survey.course_code,
            'instructor_name': survey.q1_name or survey.teacher.first_name or survey.teacher.username,
            'course_name':     survey.q4_course,
            'department':      survey.q2_university,
            'semester':        survey.q3_semester,
            'year':            getattr(survey, 'year', ''),
        })


class StudentSurveySubmitView(APIView):
    """POST — anonymous student submits survey; returns edit_token."""
    permission_classes = [AllowAny]

    def post(self, request):
        course_code = request.data.get('course_code', '').strip().upper()
        try:
            instructor_survey = InstructorSurvey.objects.get(
                course_code=course_code
            )
        except InstructorSurvey.DoesNotExist:
            return Response({'error': 'Invalid course code. Check with your instructor.'}, status=status.HTTP_404_NOT_FOUND)

        is_publishing = request.data.get('publish', False)

        # Strip course_code from data before passing to serializer
        data = {k: v for k, v in request.data.items() if k != 'course_code'}
        data['instructor_survey'] = instructor_survey.id
        data['is_published']      = is_publishing

        # Copy metadata fields from instructor survey
        data['q1_name'] = ""
        data['q108_email'] = ""
        data['q2_university'] = instructor_survey.q2_university or ""
        data['q109_location'] = instructor_survey.q109_location or ""
        data['q3_semester'] = instructor_survey.q3_semester or ""
        data['q3_4_text'] = instructor_survey.q3_4_text or ""
        data['q4_course'] = instructor_survey.q4_course or ""
        data['q111_degree_level'] = instructor_survey.q111_degree_level or ""
        data['q104_student_count'] = instructor_survey.q104_student_count
        data['q105_class_format'] = instructor_survey.q105_class_format or ""
        data['q107_1_online_pct'] = instructor_survey.q107_1_online_pct
        data['q6_2_text'] = instructor_survey.q1_name or ""  # professor name
        data['q6_role'] = 'Student'
        data['year'] = getattr(instructor_survey, 'year', '') or ""

        serializer = StudentSurveySerializer(data=data)
        if serializer.is_valid():
            instance = serializer.save(instructor_survey=instructor_survey)
            return Response({
                'message':    'Survey submitted.',
                'id':           instance.id,
                'edit_token': str(instance.edit_token),
                'is_published': instance.is_published,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentSurveyEditView(APIView):
    """GET / PUT — retrieve or update a student submission via edit_token."""
    permission_classes = [AllowAny]
    def get(self, request, token):
        try:
            survey = StudentSurvey.objects.select_related('instructor_survey__teacher').get(edit_token=token)
        except (StudentSurvey.DoesNotExist, ValueError):
            return Response({'error': 'Invalid or expired edit token.'}, status=status.HTTP_404_NOT_FOUND)

        if survey.is_published:
            return Response({'error': 'This response has been published and cannot be edited.'}, status=status.HTTP_403_FORBIDDEN)

        data = StudentSurveySerializer(survey).data
        data['course_name'] = survey.instructor_survey.q4_course
        data['instructor_name'] = survey.instructor_survey.q1_name or survey.instructor_survey.teacher.first_name or survey.instructor_survey.teacher.username
        return Response(data)

    def put(self, request, token):
        try:
            survey = StudentSurvey.objects.get(edit_token=token)
        except (StudentSurvey.DoesNotExist, ValueError):
            return Response({'error': 'Invalid edit token.'}, status=status.HTTP_404_NOT_FOUND)

        if survey.is_published:
            return Response({'error': 'Published responses cannot be edited.'}, status=status.HTTP_403_FORBIDDEN)

        is_publishing = request.data.get('publish', False)
        serializer = StudentSurveySerializer(survey, data=request.data, partial=True)
        
        if serializer.is_valid():
            instance = serializer.save()
            if is_publishing:
                instance.is_published = True
                instance.save(update_fields=['is_published'])
            return Response({
                'id':           instance.id,
                'edit_token':   str(instance.edit_token),
                'is_published': instance.is_published,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSurveyListView(APIView):
    """GET — admin sees all surveys grouped by teacher with completion metrics."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        surveys = InstructorSurvey.objects.select_related('teacher').all().order_by('-created_at')
        
        teachers_map = {}
        for s in surveys:
            t = s.teacher
            t_id = t.id
            if t_id not in teachers_map:
                teachers_map[t_id] = {
                    'teacher_id': t_id,
                    'teacher_email': t.email,
                    'teacher_name': t.first_name or t.username,
                    'surveys': []
                }
            
            completed_students = s.student_surveys.filter(is_published=True).count()
            uncompleted_students = s.student_surveys.filter(is_published=False).count()
            
            teachers_map[t_id]['surveys'].append({
                'id': s.id,
                'course_code': s.course_code,
                'course_name': s.q4_course or 'Unnamed Course',
                'semester': s.q3_semester,
                'year': getattr(s, 'year', ''),
                'status': s.status,
                'instructor_completed': s.status == InstructorSurvey.STATUS_PUBLISHED,
                'completed_student_count': completed_students,
                'uncompleted_student_count': uncompleted_students,
                'saved_student_count': uncompleted_students
            })
            
        return Response(list(teachers_map.values()))


class AdminSurveyDetailView(APIView):
    """GET — Retrieve complete instructor survey answers and listing of student responses."""
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            survey = InstructorSurvey.objects.select_related('teacher').get(pk=pk)
        except InstructorSurvey.DoesNotExist:
            return Response({'error': 'Survey not found'}, status=status.HTTP_404_NOT_FOUND)

        student_responses = survey.student_surveys.all().order_by('-submitted_at')
        
        return Response({
            'instructor_survey': InstructorSurveySerializer(survey).data,
            'students_completed': StudentSurveySerializer(student_responses.filter(is_published=True), many=True).data,
            'students_drafts': StudentSurveySerializer(student_responses.filter(is_published=False), many=True).data,
        })


import pandas as pd
import io
# pyrefly: ignore [missing-import]
from django.http import HttpResponse

class AdminSurveyExportView(APIView):
    """GET — Export all survey responses or specific course responses as an Excel file with distinct sheets."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            export_type = request.GET.get('type', 'all')
            course_id   = request.GET.get('course_id')

            # Standardize survey feature names for both instructor and student datasets
            col_rename = {}
            for i in range(1, 7):
                col_rename[f'content_p_{i}'] = f'content_{i}'
                col_rename[f'content_s_{i}'] = f'content_{i}'
            for i in range(1, 5):
                col_rename[f'relevance_{i}p'] = f'relevance_{i}'
                col_rename[f'relevance_{i}s'] = f'relevance_{i}'
            for i in range(1, 7):
                col_rename[f'discuss_{i}p'] = f'discuss_{i}'
                col_rename[f'discuss_{i}s'] = f'discuss_{i}'
            for i in range(1, 9):
                col_rename[f'act_part_{i}p'] = f'act_part_{i}'
                col_rename[f'act_part_{i}s'] = f'act_part_{i}'
            for i in range(1, 6):
                col_rename[f'cls_org_{i}p'] = f'cls_org_{i}'
                col_rename[f'cls_org_{i}s'] = f'cls_org_{i}'
            for i in range(1, 7):
                col_rename[f'cncts_{i}p'] = f'cncts_{i}'
                col_rename[f'cncts_{i}s'] = f'cncts_{i}'
            for i in range(1, 5):
                col_rename[f'challenge_level_{i}p'] = f'challenge_level_{i}'
                col_rename[f'challenge_level_{i}s'] = f'challenge_level_{i}'
            for i in range(1, 20):
                col_rename[f'methods_p_{i}'] = f'methods_{i}'
                col_rename[f'methods_s_{i}'] = f'methods_{i}'
            for i in [16, 17, 18]:
                col_rename[f'methods_p_{i}_text'] = f'methods_{i}_text'
                col_rename[f'methods_s_{i}_text'] = f'methods_{i}_text'

            # Metadata column corrections (name, university, etc.)
            col_rename['q1_name'] = 'name'
            col_rename['q2_university'] = 'university'
            col_rename['q108_email'] = 'email'
            col_rename['q109_location'] = 'location'
            col_rename['q3_semester'] = 'semester'
            col_rename['q4_course'] = 'course'
            col_rename['q111_degree_level'] = 'degree_level'
            col_rename['q104_student_count'] = 'student_count'
            col_rename['q105_class_format'] = 'class_format'
            col_rename['q107_1_online_pct'] = 'online_pct'
            col_rename['q6_role'] = 'role'
            col_rename['q6_2_text'] = 'professor_name'

            if course_id:
                survey = InstructorSurvey.objects.get(pk=course_id)
                filename = f'course_{survey.course_code}_{export_type}_responses.xlsx'
                buffer = io.BytesIO()

                with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                    if export_type in ['instructor', 'all']:
                        inst_data = list(InstructorSurvey.objects.filter(id=course_id).values())
                        if inst_data:
                            df_inst = pd.DataFrame(inst_data)
                            df_inst.rename(columns=col_rename, inplace=True)
                            records_json = df_inst.to_json(orient='records', date_format='iso')
                            cleaned_inst = clean_dataset(json.loads(records_json))
                            df_inst_clean = pd.DataFrame(cleaned_inst)
                        else:
                            df_inst_clean = pd.DataFrame([{"Notice": "No instructor response found"}])
                        df_inst_clean.to_excel(writer, sheet_name='Instructor_Evaluation', index=False)

                    if export_type in ['student', 'all']:
                        stud_data = list(StudentSurvey.objects.filter(instructor_survey_id=course_id, is_published=True).values())
                        if stud_data:
                            df_stud = pd.DataFrame(stud_data)
                            df_stud.rename(columns=col_rename, inplace=True)
                            records_json = df_stud.to_json(orient='records', date_format='iso')
                            cleaned_stud = clean_dataset(json.loads(records_json))
                            df_stud_clean = pd.DataFrame(cleaned_stud)
                        else:
                            df_stud_clean = pd.DataFrame([{"Notice": "No student responses collected yet"}])
                        df_stud_clean.to_excel(writer, sheet_name='Student_Responses', index=False)

                buffer.seek(0)
                response = HttpResponse(
                    buffer.read(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response

            if export_type == 'instructor':
                data = InstructorSurvey.objects.filter(status='published').values()
                df = pd.DataFrame(list(data))
                if df.empty:
                    df = pd.DataFrame(columns=["id", "teacher_id", "course_code"])
                filename = 'instructor_responses.xlsx'
                sheet = 'Instructors'
            elif export_type == 'student':
                data = StudentSurvey.objects.filter(is_published=True).values()
                df = pd.DataFrame(list(data))
                if df.empty:
                    df = pd.DataFrame(columns=["id", "course_code"])
                filename = 'student_responses.xlsx'
                sheet = 'Students'
            else:
                return Response({"error": "Invalid or missing type parameter"}, status=status.HTTP_400_BAD_REQUEST)

            df.rename(columns=col_rename, inplace=True)
            records_json = df.to_json(orient='records', date_format='iso')
            cleaned_data = clean_dataset(json.loads(records_json))
            df_clean = pd.DataFrame(cleaned_data)

            # Convert timezone-aware datetimes to timezone-unaware
            for col in df_clean.columns:
                if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
                    df_clean[col] = df_clean[col].dt.tz_localize(None)

            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df_clean.to_excel(writer, sheet_name=sheet, index=False)

            buffer.seek(0)
            
            response = HttpResponse(
                buffer.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response(
                {"error": f"Failed to export surveys: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminSurveyToDatasetView(APIView):
    """POST — Retrieve surveys as raw data to populate the Upload / Analysis table."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            convert_type = request.GET.get('type')
            course_id = request.GET.get('course_id')

            if not convert_type and not course_id:
                return Response({"error": "Missing type or course_id parameter"}, status=status.HTTP_400_BAD_REQUEST)
                
            dataset = None
            course_obj = InstructorSurvey.objects.filter(id=course_id).first() if course_id else None
            course_prefix = f"Course {course_obj.course_code} - " if course_obj else ""

            if course_id:
                if convert_type == 'instructor':
                    query_data = InstructorSurvey.objects.filter(id=course_id).values()
                    name = f"{course_prefix}Instructor Responses"
                elif convert_type == 'instructor_student':
                    inst = list(InstructorSurvey.objects.filter(id=course_id).values())
                    stud = list(StudentSurvey.objects.filter(instructor_survey_id=course_id, is_published=True).values())
                    query_data = inst + stud
                    name = f"{course_prefix}Combined Responses"
                else:
                    query_data = StudentSurvey.objects.filter(instructor_survey_id=course_id, is_published=True).values()
                    name = f"{course_prefix}Student Responses"
                df = pd.DataFrame(list(query_data))
            elif convert_type == 'instructor':
                instructors = InstructorSurvey.objects.filter(status='published').values()
                df = pd.DataFrame(list(instructors))
                name = "Instructor Responses (Auto-Generated)"
                desc = "Imported from published instructor surveys."
            elif convert_type == 'student':
                students = StudentSurvey.objects.filter(is_published=True).values()
                df = pd.DataFrame(list(students))
                name = "Student Responses (Auto-Generated)"
                desc = "Imported from published student surveys."
            else:
                return Response({"error": "Invalid type parameter"}, status=status.HTTP_400_BAD_REQUEST)

            if df.empty:
                return Response({"error": "No response data found for the selected course/type"}, status=status.HTTP_404_NOT_FOUND)

            # Standardize survey feature names for both instructor and student datasets
            col_rename = {}
            for i in range(1, 7):
                col_rename[f'content_p_{i}'] = f'content_{i}'
                col_rename[f'content_s_{i}'] = f'content_{i}'
            for i in range(1, 5):
                col_rename[f'relevance_{i}p'] = f'relevance_{i}'
                col_rename[f'relevance_{i}s'] = f'relevance_{i}'
            for i in range(1, 7):
                col_rename[f'discuss_{i}p'] = f'discuss_{i}'
                col_rename[f'discuss_{i}s'] = f'discuss_{i}'
            for i in range(1, 9):
                col_rename[f'act_part_{i}p'] = f'act_part_{i}'
                col_rename[f'act_part_{i}s'] = f'act_part_{i}'
            for i in range(1, 6):
                col_rename[f'cls_org_{i}p'] = f'cls_org_{i}'
                col_rename[f'cls_org_{i}s'] = f'cls_org_{i}'
            for i in range(1, 7):
                col_rename[f'cncts_{i}p'] = f'cncts_{i}'
                col_rename[f'cncts_{i}s'] = f'cncts_{i}'
            for i in range(1, 5):
                col_rename[f'challenge_level_{i}p'] = f'challenge_level_{i}'
                col_rename[f'challenge_level_{i}s'] = f'challenge_level_{i}'
            for i in range(1, 20):
                col_rename[f'methods_p_{i}'] = f'methods_{i}'
                col_rename[f'methods_s_{i}'] = f'methods_{i}'
            for i in [16, 17, 18]:
                col_rename[f'methods_p_{i}_text'] = f'methods_{i}_text'
                col_rename[f'methods_s_{i}_text'] = f'methods_{i}_text'

            # Metadata column corrections (name, university, etc.)
            col_rename['q1_name'] = 'name'
            col_rename['q2_university'] = 'university'
            col_rename['q108_email'] = 'email'
            col_rename['q109_location'] = 'location'
            col_rename['q3_semester'] = 'semester'
            col_rename['q4_course'] = 'course'
            col_rename['q111_degree_level'] = 'degree_level'
            col_rename['q104_student_count'] = 'student_count'
            col_rename['q105_class_format'] = 'class_format'
            col_rename['q107_1_online_pct'] = 'online_pct'
            col_rename['q6_role'] = 'role'
            col_rename['q6_2_text'] = 'professor_name'

            df.rename(columns=col_rename, inplace=True)

            # Ensure dataframe date/datetime columns are JSON-safe before cleaning
            records_json = df.to_json(orient='records', date_format='iso')
            raw_records = json.loads(records_json)

            # Clean dataset (converts Likert strings to numbers and handles NaNs)
            cleaned_records = clean_dataset(raw_records)

            return Response({
                "message": f"{name} retrieved successfully.",
                "data": cleaned_records,
                "columns": [str(c) for c in df.columns],
                "name": name
            })
        except Exception as e:
            import traceback
            print("AdminSurveyToDatasetView Error:", traceback.format_exc())
            return Response(
                {"error": f"Failed to retrieve survey dataset: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )