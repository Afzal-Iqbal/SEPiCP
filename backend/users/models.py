# backend/users/models.py
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser
# pyrefly: ignore [missing-import]
from django.db import models
import uuid
import random
import string


def generate_short_token(length=5):
    """Generates a 5-character uppercase alphanumeric token (e.g. 'ST5X8')."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))



class User(AbstractUser):
    email = models.EmailField(unique=True)

    ROLE_STUDENT  = 'student'
    ROLE_TEACHER  = 'teacher'
    ROLE_ADMIN    = 'admin'
    ROLE_CHOICES  = [
        (ROLE_STUDENT, 'Student'),
        (ROLE_TEACHER, 'Teacher'),
        (ROLE_ADMIN,   'Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'user'

    def __str__(self):
        return f"{self.email} ({self.role})"


class Dataset(models.Model):
    user          = models.ForeignKey(User, on_delete=models.CASCADE)
    original_data = models.JSONField()
    cleaned_data  = models.JSONField()
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "datasets"

    def __str__(self):
        return f"Dataset {self.id} by {self.user.email}"


class AnalysisResult(models.Model):
    user           = models.ForeignKey(User, on_delete=models.CASCADE)
    dataset        = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True)
    analysis_type  = models.CharField(max_length=50)  # 'regression' or 'pca'
    input_params   = models.JSONField()
    output_results = models.JSONField()
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis_results"

    def __str__(self):
        return f"{self.analysis_type} result for {self.user.email} at {self.created_at}"


# ─────────────────────────────────────────────────────────────────────────────
# INSTRUCTOR SURVEY MODEL  (75 fields — mirrors INSTRUCTOR_FIELDS.js)
# ─────────────────────────────────────────────────────────────────────────────

class InstructorSurvey(models.Model):
    STATUS_DRAFT     = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_CHOICES   = [(STATUS_DRAFT, 'Draft'), (STATUS_PUBLISHED, 'Published')]

    # ── Meta fields ───────────────────────────────────────────────────────────
    teacher     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='instructor_surveys', db_column='teacher_id')
    course_code = models.CharField(max_length=12, unique=True, blank=True, db_index=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    # ── SECTION 1: Basic Information ─────────────────────────────────────────
    q1_name              = models.CharField(max_length=300, blank=True)
    q2_university        = models.CharField(max_length=300, blank=True)
    q108_email           = models.EmailField(blank=True)
    q109_location        = models.CharField(max_length=300, blank=True)
    q3_semester          = models.CharField(max_length=50, blank=True)   # e.g. "Fall"
    q3_4_text            = models.CharField(max_length=200, blank=True)  # "Other" semester text
    year                 = models.CharField(max_length=10, blank=True)
    q4_course            = models.CharField(max_length=300, blank=True)
    q111_degree_level    = models.CharField(max_length=100, blank=True)  # "Undergraduate" / "Graduate"
    q104_student_count   = models.IntegerField(null=True, blank=True)
    q105_class_format    = models.CharField(max_length=100, blank=True)  # "In-Person" / "Hybrid" etc.
    q107_1_online_pct    = models.FloatField(null=True, blank=True)      # 0–100 %
    q6_role              = models.CharField(max_length=100, blank=True)  # "Professor" etc.

    # ── SECTION 2: Overall Engagement ────────────────────────────────────────
    total_engage_score_p = models.FloatField(null=True, blank=True)      # 1–10

    # ── SECTION 3: Content Usage (frequency: "Never"…"Always" stored as text) ─
    content_p_1 = models.CharField(max_length=20, blank=True)  # Real world examples
    content_p_2 = models.CharField(max_length=20, blank=True)  # Personal experiences
    content_p_3 = models.CharField(max_length=20, blank=True)  # Applicable outside class
    content_p_4 = models.CharField(max_length=20, blank=True)  # Current news / updated topics
    content_p_5 = models.CharField(max_length=20, blank=True)  # Real case studies
    content_p_6 = models.CharField(max_length=20, blank=True)  # Hypothetical case studies

    # ── SECTION 4: Relevance ─────────────────────────────────────────────────
    relevance_1p = models.CharField(max_length=20, blank=True)  # Allow students to share…
    relevance_2p = models.CharField(max_length=20, blank=True)  # Persuade students…
    relevance_3p = models.CharField(max_length=20, blank=True)  # Keep content entertaining
    relevance_4p = models.CharField(max_length=20, blank=True)  # Introduce controversy

    # ── SECTION 5: Discussion Methods ────────────────────────────────────────
    discuss_1p = models.CharField(max_length=20, blank=True)  # Semi-structured discussion
    discuss_2p = models.CharField(max_length=20, blank=True)  # Encourage debate
    discuss_3p = models.CharField(max_length=20, blank=True)  # Ask questions
    discuss_4p = models.CharField(max_length=20, blank=True)  # Steer for innovative ideas
    discuss_5p = models.CharField(max_length=20, blank=True)  # Force analysis / conclusions
    discuss_6p = models.CharField(max_length=20, blank=True)  # Ensure all-student participation

    # ── SECTION 6: Active Participation ──────────────────────────────────────
    act_part_1p = models.CharField(max_length=20, blank=True)  # Push every student to participate
    act_part_2p = models.CharField(max_length=20, blank=True)  # Require/mandate participation
    act_part_3p = models.CharField(max_length=20, blank=True)  # Group assignments
    act_part_4p = models.CharField(max_length=20, blank=True)  # Hands-on activities
    act_part_5p = models.CharField(max_length=20, blank=True)  # Games / simulations
    act_part_6p = models.CharField(max_length=20, blank=True)  # Students teach class
    act_part_7p = models.CharField(max_length=20, blank=True)  # Problem-solving group activities
    act_part_8p = models.CharField(max_length=20, blank=True)  # Persuade proactive behaviour

    # ── SECTION 7: Teaching Methods (0–100 percentages) ──────────────────────
    methods_p_1        = models.FloatField(null=True, blank=True)  # One-way lectures
    methods_p_2        = models.FloatField(null=True, blank=True)  # Interactive lectures
    methods_p_3        = models.FloatField(null=True, blank=True)  # PPT one-way lectures
    methods_p_19       = models.FloatField(null=True, blank=True)  # PPT interactive lecture
    methods_p_5        = models.FloatField(null=True, blank=True)  # Individual pen-paper
    methods_p_6        = models.FloatField(null=True, blank=True)  # Group pen-paper
    methods_p_7        = models.FloatField(null=True, blank=True)  # Individual games
    methods_p_8        = models.FloatField(null=True, blank=True)  # Interactive games
    methods_p_9        = models.FloatField(null=True, blank=True)  # Individual online
    methods_p_10       = models.FloatField(null=True, blank=True)  # Group online
    methods_p_11       = models.FloatField(null=True, blank=True)  # Individual field
    methods_p_12       = models.FloatField(null=True, blank=True)  # Group field
    methods_p_13       = models.FloatField(null=True, blank=True)  # Fill-in-blank notes
    methods_p_14       = models.FloatField(null=True, blank=True)  # Teaching props
    methods_p_15       = models.FloatField(null=True, blank=True)  # Articles / cases
    methods_p_16       = models.FloatField(null=True, blank=True)  # Other 1
    methods_p_16_text  = models.CharField(max_length=500, blank=True)
    methods_p_17       = models.FloatField(null=True, blank=True)  # Other 2
    methods_p_17_text  = models.CharField(max_length=500, blank=True)
    methods_p_18       = models.FloatField(null=True, blank=True)  # Other 3
    methods_p_18_text  = models.CharField(max_length=500, blank=True)

    # ── SECTION 8: Class Organization ────────────────────────────────────────
    cls_org_1p = models.CharField(max_length=20, blank=True)  # Materials well organized
    cls_org_2p = models.CharField(max_length=20, blank=True)  # Outline expectations early
    cls_org_3p = models.CharField(max_length=20, blank=True)  # Clear confusion regularly
    cls_org_4p = models.CharField(max_length=20, blank=True)  # Thoughts well organized
    cls_org_5p = models.CharField(max_length=20, blank=True)  # Notes straightforward

    # ── SECTION 9: Challenge Level ────────────────────────────────────────────
    challenge_level_1p = models.CharField(max_length=20, blank=True)  # Present unfamiliar → connect
    challenge_level_2p = models.CharField(max_length=20, blank=True)  # Put knowledge to test
    challenge_level_3p = models.CharField(max_length=20, blank=True)  # Not overwhelmed
    challenge_level_4p = models.CharField(max_length=20, blank=True)  # Optimal challenge level

    # ── SECTION 10: Connection with Students ──────────────────────────────────
    cncts_1p = models.CharField(max_length=20, blank=True)  # Know students by name
    cncts_2p = models.CharField(max_length=20, blank=True)  # Know students personally
    cncts_3p = models.CharField(max_length=20, blank=True)  # Relate / connect
    cncts_4p = models.CharField(max_length=20, blank=True)  # Friendly attitude
    cncts_5p = models.CharField(max_length=20, blank=True)  # Engage outside classroom
    cncts_6p = models.CharField(max_length=20, blank=True)  # Interested in feedback

    class Meta:
        db_table = "instructor_surveys"
        constraints = [
            models.UniqueConstraint(fields=['teacher', 'course_code'], name='unique_teacher_course_code')
        ]

    def save(self, *args, **kwargs):
        if not self.course_code:
            code = generate_short_token(5)
            while InstructorSurvey.objects.filter(course_code=code).exists():
                code = generate_short_token(5)
            self.course_code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"InstructorSurvey #{self.id} | code={self.course_code} | {self.teacher.email}"


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT SURVEY MODEL  (84 fields — mirrors STUDENT_FIELDS.js)
# ─────────────────────────────────────────────────────────────────────────────

class StudentSurvey(models.Model):
    # ── Meta fields ───────────────────────────────────────────────────────────
    instructor_survey = models.ForeignKey(
        InstructorSurvey, on_delete=models.CASCADE, related_name='student_surveys'
    )
    edit_token   = models.CharField(max_length=10, default=generate_short_token, unique=True, editable=False)
    is_published = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    # ── SECTION 1: Basic Information ─────────────────────────────────────────
    q1_name            = models.CharField(max_length=300, blank=True)
    q2_university      = models.CharField(max_length=300, blank=True)
    q108_email         = models.EmailField(blank=True)
    q109_location      = models.CharField(max_length=300, blank=True)
    q3_semester        = models.CharField(max_length=50, blank=True)
    q3_4_text          = models.CharField(max_length=200, blank=True)
    year               = models.CharField(max_length=10, blank=True)
    q4_course          = models.CharField(max_length=300, blank=True)
    q111_degree_level  = models.CharField(max_length=100, blank=True)
    q104_student_count = models.IntegerField(null=True, blank=True)
    q105_class_format  = models.CharField(max_length=100, blank=True)
    q107_1_online_pct  = models.FloatField(null=True, blank=True)
    q6_role            = models.CharField(max_length=100, blank=True)
    q6_2_text          = models.CharField(max_length=300, blank=True)  # professor name

    # ── SECTION 2: Overall Engagement ────────────────────────────────────────
    total_engage_score_s = models.FloatField(null=True, blank=True)  # 1–10

    # ── SECTION 3: Content ───────────────────────────────────────────────────
    content_s_1 = models.CharField(max_length=20, blank=True)
    content_s_2 = models.CharField(max_length=20, blank=True)
    content_s_3 = models.CharField(max_length=20, blank=True)
    content_s_4 = models.CharField(max_length=20, blank=True)
    content_s_5 = models.CharField(max_length=20, blank=True)
    content_s_6 = models.CharField(max_length=20, blank=True)

    # ── SECTION 4: Relevance ─────────────────────────────────────────────────
    relevance_1s = models.CharField(max_length=20, blank=True)
    relevance_2s = models.CharField(max_length=20, blank=True)
    relevance_3s = models.CharField(max_length=20, blank=True)
    relevance_4s = models.CharField(max_length=20, blank=True)

    # ── SECTION 5: Discussion Methods ────────────────────────────────────────
    discuss_1s = models.CharField(max_length=20, blank=True)
    discuss_2s = models.CharField(max_length=20, blank=True)
    discuss_3s = models.CharField(max_length=20, blank=True)
    discuss_4s = models.CharField(max_length=20, blank=True)
    discuss_5s = models.CharField(max_length=20, blank=True)
    discuss_6s = models.CharField(max_length=20, blank=True)

    # ── SECTION 6: Active Participation ──────────────────────────────────────
    act_part_1s = models.CharField(max_length=20, blank=True)
    act_part_2s = models.CharField(max_length=20, blank=True)
    act_part_3s = models.CharField(max_length=20, blank=True)
    act_part_4s = models.CharField(max_length=20, blank=True)
    act_part_5s = models.CharField(max_length=20, blank=True)
    act_part_6s = models.CharField(max_length=20, blank=True)
    act_part_7s = models.CharField(max_length=20, blank=True)
    act_part_8s = models.CharField(max_length=20, blank=True)

    # ── SECTION 7: Teaching Methods (0–100 percentages) ──────────────────────
    methods_s_1       = models.FloatField(null=True, blank=True)
    methods_s_2       = models.FloatField(null=True, blank=True)
    methods_s_3       = models.FloatField(null=True, blank=True)
    methods_s_5       = models.FloatField(null=True, blank=True)
    methods_s_6       = models.FloatField(null=True, blank=True)
    methods_s_7       = models.FloatField(null=True, blank=True)
    methods_s_8       = models.FloatField(null=True, blank=True)
    methods_s_9       = models.FloatField(null=True, blank=True)
    methods_s_10      = models.FloatField(null=True, blank=True)
    methods_s_11      = models.FloatField(null=True, blank=True)
    methods_s_12      = models.FloatField(null=True, blank=True)
    methods_s_13      = models.FloatField(null=True, blank=True)
    methods_s_14      = models.FloatField(null=True, blank=True)
    methods_s_15      = models.FloatField(null=True, blank=True)
    methods_s_16      = models.FloatField(null=True, blank=True)
    methods_s_16_text = models.CharField(max_length=500, blank=True)
    methods_s_17      = models.FloatField(null=True, blank=True)
    methods_s_17_text = models.CharField(max_length=500, blank=True)
    methods_s_18      = models.FloatField(null=True, blank=True)
    methods_s_18_text = models.CharField(max_length=500, blank=True)

    # ── SECTION 8: Class Organization ────────────────────────────────────────
    cls_org_1s = models.CharField(max_length=20, blank=True)
    cls_org_2s = models.CharField(max_length=20, blank=True)
    cls_org_3s = models.CharField(max_length=20, blank=True)
    cls_org_4s = models.CharField(max_length=20, blank=True)
    cls_org_5s = models.CharField(max_length=20, blank=True)

    # ── SECTION 9: Challenge Level ────────────────────────────────────────────
    challenge_level_1s = models.CharField(max_length=20, blank=True)
    challenge_level_2s = models.CharField(max_length=20, blank=True)
    challenge_level_3s = models.CharField(max_length=20, blank=True)
    challenge_level_4s = models.CharField(max_length=20, blank=True)

    # ── SECTION 10: Connection with Professor ─────────────────────────────────
    cncts_1s = models.CharField(max_length=20, blank=True)
    cncts_2s = models.CharField(max_length=20, blank=True)
    cncts_3s = models.CharField(max_length=20, blank=True)
    cncts_4s = models.CharField(max_length=20, blank=True)
    cncts_5s = models.CharField(max_length=20, blank=True)
    cncts_6s = models.CharField(max_length=20, blank=True)

    # ── SECTION 11: Professor Attributes (sliders / numeric scales) ───────────
    p_attrib_1 = models.FloatField(null=True, blank=True)   # Excitement / energy  (0–100)
    p_attrib_2 = models.FloatField(null=True, blank=True)   # Laid back / relaxed  (0–100)
    p_attrib_3 = models.FloatField(null=True, blank=True)   # Cares about learning (0–100)
    p_attrib_4 = models.FloatField(null=True, blank=True)   # Cares about subject  (0–100)
    p_attrib_5 = models.FloatField(null=True, blank=True)   # Knowledgeable        (1–13)
    p_attrib_6 = models.FloatField(null=True, blank=True)   # Easy to approach     (1–10)
    p_attrib_7 = models.FloatField(null=True, blank=True)   # Personality reflect  (1–10)
    p_attrib_8 = models.FloatField(null=True, blank=True)   # Sense of humor       (1–10)
    p_attrib_9 = models.CharField(max_length=20, blank=True)  # Frequency of humor (select)

    class Meta:
        db_table = "student_surveys"

    def __str__(self):
        return f"StudentSurvey #{self.id} | for course={self.instructor_survey.course_code}"