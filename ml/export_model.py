import json
import joblib
import os


MODEL_PATH = "model/ucms_logistic_regression.joblib"
OUTPUT_PATH = "model/ucms_model.json"


print("Loading trained model...")

pipeline = joblib.load(
    MODEL_PATH
)

tfidf = pipeline.named_steps["tfidf"]
classifier = pipeline.named_steps["classifier"]


# ==========================================================
# Vocabulary
# ==========================================================

vocabulary = {
    str(term): int(index)
    for term, index in tfidf.vocabulary_.items()
}


# ==========================================================
# IDF
# ==========================================================

idf = [
    float(value)
    for value in tfidf.idf_
]


# ==========================================================
# Stopwords
# ==========================================================

stop_words = sorted(
    str(word)
    for word in tfidf.get_stop_words()
)


# ==========================================================
# Classes
# ==========================================================

classes = [
    str(value)
    for value in classifier.classes_
]


# ==========================================================
# Coefficients
# ==========================================================

coefficients = [
    [
        float(value)
        for value in row
    ]
    for row in classifier.coef_
]


# ==========================================================
# Intercepts
# ==========================================================

intercepts = [
    float(value)
    for value in classifier.intercept_
]


# ==========================================================
# Export model
# ==========================================================

exported_model = {

    "model_type": "LogisticRegression",

    "feature_extraction": {

        "type": "TfidfVectorizer",

        "vocabulary": vocabulary,

        "idf": idf,

        "stop_words": stop_words,

        "ngram_range": [
            int(tfidf.ngram_range[0]),
            int(tfidf.ngram_range[1])
        ],

        "lowercase":
            bool(tfidf.lowercase),

        "sublinear_tf":
            bool(tfidf.sublinear_tf),

        "max_features": (
            int(tfidf.max_features)
            if tfidf.max_features is not None
            else None
        ),

        "min_df": (
            int(tfidf.min_df)
            if isinstance(tfidf.min_df, int)
            else float(tfidf.min_df)
        ),

        "max_df": (
            int(tfidf.max_df)
            if isinstance(tfidf.max_df, int)
            else float(tfidf.max_df)
        ),

        "token_pattern":
            tfidf.token_pattern,

        "norm":
            tfidf.norm
    },

    "classifier": {

        "classes": classes,

        "coefficients": coefficients,

        "intercepts": intercepts,

        "number_of_classes":
            len(classes),

        "number_of_features":
            len(vocabulary)
    }
}


# ==========================================================
# Save JSON
# ==========================================================

os.makedirs(
    os.path.dirname(OUTPUT_PATH),
    exist_ok=True
)


with open(
    OUTPUT_PATH,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        exported_model,
        file,
        ensure_ascii=False,
        indent=2
    )


# ==========================================================
# Validate JSON
# ==========================================================

with open(
    OUTPUT_PATH,
    "r",
    encoding="utf-8"
) as file:

    json.load(file)


print("\n======================================")
print("MODEL EXPORT COMPLETED")
print("======================================")

print(f"Classes  : {classes}")
print(f"Features : {len(vocabulary)}")
print(f"Stopwords: {len(stop_words)}")
print(f"Output   : {OUTPUT_PATH}")

print("\n✓ JSON validation successful.")