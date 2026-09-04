    
import pandas as pd
from sklearn.model_selection import train_test_split
from pathlib import Path

# --------------------------------------------------
# Configuration
# --------------------------------------------------

DATASET_PATH = "dataset/ucms_complaints_updated.csv"

TRAIN_PATH = "dataset/train.csv"
TEST_PATH = "dataset/test.csv"

DEPARTMENTS = [
    "Academic",
    "Maintenance & Facilities",
    "Hostel/Provost Office",
    "IT Services",
    "Administrative Offices"
]

# Expected final dataset
EXPECTED_TOTAL = 12500
EXPECTED_PER_DEPARTMENT = 2500

# Expected 80/20 split
EXPECTED_TRAIN = 10000
EXPECTED_TEST = 2500

EXPECTED_TRAIN_PER_DEPARTMENT = 2000
EXPECTED_TEST_PER_DEPARTMENT = 500


# --------------------------------------------------
# 1. Load dataset
# --------------------------------------------------

print("Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Initial records: {len(df)}")


# --------------------------------------------------
# 2. Check required columns
# --------------------------------------------------

required_columns = ["text", "department"]

for column in required_columns:

    if column not in df.columns:
        raise ValueError(
            f"Missing required column: '{column}'"
        )

# Keep only required columns
df = df[required_columns].copy()


# --------------------------------------------------
# 3. Clean text and labels
# --------------------------------------------------

df["text"] = df["text"].astype(str).str.strip()
df["department"] = df["department"].astype(str).str.strip()

# Remove empty text
df = df[df["text"] != ""]

# Remove empty department
df = df[df["department"] != ""]


# --------------------------------------------------
# 4. Remove exact duplicate complaints
# --------------------------------------------------

before_duplicates = len(df)

df = df.drop_duplicates(
    subset=["text", "department"]
).reset_index(drop=True)

duplicates_removed = before_duplicates - len(df)

print(f"Duplicate records removed: {duplicates_removed}")
print(f"Records after cleaning: {len(df)}")


# --------------------------------------------------
# 5. Check department labels
# --------------------------------------------------

print("\nDepartment distribution:")

distribution = df["department"].value_counts()

for department in DEPARTMENTS:

    count = distribution.get(department, 0)

    print(f"{department}: {count}")


# Check for unexpected labels
unexpected = set(df["department"]) - set(DEPARTMENTS)

if unexpected:

    raise ValueError(
        f"Unexpected department labels found: {unexpected}"
    )


# --------------------------------------------------
# 6. Verify expected dataset
# --------------------------------------------------

if len(df) != EXPECTED_TOTAL:

    raise ValueError(
        f"Expected exactly {EXPECTED_TOTAL} records after cleaning, "
        f"but found {len(df)}."
    )


for department in DEPARTMENTS:

    count = len(
        df[df["department"] == department]
    )

    if count != EXPECTED_PER_DEPARTMENT:

        raise ValueError(
            f"{department} has {count} records. "
            f"Expected exactly {EXPECTED_PER_DEPARTMENT}."
        )


print(
    f"\n✓ Dataset contains exactly "
    f"{EXPECTED_TOTAL} records."
)

print(
    f"✓ Each department contains "
    f"{EXPECTED_PER_DEPARTMENT} records."
)


# --------------------------------------------------
# 7. Stratified 80/20 split
# --------------------------------------------------

train_df, test_df = train_test_split(
    df,
    test_size=0.20,
    random_state=42,
    stratify=df["department"]
)


# Reset indexes
train_df = train_df.reset_index(drop=True)
test_df = test_df.reset_index(drop=True)


# --------------------------------------------------
# 8. Verify split
# --------------------------------------------------

print("\nTraining distribution:")

train_distribution = train_df["department"].value_counts()

for department in DEPARTMENTS:

    count = train_distribution.get(department, 0)

    print(f"{department}: {count}")


print("\nTesting distribution:")

test_distribution = test_df["department"].value_counts()

for department in DEPARTMENTS:

    count = test_distribution.get(department, 0)

    print(f"{department}: {count}")


# --------------------------------------------------
# 9. Final size checks
# --------------------------------------------------

if len(train_df) != EXPECTED_TRAIN:

    raise ValueError(
        f"Training set should contain "
        f"{EXPECTED_TRAIN} records, "
        f"but contains {len(train_df)}."
    )


if len(test_df) != EXPECTED_TEST:

    raise ValueError(
        f"Testing set should contain "
        f"{EXPECTED_TEST} records, "
        f"but contains {len(test_df)}."
    )


# Check per-department split
for department in DEPARTMENTS:

    train_count = len(
        train_df[
            train_df["department"] == department
        ]
    )

    test_count = len(
        test_df[
            test_df["department"] == department
        ]
    )

    if (
        train_count != EXPECTED_TRAIN_PER_DEPARTMENT
        or
        test_count != EXPECTED_TEST_PER_DEPARTMENT
    ):

        raise ValueError(
            f"Incorrect split for {department}: "
            f"{train_count} train / "
            f"{test_count} test. "
            f"Expected "
            f"{EXPECTED_TRAIN_PER_DEPARTMENT} train / "
            f"{EXPECTED_TEST_PER_DEPARTMENT} test."
        )


print(
    "\n✓ Each department contains "
    f"{EXPECTED_TRAIN_PER_DEPARTMENT} training "
    f"and "
    f"{EXPECTED_TEST_PER_DEPARTMENT} testing records."
)


# --------------------------------------------------
# 10. Create output directory
# --------------------------------------------------

Path("dataset").mkdir(
    parents=True,
    exist_ok=True
)


# --------------------------------------------------
# 11. Save datasets
# --------------------------------------------------

train_df.to_csv(
    TRAIN_PATH,
    index=False,
    encoding="utf-8"
)

test_df.to_csv(
    TEST_PATH,
    index=False,
    encoding="utf-8"
)


# --------------------------------------------------
# 12. Final summary
# --------------------------------------------------

print("\n========================================")
print("DATASET SPLIT COMPLETED")
print("========================================")

print(f"Total records : {len(df)}")
print(f"Training      : {len(train_df)}")
print(f"Testing       : {len(test_df)}")

print("\nFiles created:")
print(f"✓ {TRAIN_PATH}")
print(f"✓ {TEST_PATH}")

