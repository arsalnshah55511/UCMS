import pandas as pd

OLD_DATASET = "dataset/ucms_complaints.csv"
NEW_DATASET = "dataset/new_complaints.csv"

OUTPUT_DATASET = "dataset/ucms_complaints_updated.csv"


# --------------------------------------------------
# Load old dataset
# --------------------------------------------------

old_df = pd.read_csv(OLD_DATASET)

print("Old dataset:", len(old_df), "records")


# --------------------------------------------------
# Load new dataset
# --------------------------------------------------

new_df = pd.read_csv(NEW_DATASET)

print("New dataset:", len(new_df), "records")


# --------------------------------------------------
# Check columns
# --------------------------------------------------

required_columns = ["text", "department"]

for column in required_columns:

    if column not in old_df.columns:
        raise ValueError(
            f"Old dataset missing column: {column}"
        )

    if column not in new_df.columns:
        raise ValueError(
            f"New dataset missing column: {column}"
        )


# --------------------------------------------------
# Keep required columns
# --------------------------------------------------

old_df = old_df[required_columns]
new_df = new_df[required_columns]


# --------------------------------------------------
# Combine
# --------------------------------------------------

df = pd.concat(
    [old_df, new_df],
    ignore_index=True
)

print("\nTotal before duplicate removal:", len(df))


# --------------------------------------------------
# Remove duplicates
# --------------------------------------------------

before = len(df)

df = df.drop_duplicates(
    subset=["text", "department"]
)

duplicates_removed = before - len(df)

print("Duplicates removed:", duplicates_removed)


# --------------------------------------------------
# Reset index
# --------------------------------------------------

df = df.reset_index(drop=True)


# --------------------------------------------------
# Save updated dataset
# --------------------------------------------------

df.to_csv(
    OUTPUT_DATASET,
    index=False,
    encoding="utf-8"
)


print("\n========================================")
print("OLD + NEW DATA COMBINED")
print("========================================")

print("Old records       :", len(old_df))
print("New records       :", len(new_df))
print("Final records     :", len(df))

print("\nDepartment distribution:")

print(df["department"].value_counts())

print("\nSaved to:")
print(OUTPUT_DATASET)