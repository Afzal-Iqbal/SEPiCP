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
    Preprocess the data for regression analysis
    - Handle categorical variables with label encoding
    - Clean numerical data
    - Prepare X and y matrices
    """
    try: 
        # Create a copy to avoid modifying original 
        df_processed = df.copy()
        
        # Store label encoders for later use
        label_encoders = {}
        
        # Process independent variables
        X_columns = []
        for col in independent_vars:
            if col in df_processed.columns:
                # Sanitize column name for encoded columns
                safe_col_name = str(col).replace(' ', '_').replace('+', '_').replace('&', '_')
                # Check if column is categorical (string/object type)
                if df_processed[col].dtype == 'object':
                    # Use label encoder for categorical data
                    le = LabelEncoder()
                    df_processed[f"{safe_col_name}_encoded"] = le.fit_transform(df_processed[col].astype(str))
                    label_encoders[col] = le
                    X_columns.append(f"{safe_col_name}_encoded")
                else:
                    # Keep numerical columns as is
                    X_columns.append(col)
        
        # Process dependent variable
        if dependent_var in df_processed.columns:
            if df_processed[dependent_var].dtype == 'object':
                # Try to convert string numbers (like "$1,000") to float
                try:
                    # Remove common currency symbols and commas
                    # Use a non-regex approach or fix the regex warning
                    df_processed[dependent_var] = df_processed[dependent_var].astype(str).str.replace(r'[\$,£€]', '', regex=True)
                    df_processed[dependent_var] = pd.to_numeric(df_processed[dependent_var], errors='coerce')
                except:
                    # If still categorical, encode it
                    le = LabelEncoder()
                    df_processed[dependent_var] = le.fit_transform(df_processed[dependent_var].astype(str))
                    label_encoders[dependent_var] = le
        
        # Create X and y
        X = df_processed[X_columns]
        y = df_processed[dependent_var]
        
        # Convert column names to strings and sanitize
        X.columns = [str(col).replace(' ', '_').replace('+', '_').replace('&', '_') for col in X.columns]
        
        # Remove any rows with NaN values
        mask = ~(X.isnull().any(axis=1) | y.isnull())
        X = X[mask]
        y = y[mask]
        
        return X, y, label_encoders, X_columns
        
    except Exception as e:
        print(f"Error preprocessing data: {e}")
        raise

def perform_regression_analysis(independent_vars, dependent_var, regression_data_json, missing_values):
    try:
        df = pd.DataFrame(regression_data_json)

        if df.empty: 
            raise ValueError("Uploaded dataset is empty or invalid JSON")

        missing_vars = [v for v in independent_vars + [dependent_var] if v not in df.columns]
        if missing_vars:
            raise ValueError(f"Variables not found in data: {missing_vars}")

        X, y, _, feature_names = preprocess_data(df, independent_vars, dependent_var)
        
        # --- Missing values handling ---
        if missing_values == 'drop':
            mask = ~(X.isnull().any(axis=1) | y.isnull())
            X = X[mask]
            y = y[mask]

        elif missing_values == 'mean':
            imputer = SimpleImputer(strategy='mean')
            # Check if X is empty before imputing
            if not X.empty:
                X_imputed = imputer.fit_transform(X)
                X = pd.DataFrame(X_imputed, columns=X.columns, index=X.index)
            # Drop rows with missing y (target cannot be imputed reliably)
            mask = ~y.isnull()
            X = X[mask]
            y = y[mask]

        # Final check
        if len(X) == 0 or len(y) == 0:
            raise ValueError("No valid rows left after handling missing values")

        # --- Train/Test Split ---
        # Ensure we have enough data to split
        test_size = 0.2 if len(X) > 5 else 0.0
        if test_size > 0:
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        else:
            X_train, X_test, y_train, y_test = X, X, y, y

        model = LinearRegression()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = float(np.sqrt(mse))

        # --- Scatter Plots ---
        plots = []
        for feature in X.columns:   # numeric processed features
            plt.figure(figsize=(5, 4))
            sns.scatterplot(x=X[feature], y=y, alpha=0.6)
            sns.regplot(x=X[feature], y=y, scatter=False, color="red")
            plt.title(f"{feature} vs {dependent_var}")

            buf = BytesIO()
            plt.savefig(buf, format='png', bbox_inches="tight")
            plt.close()
            buf.seek(0)
            plot_base64 = base64.b64encode(buf.read()).decode('utf-8')
            buf.close()
            plots.append(f"data:image/png;base64,{plot_base64}")

        results = {
            "intercept": float(model.intercept_),
            "coefficients": [
                {"feature": feature_names[i], "coefficient": float(coef)}
                for i, coef in enumerate(model.coef_)
            ],
            "metrics": {
                "r2": float(r2),
                "rmse": rmse,
            },
            "predictions_sample": [
                {"actual": float(a), "predicted": float(p)}
                for a, p in zip(list(y_test[:5]), list(y_pred[:5]))
            ],
            "plots": plots
        }
        return results

    except Exception as e:
        print(f"Error in regression analysis: {e}")
        raise
