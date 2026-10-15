"""
Basic Analysis Logic Service
Handles column-wise basic statistical analysis for both numeric and non-numeric data.
"""

import pandas as pd
import numpy as np


def perform_basic_analysis(data):
    """
    Perform column-wise basic analysis on the provided dataset.

    For numeric columns:
        - count, missing, mean, median, mode, std_dev, variance,
          min, max, range, q1, q3, iqr, skewness, kurtosis

    For non-numeric (categorical) columns:
        - count, missing, unique_count, unique_values, mode, value_counts, value_counts_percent

    Parameters:
        data (list of dicts): The dataset as a list of records (JSON format).

    Returns:
        dict: Column-wise analysis results.
    """

    try:
        df = pd.DataFrame(data)

        if df.empty:
            raise ValueError("Dataset is empty or invalid.")

        total_rows = len(df)

        results = {
            "total_rows": total_rows,
            "total_columns": len(df.columns),
            "columns": {}
        }

        likert_map = {
            'never': 1, 'rarely': 2, 'sometimes': 3,
            'about half the time': 3, 'most of the time': 4,
            'almost always': 5, 'always': 5,
            'strongly disagree': 1, 'disagree': 2, 'neutral': 3,
            'agree': 4, 'strongly agree': 5
        }

        for col in df.columns:
            series = df[col]

            # Convert string Likert values to numeric if present
            if series.dtype == 'object':
                mapped_series = series.astype(str).str.strip().str.lower().map(likert_map)
                if mapped_series.notna().sum() > (total_rows * 0.3):
                    series = mapped_series

            # --- Shared stats for all columns ---
            count       = int(series.count())          # non-null count
            missing     = int(series.isnull().sum())
            missing_pct = round((missing / total_rows) * 100, 2)

            # --- Determine column type ---
            # Try to infer numeric even if dtype is object (e.g., "1", "2.5", True/False)
            if series.dtype == 'bool' or pd.api.types.is_bool_dtype(series):
                numeric_series = series.astype(float)
                is_numeric = True
            else:
                numeric_series = pd.to_numeric(series, errors='coerce')
                is_numeric = numeric_series.notna().sum() > (total_rows * 0.4)

            if is_numeric:
                clean = numeric_series.dropna().astype(float)

                mode_result = clean.mode()
                mode_val    = round(float(mode_result.iloc[0]), 4) if not mode_result.empty else None

                q1  = round(float(clean.quantile(0.25)), 4) if not clean.empty else None
                q3  = round(float(clean.quantile(0.75)), 4) if not clean.empty else None
                iqr = round(q3 - q1, 4) if (q1 is not None and q3 is not None) else None

                col_analysis = {
                    "type": "numeric",
                    "count": count,
                    "missing": missing,
                    "missing_percent": missing_pct,
                    "mean": round(float(clean.mean()), 4)       if not clean.empty else None,
                    "median": round(float(clean.median()), 4)   if not clean.empty else None,
                    "mode": mode_val,
                    "std_dev": round(float(clean.std()), 4)     if not clean.empty else None,
                    "variance": round(float(clean.var()), 4)    if not clean.empty else None,
                    "min": round(float(clean.min()), 4)         if not clean.empty else None,
                    "max": round(float(clean.max()), 4)         if not clean.empty else None,
                    "range": round(float(clean.max() - clean.min()), 4) if not clean.empty else None,
                    "q1": q1,
                    "q3": q3,
                    "iqr": iqr,
                    "skewness": round(float(clean.skew()), 4)   if not clean.empty and len(clean) > 2 else None,
                    "kurtosis": round(float(clean.kurt()), 4)   if not clean.empty and len(clean) > 3 else None,
                }

            else:
                # Non-numeric / categorical column
                clean = series.dropna().astype(str)

                mode_result = clean.mode()
                mode_val    = str(mode_result.iloc[0]) if not mode_result.empty else None

                value_counts         = clean.value_counts()
                value_counts_percent = clean.value_counts(normalize=True).mul(100).round(2)

                col_analysis = {
                    "type": "categorical",
                    "count": count,
                    "missing": missing,
                    "missing_percent": missing_pct,
                    "unique_count": int(clean.nunique()),
                    "unique_values": clean.unique().tolist(),
                    "mode": mode_val,
                    "value_counts": value_counts.to_dict(),
                    "value_counts_percent": value_counts_percent.to_dict(),
                }

            results["columns"][col] = col_analysis

        # Identify lowest scoring numerical variables (bottom 10)
        numeric_means = []
        for col, col_data in results["columns"].items():
            if col_data.get("type") == "numeric" and col_data.get("mean") is not None:
                numeric_means.append({
                    "column": col,
                    "clean_name": str(col).replace('_', ' ').title(),
                    "mean": col_data["mean"],
                    "min": col_data.get("min"),
                    "max": col_data.get("max")
                })

        results["lowest_scoring_items"] = sorted(numeric_means, key=lambda x: x["mean"])[:10]

        return sanitize_results(results)

    except Exception as e:
        raise Exception(f"Basic analysis failed: {str(e)}")


def sanitize_results(obj):
    """Recursively replace NaN and Infinity float values with None for JSON compliance."""
    if isinstance(obj, dict):
        return {k: sanitize_results(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_results(i) for i in obj]
    elif isinstance(obj, float):
        if obj != obj or obj == float('inf') or obj == float('-inf'):  # NaN or Inf check
            return None
    return obj