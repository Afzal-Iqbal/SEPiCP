"""
Principal Component Analysis (PCA) Logic Service
Handles PCA computation, visualization, and result generation
UPDATED:
Added PC equations
Added PC variable contribution table

"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import io
import base64
import os
import tempfile
import csv
import json
from django.conf import settings


def perform_pca_analysis(data, selected_columns, n_components=None, variance_threshold=None,
                         missing_values='drop', file_name='dataset'):
    """
    Perform Principal Component Analysis on the provided dataset
    """

    try:
        # 1. Data Preparation
        df = pd.DataFrame(data)

        # Select only the specified columns
        df_selected = df[selected_columns].copy()

        # Convert all columns to numeric
        for col in df_selected.columns:
            df_selected[col] = pd.to_numeric(df_selected[col], errors='coerce')

        # Handle missing values
        if missing_values == 'drop':
            df_selected = df_selected.dropna()

        elif missing_values == 'mean':
            imputer = SimpleImputer(strategy='mean')

            if not df_selected.empty:
                df_selected = pd.DataFrame(
                    imputer.fit_transform(df_selected),
                    columns=df_selected.columns,
                    index=df_selected.index
                )

        # Remove remaining NaN
        df_selected = df_selected.dropna()

        if df_selected.empty:
            raise ValueError("No valid numerical data found after preprocessing")

        if len(df_selected) < 2:
            raise ValueError("At least 2 samples are required for PCA analysis")

        # 2. Standardization
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(df_selected)

        # 3. Number of Components
        max_components = min(data_scaled.shape)

        if variance_threshold is not None:
            pca_temp = PCA()
            pca_temp.fit(data_scaled)

            cumsum_variance = np.cumsum(
                pca_temp.explained_variance_ratio_ * 100
            )

            n_components = np.argmax(
                cumsum_variance >= variance_threshold
            ) + 1

            n_components = min(n_components, max_components)

        if n_components is None:
            n_components = min(2, max_components)

        n_components = min(int(n_components), max_components)

        # 4. PCA Fit
        pca = PCA(n_components=n_components)
        data_transformed = pca.fit_transform(data_scaled)

        # 5. Results
        eigenvalues = pca.explained_variance_.tolist()
        variance_ratios = (
            pca.explained_variance_ratio_ * 100
        ).tolist()

        cumulative_variance = np.cumsum(
            variance_ratios
        ).tolist()

        # Loadings Matrix
        loadings = pca.components_.T

        # 6. Prepare Results
        results = {
            'summary': {
                'total_features': len(selected_columns),
                'components_selected': n_components,
                'total_variance': cumulative_variance[-1],
                'total_samples': len(df_selected)
            },

            'variance_explained': [],
            'transformed_data': [],
            'pc_columns': [f'PC{i+1}' for i in range(n_components)],
            'feature_loadings': [],

            # NEW
            'pc_equations': [],
            'pc_variable_table': [],

            'plots': [],
            'scree_plot': None,
        }

        # =====================================================
        # Variance Explained Table
        # =====================================================
        for i in range(n_components):
            results['variance_explained'].append({
                'component_num': i + 1,
                'eigenvalue': eigenvalues[i],
                'variance_percent': variance_ratios[i],
                'cumulative_variance': cumulative_variance[i]
            })

        # =====================================================
        # Transformed Data
        # =====================================================
        sample_names = df_selected.index[:10]

        for i, (idx, row) in enumerate(
            zip(sample_names, data_transformed[:10])
        ):

            results['transformed_data'].append({
                'sample_name':
                    f'Sample_{idx}' if isinstance(idx, int)
                    else str(idx),

                'pc_values': row.tolist()
            })

        # =====================================================
        # Feature Loadings
        # =====================================================
        for i, feature in enumerate(selected_columns):
            results['feature_loadings'].append({
                'feature_name': feature,
                'loadings': loadings[i].tolist()
            })

        # =====================================================
        # NEW SECTION 1: PC EQUATIONS
        # =====================================================
        for pc in range(n_components):

            equation_terms = []

            for i, feature in enumerate(selected_columns):
                coeff = loadings[i][pc]

                term = f"({coeff:.4f} × Z_{feature})"
                equation_terms.append(term)

            equation = " + ".join(equation_terms)

            results['pc_equations'].append({
                'pc_name': f'PC{pc+1}',
                'equation': equation
            })

        # =====================================================
        # NEW SECTION 2: PC VARIABLE TABLE
        # Shows strongest variables in each PC
        # =====================================================
        threshold = 0.30

        for pc in range(n_components):

            important_vars = []

            for i, feature in enumerate(selected_columns):

                coeff = loadings[i][pc]

                if abs(coeff) >= threshold:
                    important_vars.append({
                        'feature_name': feature,
                        'loading': round(float(coeff), 4)
                    })

            results['pc_variable_table'].append({
                'pc_name': f'PC{pc+1}',
                'important_variables': important_vars
            })

        # =====================================================
        # Visualizations
        # =====================================================
        results['scree_plot'] = create_scree_plot(
            variance_ratios,
            cumulative_variance
        )

        results['plots'] = create_pca_plots(
            data_transformed,
            n_components,
            df_selected.index
        )

        return results

    except Exception as e:
        raise Exception(f"PCA analysis failed: {str(e)}")


# =====================================================
# SCREE PLOT
# =====================================================
def create_scree_plot(variance_ratios, cumulative_variance):

    plt.figure(figsize=(10, 6))
    components = range(1, len(variance_ratios) + 1)

    fig, ax1 = plt.subplots(figsize=(10, 6))

    color = 'tab:blue'
    ax1.set_xlabel('Principal Component')
    ax1.set_ylabel('Variance Explained (%)', color=color)

    bars = ax1.bar(
        components,
        variance_ratios,
        alpha=0.7,
        color=color,
        label='Individual'
    )

    ax1.tick_params(axis='y', labelcolor=color)

    for i, bar in enumerate(bars):
        height = bar.get_height()

        ax1.text(
            bar.get_x() + bar.get_width()/2.,
            height + 0.5,
            f'{variance_ratios[i]:.1f}%',
            ha='center',
            va='bottom',
            fontsize=9
        )

    ax2 = ax1.twinx()

    color = 'tab:red'
    ax2.set_ylabel('Cumulative Variance (%)', color=color)

    ax2.plot(
        components,
        cumulative_variance,
        color=color,
        marker='o',
        linewidth=2,
        label='Cumulative'
    )

    ax2.tick_params(axis='y', labelcolor=color)

    for x, y in zip(components, cumulative_variance):
        ax2.text(
            x,
            y + 1,
            f'{y:.1f}%',
            ha='center',
            va='bottom',
            fontsize=9,
            color=color
        )

    ax1.set_title(
        'Scree Plot: Variance Explained by Principal Components',
        fontsize=14,
        fontweight='bold'
    )

    ax1.grid(True, alpha=0.3)
    ax1.set_xticks(components)
    ax1.legend(loc='upper left')
    ax2.legend(loc='upper right')

    plt.tight_layout()

    buffer = io.BytesIO()

    plt.savefig(
        buffer,
        format='png',
        dpi=150,
        bbox_inches='tight'
    )

    buffer.seek(0)
    plot_data = buffer.getvalue()
    buffer.close()
    plt.close()

    plot_url = base64.b64encode(plot_data).decode()

    return f"data:image/png;base64,{plot_url}"


# =====================================================
# PCA PLOTS
# =====================================================
def create_pca_plots(data_transformed, n_components, sample_indices):

    plots = []

    # 2D Plot
    if n_components >= 2:

        plt.figure(figsize=(10, 8))

        scatter = plt.scatter(
            data_transformed[:, 0],
            data_transformed[:, 1],
            alpha=0.7,
            s=50,
            c=range(len(data_transformed)),
            cmap='viridis'
        )

        plt.xlabel('PC1')
        plt.ylabel('PC2')

        plt.title(
            '2D PCA Plot: PC1 vs PC2',
            fontsize=14,
            fontweight='bold'
        )

        plt.grid(True, alpha=0.3)
        plt.colorbar(scatter, label='Sample Index')

        for i in range(min(10, len(data_transformed))):
            plt.annotate(
                f'{i+1}',
                (data_transformed[i, 0], data_transformed[i, 1]),
                xytext=(5, 5),
                textcoords='offset points',
                fontsize=8,
                alpha=0.7
            )

        plt.tight_layout()

        buffer = io.BytesIO()

        plt.savefig(
            buffer,
            format='png',
            dpi=150,
            bbox_inches='tight'
        )

        buffer.seek(0)
        plot_data = buffer.getvalue()
        buffer.close()
        plt.close()

        plot_url = base64.b64encode(plot_data).decode()

        plots.append({
            'title': '2D Scatter Plot (PC1 vs PC2)',
            'image': f"data:image/png;base64,{plot_url}"
        })

    # 3D Plot
    if n_components >= 3:

        fig = plt.figure(figsize=(12, 8))
        ax = fig.add_subplot(111, projection='3d')

        scatter = ax.scatter(
            data_transformed[:, 0],
            data_transformed[:, 1],
            data_transformed[:, 2],
            alpha=0.7,
            s=50,
            c=range(len(data_transformed)),
            cmap='plasma'
        )

        ax.set_xlabel('PC1')
        ax.set_ylabel('PC2')
        ax.set_zlabel('PC3')

        ax.set_title(
            '3D PCA Plot: PC1 vs PC2 vs PC3',
            fontsize=14,
            fontweight='bold'
        )

        plt.colorbar(
            scatter,
            label='Sample Index',
            shrink=0.8
        )

        plt.tight_layout()

        buffer = io.BytesIO()

        plt.savefig(
            buffer,
            format='png',
            dpi=150,
            bbox_inches='tight'
        )

        buffer.seek(0)
        plot_data = buffer.getvalue()
        buffer.close()
        plt.close()

        plot_url = base64.b64encode(plot_data).decode()

        plots.append({
            'title': '3D Scatter Plot (PC1 vs PC2 vs PC3)',
            'image': f"data:image/png;base64,{plot_url}"
        })

    return plots