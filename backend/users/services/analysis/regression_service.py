import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
import matplotlib
matplotlib.use("Agg") 
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64 
from sklearn.impute import SimpleImputer

def preprocess_data(df, independent_vars, dependent_var):
    """
    Preprocess the data for regression analysis:
    - Automatically convert numeric columns containing string placeholders ('Unknown', 'N/A') to float NaNs
    - Encode categorical variables with LabelEncoder
    - Prepare X and y matrices
    """
    try: 
        df_processed = df.copy()
        label_encoders = {}
        X_columns = []
        
        likert_map = {
            'never': 1, 'rarely': 2, 'sometimes': 3,
            'about half the time': 3, 'most of the time': 4,
            'almost always': 5, 'always': 5,
            'strongly disagree': 1, 'disagree': 2, 'neutral': 3,
            'agree': 4, 'strongly agree': 5
        }

        # Process independent variables
        for col in independent_vars:
            if col not in df_processed.columns:
                continue

            safe_col_name = str(col).replace(' ', '_').replace('+', '_').replace('&', '_')
            series = df_processed[col]

            # Clean null string indicators
            series_clean = series.replace(["nan", "Nan", "NAN", "Unknown", "N/A", "N\\A", "", None], np.nan)

            # Try Likert mapping if object/string
            if series_clean.dtype == 'object':
                mapped = series_clean.astype(str).str.strip().str.lower().map(likert_map)
                if mapped.notna().sum() > (len(series_clean) * 0.3):
                    series_clean = mapped

            # Check numeric convertibility
            numeric_series = pd.to_numeric(series_clean, errors='coerce')
            
            # If at least 30% convertible to numbers, treat as numeric
            if numeric_series.notna().sum() > (len(series_clean) * 0.3):
                df_processed[safe_col_name] = numeric_series
                X_columns.append(safe_col_name)
            else:
                # Treat as categorical text: LabelEncode non-null values
                le = LabelEncoder()
                str_series = series_clean.fillna("Missing").astype(str)
                df_processed[f"{safe_col_name}_encoded"] = le.fit_transform(str_series)
                label_encoders[col] = le
                X_columns.append(f"{safe_col_name}_encoded")

        # Process dependent variable y
        if dependent_var in df_processed.columns:
            y_series = df_processed[dependent_var].replace(["nan", "Nan", "NAN", "Unknown", "N/A", "N\\A", "", None], np.nan)
            
            if y_series.dtype == 'object':
                y_cleaned = y_series.astype(str).str.replace(r'[\$,£€]', '', regex=True)
                numeric_y = pd.to_numeric(y_cleaned, errors='coerce')
            else:
                numeric_y = pd.to_numeric(y_series, errors='coerce')

            if numeric_y.notna().sum() > 0:
                df_processed[dependent_var] = numeric_y
            else:
                # Categorical target: label encode
                le = LabelEncoder()
                df_processed[dependent_var] = le.fit_transform(y_series.fillna("Missing").astype(str))
                label_encoders[dependent_var] = le

        X = df_processed[X_columns].copy()
        y = df_processed[dependent_var].copy()

        # Sanitize column names in X
        X.columns = [str(c).replace(' ', '_').replace('+', '_').replace('&', '_') for c in X.columns]

        return X, y, label_encoders, list(X.columns)
        
    except Exception as e:
        print(f"Error preprocessing data: {e}")
        raise

def perform_regression_analysis(independent_vars, dependent_var, regression_data_json, missing_values='drop'):
    try:
        df = pd.DataFrame(regression_data_json)

        if df.empty: 
            raise ValueError("Uploaded dataset is empty or invalid JSON")

        missing_vars = [v for v in independent_vars + [dependent_var] if v not in df.columns]
        if missing_vars:
            raise ValueError(f"Variables not found in data: {missing_vars}")

        X, y, _, feature_names = preprocess_data(df, independent_vars, dependent_var)
        
        # Drop rows where target variable y is missing
        valid_y = ~y.isnull()
        X = X[valid_y]
        y = y[valid_y]

        # --- Missing values handling for X ---
        if missing_values == 'mean':
            if X.isnull().any().any():
                imputer = SimpleImputer(strategy='mean')
                X_imputed = imputer.fit_transform(X)
                X = pd.DataFrame(X_imputed, columns=X.columns, index=X.index)
        else:
            # Default 'drop': drop rows with missing values in X
            valid_x = ~X.isnull().any(axis=1)
            X = X[valid_x]
            y = y[valid_x]

        # Final check
        if len(X) == 0 or len(y) == 0:
            raise ValueError("No valid rows left after handling missing values. Ensure selected features contain valid numerical data.")

        # --- Train/Test Split ---
        test_size = 0.2 if len(X) > 5 else 0.0
        if test_size > 0:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        else:
            X_train, X_test, y_train, y_test = X, X, y, y

        model = LinearRegression()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = r2_score(y_test, y_pred) if len(y_test) > 1 else 1.0
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)

        r2_val = float(r2) if not (np.isnan(r2) or np.isinf(r2)) else 0.0
        rmse_val = float(rmse) if not (np.isnan(rmse) or np.isinf(rmse)) else 0.0

        # --- Scatter & Prediction Plots ---
        plots = []

        # 1. Actual vs Predicted Plot
        try:
            plt.figure(figsize=(5, 4))
            sns.scatterplot(x=y_test, y=y_pred, alpha=0.7, color="#1e3a8a")
            min_val = float(min(y.min(), y_pred.min())) if len(y_pred) > 0 else float(y.min())
            max_val = float(max(y.max(), y_pred.max())) if len(y_pred) > 0 else float(y.max())
            plt.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2)
            plt.xlabel(f"Actual {dependent_var}")
            plt.ylabel(f"Predicted {dependent_var}")
            plt.title("Actual vs. Predicted Values")

            buf = BytesIO()
            plt.savefig(buf, format='png', bbox_inches="tight")
            plt.close()
            buf.seek(0)
            plot_base64 = base64.b64encode(buf.read()).decode('utf-8')
            buf.close()
            plots.append(f"data:image/png;base64,{plot_base64}")
        except Exception as plot_err:
            plt.close()
            print("Failed to generate Actual vs Predicted plot:", plot_err)

        # 2. Up to 5 Top Feature Regression Plots
        top_features = list(X.columns)[:5]
        for feature in top_features:
            try:
                plt.figure(figsize=(5, 4))
                sns.scatterplot(x=X[feature], y=y, alpha=0.6)
                sns.regplot(x=X[feature], y=y, scatter=False, color="red")
                clean_name = str(feature).replace('_encoded', '').replace('_', ' ')
                plt.title(f"{clean_name} vs {dependent_var}")

                buf = BytesIO()
                plt.savefig(buf, format='png', bbox_inches="tight")
                plt.close()
                buf.seek(0)
                plot_base64 = base64.b64encode(buf.read()).decode('utf-8')
                buf.close()
                plots.append(f"data:image/png;base64,{plot_base64}")
            except Exception as plot_err:
                plt.close()
                print(f"Failed to generate plot for {feature}:", plot_err)

        # Build structured regression equation string
        terms = [f"{float(model.intercept_):.4f}"]
        for i, coef in enumerate(model.coef_):
            feat = str(feature_names[i]).replace('_encoded', '').replace('_', ' ')
            sign = "+" if coef >= 0 else "-"
            terms.append(f"{sign} ({abs(float(coef)):.4f} × {feat})")
        equation_str = f"{str(dependent_var).replace('_', ' ')} = " + " ".join(terms)

        results = {
            "equation": equation_str,
            "intercept": round(float(model.intercept_), 4),
            "coefficients": [
                {
                    "feature": feature_names[i], 
                    "clean_feature": str(feature_names[i]).replace('_encoded', '').replace('_', ' '),
                    "coefficient": round(float(coef), 4)
                }
                for i, coef in enumerate(model.coef_)
            ],
            "metrics": {
                "r2": round(r2_val, 4),
                "rmse": round(rmse_val, 4),
                "sample_size": int(len(X)),
                "total_rows": int(len(df)),
            },
            "predictions_sample": [
                {"actual": round(float(a), 4), "predicted": round(float(p), 4), "error": round(float(abs(a - p)), 4)}
                for a, p in zip(list(y_test[:10]), list(y_pred[:10]))
            ],
            "plots": plots
        }
        return results

    except Exception as e:
        print(f"Error in regression analysis: {e}")
        raise

