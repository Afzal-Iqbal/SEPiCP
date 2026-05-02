# import pandas as pd
# import numpy as np
# import json
# import re

# # def clean_dataset(data):
# #     """
# #     Cleans a list of dictionaries containing either student or instructor survey data.
# #     Returns a cleaned list of dictionaries.
# #     """

# #     # Convert list of dicts to DataFrame
# #     df = pd.DataFrame(data)

# #     # Detect survey type
# #     if 'Total Engage Score-P' in df.columns or 'Content-P_1' in df.columns:
# #         survey_type = 'instructor'
# #     else:
# #         survey_type = 'student'

# #     if survey_type == 'student':
# #         # --- Student Cleaning Logic ---
# #         df = df.iloc[1:].copy()  # Remove first row if duplicate header
# #         df.replace(
# #             ["nan", "Nan", "NAN", "Unknown", "N/A", "N\A", ""],
# #             np.nan,
# #             inplace=True
# #         )
# #         df = df.drop_duplicates()
# #         df = df.dropna(how='all')

# #         # Standardize column names
# #         df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

# #         # Clean object columns
# #         for col in df.select_dtypes(include='object').columns:
# #             df[col] = df[col].astype(str).str.strip()
# #             df[col] = df[col].replace({
# #                 'Yes':'Yes','YES':'Yes','yes':'Yes','Y':'Yes',
# #                 'No':'No','NO':'No','no':'No','N':'No'
# #             })

# #         df["q3"] = df["q3"].where(df["q3"] != "Other", df["q3_4_text"])

# #         # Remove old columns permanently
# #         df.drop(["q3_4_text"], axis=1, inplace=True)    
# #         uni_map = {
# #         "Emu": "Eastern Michigan University",
# #         "Dha Suffa University": "DHA Suffa University",
# #         "Dha Suffa University karachi": "DHA Suffa University"
# #         }
# #         df['q2'] = df['q2'].astype(str).str.strip()
# #         df['q2'] = df['q2'].replace(uni_map)
# #         df['q2'] = df['q2'].str.title()

# #         df['q4'] = df['q4'].astype(str).str.strip().str.lower()

# #         df.loc[
# #             df['q4'].str.contains("deep", na=False) &
# #             df['q4'].str.contains("learn", na=False),
# #             'q4'
# #         ] = "Deep Learning"

# #         df.loc[df['q4'].str.contains("492", na=False), 'q4'] = "Deep Learning"

# #         df['q4'] = df['q4'].str.title()

# #         df["q6"] = df["q6"].str.extract(r"(Class instructor|Student)")

# #         # Remove extra spaces
# #         df["q6"] = df["q6"].str.strip()


# #         # Convert numeric columns
# #         for col in ['age', 'rating', 'score']:
# #             if col in df.columns:
# #                 df[col] = pd.to_numeric(df[col], errors='coerce')

# #         # Convert date columns
# #         if 'start_date' in df.columns:
# #             df['start_date'] = pd.to_datetime(df['start_date'], errors='coerce')
# #             # df['startdate'] = pd.to_datetime(df['startdate'], errors='coerce', infer_datetime_format=True)
# #             df = df[df['start_date'].notna()]

# #         # Email validation
# #         if 'email' in df.columns:
# #             email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
# #             df = df[df['email'].str.match(email_pattern, na=False)]
# #             df = df.reset_index(drop=True)

# #         # Age validation
# #         if 'age' in df.columns:
# #             df.loc[(df['age'] < 10) | (df['age'] > 100), 'age'] = pd.NA

# #         # Fill missing values
# #         for col in df.columns:
# #             if df[col].dtype == 'object':
# #                 df[col] = df[col].fillna("Unknown")
# #             elif pd.api.types.is_numeric_dtype(df[col]):
# #                 median_value = df[col].median()
# #                 if pd.notna(median_value):
# #                     df[col] = df[col].fillna(median_value)

# #     else:
# #         # --- Instructor Cleaning Logic ---
# #         df.columns = (df.columns
# #                       .str.strip()
# #                       .str.lower()
# #                       .str.replace(" ", "_")
# #                       .str.replace("-", "_")
# #                       .str.replace(".", "_", regex=False)
# #                       .str.replace("__", "_", regex=False))

# #         df = df.iloc[1:].copy()
# #         df = df.dropna(how='all')
# #         df = df[df.isnull().mean(axis=1) < 0.8]

# #         for col in df.select_dtypes(include='object').columns:
# #             df[col] = df[col].astype(str).str.strip()

# #         # Keep completed surveys only
# #         df['total_engage_score_p'] = pd.to_numeric(df['total_engage_score_p'], errors='coerce')

# #         df.loc[(df['total_engage_score_p'] < 0) | (df['total_engage_score_p'] > 100), 'total_engage_score_p'] = pd.NA

# #         df['startdate'] = pd.to_datetime(df['startdate'], errors='coerce')
# #         df = df[df['startdate'].notna()]

# #         df = df.drop_duplicates()
# #         df = df.reset_index(drop=True)

# #         # Email validation
# #         email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
# #         df['q108'] = df['q108'].astype(str).str.strip().str.lower()
# #         df.loc[~df['q108'].str.match(email_pattern, na=False), 'q108'] = pd.NA

# #         # University mapping
# #         uni_map = {"Emu": "Eastern Michigan University", "Dha Suffa University": "DHA Suffa University"}
# #         df['q2'] = df['q2'].astype(str).str.strip()
# #         df['q2'] = df['q2'].replace(uni_map)
# #         df['q2'] = df['q2'].str.title()

# #         # Likert scale mapping
# #         likert_cols = [col for col in df.columns if col.startswith((
# #             'relevance', 'discuss', 'act_part',
# #             'cls_org', 'challenge_level', 'cncts'))]

# #         likert_map = {
# #             "Never": 1, "Rarely": 2, "Sometimes": 3, "About half the time": 3,
# #             "Most of the time": 4, "Almost always": 5, "Always": 5
# #         }

# #         for col in likert_cols:
# #             df[col] = df[col].map(likert_map).astype("float")
    

# #         for col in likert_cols:
# #            df.loc[(df[col] < 1) | (df[col] > 5), col] = pd.NA

# #         df['response_variation'] = df[likert_cols].std(axis=1)
# #         df = df[df['response_variation'] >= 0.2]
# #         df = df.drop(columns=['response_variation'])

# #     # Convert cleaned DataFrame back to list of dicts
# #     cleaned_data = df.to_dict(orient='records')
# #     print(cleaned_data)
# #     return cleaned_data

# def clean_dataset(data):
#     df = pd.DataFrame(data)
#     print("Initial DataFrame:")
#     print(type(data))
#     print(data[:2])
#     print("-----------------------")
#     # Detect survey type
#     if 'Total Engage Score-P' in df.columns or 'Content-P_1' in df.columns:
#         survey_type = 'instructor'
#     else:
#         survey_type = 'student'

#     if survey_type == 'student':
#         df = df.iloc[1:].copy()

#         df.replace(["nan", "Nan", "NAN", "Unknown", "N/A", "N\\A", ""],
#                    np.nan, inplace=True)

#         df = df.drop_duplicates()
#         df = df.dropna(how='all')

#         df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

#         for col in df.select_dtypes(include='object').columns:
#             df[col] = df[col].astype(str).str.strip()
#             df[col] = df[col].replace({
#                 'Yes':'Yes','YES':'Yes','yes':'Yes','Y':'Yes',
#                 'No':'No','NO':'No','no':'No','N':'No'
#             })

#         if "q3_4_text" in df.columns:
#             df["q3"] = df["q3"].where(df["q3"] != "Other", df["q3_4_text"])
#             df.drop(["q3_4_text"], axis=1, inplace=True)

#         if "q2" in df.columns:
#             uni_map = {
#                 "Emu": "Eastern Michigan University",
#                 "Dha Suffa University": "DHA Suffa University",
#                 "Dha Suffa University karachi": "DHA Suffa University"
#             }
#             df['q2'] = df['q2'].astype(str).str.strip()
#             df['q2'] = df['q2'].replace(uni_map).str.title()

#         if "q4" in df.columns:
#             df['q4'] = df['q4'].astype(str).str.strip().str.lower()
#             df.loc[df['q4'].str.contains("deep", na=False) &df['q4'].str.contains("learn", na=False),'q4'] = "Deep Learning"
#             df['q4'] = df['q4'].str.title()

#         if "q6" in df.columns:
#             df["q6"] = df["q6"].str.extract(r"(Class instructor|Student)")
#             df["q6"] = df["q6"].str.strip()

#         for col in ['age', 'rating', 'score']:
#             if col in df.columns:
#                 df[col] = pd.to_numeric(df[col], errors='coerce')

#         if 'start_date' in df.columns:
#             df['start_date'] = pd.to_datetime(df['start_date'], errors='coerce')
#             df = df[df['start_date'].notna()]

#         if 'email' in df.columns:
#             email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
#             df = df[df['email'].str.match(email_pattern, na=False)]
#             df = df.reset_index(drop=True)

#         if 'age' in df.columns:
#             df.loc[(df['age'] < 10) | (df['age'] > 100), 'age'] = pd.NA

#         for col in df.columns:
#             if df[col].dtype == 'object':
#                 df[col] = df[col].fillna("Unknown")
#             elif pd.api.types.is_numeric_dtype(df[col]):
#                 median = df[col].median()
#                 if pd.notna(median):
#                     df[col] = df[col].fillna(median)
#         df = df.astype(str)
#     else:
#         df.columns = (df.columns.str.strip().str.lower()
#                       .str.replace(" ", "_")
#                       .str.replace("-", "_")
#                       .str.replace(".", "_", regex=False)
#                       )

#         df = df.iloc[1:].copy()
#         df = df.dropna(how='all')

#         df = df[df.isnull().mean(axis=1) < 0.8]

#         for col in df.select_dtypes(include='object').columns:
#             df[col] = df[col].astype(str).str.strip()

#         df['total_engage_score_p'] = pd.to_numeric(df['total_engage_score_p'], errors='coerce')

#         df.loc[(df['total_engage_score_p'] < 0) | 
#        (df['total_engage_score_p'] > 100),
#        'total_engage_score_p'] = pd.NA
    
#     # Convert start date
#         df['startdate'] = pd.to_datetime(df['startdate'], errors='coerce')
#         df = df[df['startdate'].notna()]

#     # Remove duplicates
#         df = df.drop_duplicates()
#         df = df.reset_index(drop=True)

#         email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
#         df['q108'] = df['q108'].astype(str).str.strip().str.lower()
#         df.loc[~df['q108'].str.match(email_pattern, na=False), 'q108'] = pd.NA



#         uni_map = {
#     "Emu": "Eastern Michigan University",
#     "Dha Suffa University": "DHA Suffa University"
#      }
#         df['q2'] = df['q2'].astype(str).str.strip()
#         df['q2'] = df['q2'].replace(uni_map)
#         df['q2'] = df['q2'].str.title()
    
# # Identify Likert columns
#         likert_cols = [col for col in df.columns
#                if col.startswith((
                   
#                    'relevance',
#                    'discuss',
#                    'act_part',
                   
#                    'cls_org',
#                    'challenge_level',
#                    'cncts'
#                ))]

# # Define mapping
#         likert_map = {
#     "Never": 1,
#     "Rarely": 2,
#     "Sometimes": 3,
#     "About half the time": 3,
#     "Most of the time": 4,
#     "Almost always": 5,
#     "Always": 5
# }

# # Apply mapping
#         for col in likert_cols:
#             df[col] = df[col].map(likert_map).astype("float")
    

#         for col in likert_cols:
#            df.loc[(df[col] < 1) | (df[col] > 5), col] = pd.NA

#         df['response_variation'] = df[likert_cols].std(axis=1)
#         df = df[df['response_variation'] >= 0.2]
#         df = df.drop(columns=['response_variation'])
 
#         df = df.astype(str)
#         print("Cleaned DataFrame:")
#         print(df.head())
#         print("-----------------------")
#     return json.loads(df.to_json(orient='records', date_format='iso'))


import pandas as pd
import numpy as np
import json
import re


def clean_dataset(data):
    df = pd.DataFrame(data)

    # Detect survey type
    if 'Total Engage Score-P' in df.columns or 'Content-P_1' in df.columns:
        survey_type = 'instructor'
    else:
        survey_type = 'student'

    if survey_type == 'student':
        df = df.iloc[1:].copy()
        df.replace(["nan", "Nan", "NAN", "Unknown", "N/A", "N\\A", ""], np.nan, inplace=True)
        df = df.drop_duplicates().dropna(how='all')

        # Standardize column names
        df.columns = (df.columns.str.strip()
                      .str.lower()
                      .str.replace(' ', '_')
                      .str.replace('-', '_')
                      .str.replace('.', '_', regex=False))

        # Clean text columns
        for col in df.select_dtypes(include='object').columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace({
                'Yes': 'Yes', 'YES': 'Yes', 'yes': 'Yes', 'Y': 'Yes',
                'No': 'No', 'NO': 'No', 'no': 'No', 'N': 'No'
            })

        # Replace "Other" specialization with custom text
        if 'q3' in df.columns and 'q3_4_text' in df.columns:
            df['q3'] = df['q3'].where(df['q3'] != 'Other', df['q3_4_text'])
            df.drop(columns=['q3_4_text'], inplace=True)

        # University normalization
        if 'q2' in df.columns:
            uni_map = {
                'Emu': 'Eastern Michigan University',
                'Dha Suffa University': 'DHA Suffa University',
                'Dha Suffa University karachi': 'DHA Suffa University'
            }
            df['q2'] = df['q2'].astype(str).str.strip().replace(uni_map).str.title()

        # Course normalization
        if 'q4' in df.columns:
            df['q4'] = df['q4'].astype(str).str.strip().str.lower()
            df.loc[
                df['q4'].str.contains('deep', na=False) &
                df['q4'].str.contains('learn', na=False),
                'q4'
            ] = 'Deep Learning'
            df.loc[df['q4'].str.contains('492', na=False), 'q4'] = 'Deep Learning'
            df['q4'] = df['q4'].str.title()

        # Role extraction
        if 'q6' in df.columns:
            df['q6'] = df['q6'].astype(str).str.extract(r'(Class instructor|Student)', expand=False)
            df['q6'] = df['q6'].str.strip()

        # Numeric conversion
        numeric_cols = ['age', 'rating', 'score']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Date conversion
        if 'start_date' in df.columns:
            df['start_date'] = pd.to_datetime(df['start_date'], errors='coerce')
            df = df[df['start_date'].notna()]

        # Email validation
        if 'email' in df.columns:
            email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
            df = df[df['email'].astype(str).str.match(email_pattern, na=False)]

        # Age validation
        if 'age' in df.columns:
            df.loc[(df['age'] < 10) | (df['age'] > 100), 'age'] = pd.NA

        # Optional Likert conversion for student survey columns
        student_likert_map = {
            'Strongly Disagree': 1,
            'Disagree': 2,
            'Neutral': 3,
            'Agree': 4,
            'Strongly Agree': 5
        }

        for col in df.columns:
            if df[col].dtype == 'object':
                unique_vals = set(df[col].dropna().unique())
                if unique_vals and unique_vals.issubset(set(student_likert_map.keys())):
                    df[col] = df[col].map(student_likert_map)

        # Missing value imputation
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                median_value = df[col].median()
                if pd.notna(median_value):
                    df[col] = df[col].fillna(median_value)
            else:
                df[col] = df[col].fillna('Unknown')

    else:
        df.columns = (df.columns.str.strip()
                      .str.lower()
                      .str.replace(' ', '_')
                      .str.replace('-', '_')
                      .str.replace('.', '_', regex=False)
                      .str.replace('__', '_', regex=False))

        df = df.iloc[1:].copy()
        df = df.dropna(how='all')
        df = df[df.isnull().mean(axis=1) < 0.8]

        for col in df.select_dtypes(include='object').columns:
            df[col] = df[col].astype(str).str.strip()

        # Score cleaning
        if 'total_engage_score_p' in df.columns:
            df['total_engage_score_p'] = pd.to_numeric(df['total_engage_score_p'], errors='coerce')
            df.loc[(df['total_engage_score_p'] < 0) |
                   (df['total_engage_score_p'] > 100), 'total_engage_score_p'] = pd.NA

        # Date validation
        if 'startdate' in df.columns:
            df['startdate'] = pd.to_datetime(df['startdate'], errors='coerce')
            df = df[df['startdate'].notna()]

        df = df.drop_duplicates().reset_index(drop=True)

        # Email validation
        if 'q108' in df.columns:
            email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
            df['q108'] = df['q108'].astype(str).str.strip().str.lower()
            df.loc[~df['q108'].str.match(email_pattern, na=False), 'q108'] = pd.NA

        # University normalization
        if 'q2' in df.columns:
            uni_map = {
                'Emu': 'Eastern Michigan University',
                'Dha Suffa University': 'DHA Suffa University'
            }
            df['q2'] = df['q2'].astype(str).str.strip().replace(uni_map).str.title()

        # Likert mapping
        likert_cols = [
            col for col in df.columns if col.startswith(
                ('relevance', 'discuss', 'act_part', 'cls_org', 'challenge_level', 'cncts')
            )
        ]

        likert_map = {
            'Never': 1,
            'Rarely': 2,
            'Sometimes': 3,
            'About half the time': 3,
            'Most of the time': 4,
            'Almost always': 5,
            'Always': 5
        }

        for col in likert_cols:
            df[col] = df[col].map(likert_map).astype(float)
            df.loc[(df[col] < 1) | (df[col] > 5), col] = pd.NA

        # Remove straight-line responses
        if likert_cols:
            df['response_variation'] = df[likert_cols].std(axis=1)
            df = df[df['response_variation'] >= 0.2]
            df.drop(columns=['response_variation'], inplace=True)

        # Impute numeric missing values
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                median_value = df[col].median()
                if pd.notna(median_value):
                    df[col] = df[col].fillna(median_value)

    # Keep database-saving output unchanged
    df = df.astype(str)
    print("Cleaned DataFrame:")
    print(df.head())
    return json.loads(df.to_json(orient='records', date_format='iso'))
