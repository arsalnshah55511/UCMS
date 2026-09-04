import os
import json
import pandas as pd
import joblib
import matplotlib.pyplot as plt

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)


# ==========================================================
# 1. Paths
# ==========================================================

TRAIN_PATH = "dataset/train.csv"
TEST_PATH = "dataset/test.csv"

MODEL_DIR = "model"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "ucms_logistic_regression.joblib"
)

REPORT_PATH = os.path.join(
    MODEL_DIR,
    "evaluation_report.json"
)

METRICS_PATH = os.path.join(
    MODEL_DIR,
    "model_metrics.csv"
)

CONFUSION_MATRIX_PATH = os.path.join(
    MODEL_DIR,
    "confusion_matrix.png"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# ==========================================================
# 2. Load datasets
# ==========================================================

train_df = pd.read_csv(TRAIN_PATH)
test_df = pd.read_csv(TEST_PATH)

print(f"Training records: {len(train_df)}")
print(f"Testing records: {len(test_df)}")


# ==========================================================
# 3. Separate text and labels
# ==========================================================

X_train = train_df["text"].astype(str)
y_train = train_df["department"]

X_test = test_df["text"].astype(str)
y_test = test_df["department"]


# ==========================================================
# 4. TF-IDF
# ==========================================================

tfidf = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.95,
    max_features=10000,
    stop_words="english",
    sublinear_tf=True
)


# ==========================================================
# 5. Logistic Regression
# ==========================================================

classifier = LogisticRegression(
    max_iter=1000,
    C=2.0,
    solver="lbfgs",
    random_state=42
)


# ==========================================================
# 6. Pipeline
# ==========================================================

model = Pipeline([
    ("tfidf", tfidf),
    ("classifier", classifier)
])


# ==========================================================
# 7. Train
# ==========================================================

print("\nTraining model...")

model.fit(X_train, y_train)

print("✓ Training completed.")


# ==========================================================
# 8. Predictions
# ==========================================================

y_pred = model.predict(X_test)


# ==========================================================
# 9. Evaluation Metrics
# ==========================================================

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    average="weighted",
    zero_division=0
)


# ==========================================================
# 10. Classification Report
# ==========================================================

report = classification_report(
    y_test,
    y_pred,
    output_dict=True,
    zero_division=0
)


# ==========================================================
# 11. Confusion Matrix
# ==========================================================

departments = sorted(y_test.unique().tolist())

matrix = confusion_matrix(
    y_test,
    y_pred,
    labels=departments
)


# ==========================================================
# 12. Save Main Metrics for Thesis
# ==========================================================

metrics_df = pd.DataFrame({
    "Metric": [
        "Accuracy",
        "Precision",
        "Recall",
        "F1-Score"
    ],
    "Score": [
        round(accuracy, 4),
        round(precision, 4),
        round(recall, 4),
        round(f1, 4)
    ],
    "Percentage": [
        round(accuracy * 100, 2),
        round(precision * 100, 2),
        round(recall * 100, 2),
        round(f1 * 100, 2)
    ]
})

metrics_df.to_csv(
    METRICS_PATH,
    index=False
)


# ==========================================================
# 13. Save Confusion Matrix Image
# ==========================================================

fig, ax = plt.subplots(figsize=(10, 8))

display = ConfusionMatrixDisplay(
    confusion_matrix=matrix,
    display_labels=departments
)

display.plot(
    ax=ax,
    cmap="Blues",
    values_format="d",
    colorbar=False
)

plt.title("Confusion Matrix - Department Classification Model")
plt.xlabel("Predicted Department")
plt.ylabel("Actual Department")
plt.xticks(rotation=30, ha="right")

plt.tight_layout()

plt.savefig(
    CONFUSION_MATRIX_PATH,
    dpi=300,
    bbox_inches="tight"
)

plt.close()


# ==========================================================
# 14. Create Detailed Evaluation Report
# ==========================================================

evaluation_report = {

    "project": "University Complaint Management System",

    "model": {
        "algorithm": "Logistic Regression",
        "feature_extraction": "TF-IDF",
        "ngram_range": [1, 2],
        "max_features": 10000,
        "regularization_parameter_C": 2.0,
        "solver": "lbfgs"
    },

    "dataset": {
        "total_records": len(train_df) + len(test_df),
        "training_records": len(train_df),
        "testing_records": len(test_df)
    },

    "departments": departments,

    "overall_metrics": {
        "accuracy": round(float(accuracy), 4),
        "accuracy_percentage": round(float(accuracy * 100), 2),

        "weighted_precision": round(float(precision), 4),
        "weighted_precision_percentage":
            round(float(precision * 100), 2),

        "weighted_recall": round(float(recall), 4),
        "weighted_recall_percentage":
            round(float(recall * 100), 2),

        "weighted_f1_score": round(float(f1), 4),
        "weighted_f1_percentage":
            round(float(f1 * 100), 2)
    },

    "classification_report": report,

    "confusion_matrix": {
        "labels": departments,
        "matrix": matrix.tolist()
    }
}


# ==========================================================
# 15. Save Evaluation Report
# ==========================================================

with open(
    REPORT_PATH,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        evaluation_report,
        file,
        indent=4
    )


# ==========================================================
# 16. Save Model
# ==========================================================

joblib.dump(
    model,
    MODEL_PATH
)


# ==========================================================
# 17. Display Results
# ==========================================================

print("\n==========================================")
print("MODEL EVALUATION")
print("==========================================")

print(f"Accuracy : {accuracy * 100:.2f}%")
print(f"Precision: {precision * 100:.2f}%")
print(f"Recall   : {recall * 100:.2f}%")
print(f"F1 Score : {f1 * 100:.2f}%")

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)

print("\nConfusion Matrix:")

print(
    pd.DataFrame(
        matrix,
        index=departments,
        columns=departments
    )
)

print("\n==========================================")
print("FILES SAVED")
print("==========================================")

print(f"✓ Model            : {MODEL_PATH}")
print(f"✓ Evaluation Report: {REPORT_PATH}")
print(f"✓ Metrics CSV      : {METRICS_PATH}")
print(f"✓ Confusion Matrix : {CONFUSION_MATRIX_PATH}")