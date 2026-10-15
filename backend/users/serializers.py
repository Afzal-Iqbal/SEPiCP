# Validator + converter
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Dataset, InstructorSurvey, StudentSurvey

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles registration of a new user account.
    - Ensures email is unique.
    - Validates password strength.
    - Creates a normal (non-admin) user.
    """

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "first_name"]

    def validate_username(self, value):
        if " " in value:
            raise serializers.ValidationError("Username cannot contain spaces.")
        return value

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        role = validated_data.pop('role', 'student')
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
        )
        user.role = role
        user.is_staff = False
        user.is_superuser = False
        user.save(update_fields=["role", "is_staff", "is_superuser"])
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Read-only representation of a user for profile and admin views.
    """

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser", "date_joined", "role", "first_name"]
        read_only_fields = ["id", "email", "is_staff", "is_superuser", "date_joined"]


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'original_data', 'cleaned_data', 'created_at']
        read_only_fields = ['cleaned_data', 'created_at']


class InstructorSurveySerializer(serializers.ModelSerializer):
    class Meta:
        model  = InstructorSurvey
        exclude = ['teacher']  # teacher is set automatically in the view
        read_only_fields = ['id', 'course_code', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        for field_name, field in self.fields.items():
            if field_name in data and data[field_name] == "":
                if field.allow_null:
                    data[field_name] = None
        return super().to_internal_value(data)


class StudentSurveySerializer(serializers.ModelSerializer):
    # Show the course_code from the related instructor survey (read-only)
    course_code = serializers.CharField(source='instructor_survey.course_code', read_only=True)

    class Meta:
        model  = StudentSurvey
        fields = '__all__'
        read_only_fields = ['id', 'edit_token', 'submitted_at', 'updated_at', 'instructor_survey', 'course_code']

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        for field_name, field in self.fields.items():
            if field_name in data and data[field_name] == "":
                if field.allow_null:
                    data[field_name] = None
        return super().to_internal_value(data)