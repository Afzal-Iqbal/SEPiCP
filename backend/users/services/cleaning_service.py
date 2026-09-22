import pandas as pd
import numpy as np
import json
import re


def clean_dataset(data):
    """
    Comprehensive cleaning service for Student and Instructor survey datasets.
    - Standardizes column headers & survey feature names
    - Normalizes University names, Course titles, Yes/No values, and Role fields
    - Merges q3 specialization with q3_4_text
    - Maps Likert scale responses (1-5 numeric scale)
    - Validates age, scores, and email formats non-destructively
    - Fills missing values (median for numeric, 'Unknown' for categorical)
    """
    if not data:
        return []

    try:
        df_original = pd.DataFrame(data)
        if df_original.empty:
            return []

        df = df_original.copy()

        # 1. Standardize column names
        df.columns = [
            str(col).strip().lower()
            .replace(" ", "_")
            .replace("-", "_")
            .replace(".", "_")
            .replace("__", "_")
            for col in df.columns
        ]

        # 2. Trim whitespace & standardize Yes/No values
        yes_no_map = {
            'yes': 'Yes', 'YES': 'Yes', 'y': 'Yes',
            'no': 'No', 'NO': 'No', 'n': 'No'
        }
        for col in df.select_dtypes(include='object').columns:
            df[col] = df[col].astype(str).str.strip()
            mapped_yn = df[col].str.lower().map(yes_no_map)
            df.loc[mapped_yn.notna(), col] = mapped_yn.dropna()

        # 3. Merge q3 specialization with q3_4_text if present
        if 'q3' in df.columns and 'q3_4_text' in df.columns:
            df['q3'] = df['q3'].where(df['q3'] != 'Other', df['q3_4_text'])
            df.drop(columns=['q3_4_text'], inplace=True, errors='ignore')

        # 4. University Name Normalization (q2 / university)
        uni_cols = [c for c in ['q2', 'university', 'q2_university'] if c in df.columns]
        uni_map = {
            'emu': 'Eastern Michigan University',
            'dha suffa university': 'DHA Suffa University',
            'dha suffa university karachi': 'DHA Suffa University'
        }
        for col in uni_cols:
            df[col] = df[col].astype(str).str.strip()
            lower_uni = df[col].str.lower()
            for key, val in uni_map.items():
                df.loc[lower_uni == key, col] = val
            df[col] = df[col].str.title()

        # 5. Course Title Normalization (q4 / course)
        course_cols = [c for c in ['q4', 'course', 'q4_course'] if c in df.columns]
        for col in course_cols:
            s = df[col].astype(str).str.strip().str.lower()
            mask_dl = (s.str.contains('deep', na=False) & s.str.contains('learn', na=False)) | s.str.contains('492', na=False)
            df.loc[mask_dl, col] = 'Deep Learning'
            df[col] = df[col].str.title()

        # 6. Role Extraction (q6 / role)
        role_cols = [c for c in ['q6', 'role', 'q6_role'] if c in df.columns]
        for col in role_cols:
            extracted = df[col].astype(str).str.extract(r'(Class instructor|Student|Teacher|Instructor)', flags=re.IGNORECASE, expand=False)
            df.loc[extracted.notna(), col] = extracted.dropna().str.strip().str.title()

        # 7. Likert Scale Mapping (1-5 scale)
        likert_map = {
            'never': 1, 'rarely': 2, 'sometimes': 3,
            'about half the time': 3, 'most of the time': 4,
            'almost always': 5, 'always': 5,
            'strongly disagree': 1, 'disagree': 2, 'neutral': 3,
            'agree': 4, 'strongly agree': 5
        }

        for col in df.columns:
            if col.startswith(('content_', 'relevance_', 'discuss_', 'act_part_', 'cls_org_', 'cncts_', 'challenge_level_')) or 'likert' in col:
                mapped = df[col].astype(str).str.strip().str.lower().map(likert_map)
                if mapped.notna().sum() > 0:
                    df[col] = mapped

        # 8. Range & Bounds Validations
        if 'age' in df.columns:
            df['age'] = pd.to_numeric(df['age'], errors='coerce')
            df.loc[(df['age'] < 10) | (df['age'] > 100), 'age'] = np.nan

        score_cols = [c for c in ['total_engage_score_p', 'total_engage_score_s', 'rating', 'score'] if c in df.columns]
        for col in score_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df.loc[(df[col] < 0) | (df[col] > 100), col] = np.nan

        # 9. Email Format Validation
        email_cols = [c for c in ['email', 'q108', 'q108_email'] if c in df.columns]
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        for col in email_cols:
            invalid_mask = ~df[col].astype(str).str.strip().str.lower().str.match(email_pattern, na=False)
            df.loc[invalid_mask & df[col].notna(), col] = np.nan

        # 10. Date Parsing
        date_cols = [c for c in ['start_date', 'startdate', 'created_at'] if c in df.columns]
        for col in date_cols:
            df[col] = pd.to_datetime(df[col], errors='coerce')

        # 11. Non-destructive Imputation
        for col in df.columns:
            numeric_series = pd.to_numeric(df[col], errors='coerce')
            if numeric_series.notna().sum() > (len(df) * 0.4):
                df[col] = numeric_series
                median_val = df[col].median()
                if pd.notna(median_val):
                    df[col] = df[col].fillna(median_val)
            else:
                df[col] = df[col].replace(["nan", "Nan", "NAN", "Unknown", "N/A", "N\\A", "", "None", None], np.nan)
                df[col] = df[col].fillna('Unknown')

        # Drop rows ONLY if completely empty
        df = df.dropna(how='all')

        if df.empty:
            df = df_original

        return json.loads(df.to_json(orient='records', date_format='iso'))

    except Exception as e:
        print(f"Data cleaning fallback triggered: {e}")
        return data