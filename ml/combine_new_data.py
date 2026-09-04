import pandas as pd
from pathlib import Path

# Folder containing the 5 new CSV files
NEW_DATA_FOLDER = "dataset/new_data"

# Output file
OUTPUT_FILE = "dataset/new_complaints.csv"


# --------------------------------------------------
# 1. Find all CSV files
# --------------------------------------------------

csv_files = list(Path(NEW_DATA_FOLDER).glob("*.csv"))

print("CSV files found:", len(csv_files))

if len(csv_files) != 5:
    raise ValueError(
        f"Expected 5 CSV files, but found {len(csv_files)}"
    )


# --------------------------------------------------
# 2. Read each CSV
# --------------------------------------------------

dataframes = []

for file in csv_files:

    print(f"Reading: {file}")

    df = pd.read_csv(file)

    print(f"   Records: {len(df)}")
    print(f"   Columns: {list(df.columns)}")

    dataframes.append(df)


# --------------------------------------------------
# 3. Check columns
# --------------------------------------------------

required_columns = ["text", "department"]

for i, df in enumerate(dataframes, start=1):

    for column in required_columns:

        if column not in df.columns:
            raise ValueError(
                f"File {i} is missing column: {column}"
            )


# --------------------------------------------------
# 4. Keep required columns
# --------------------------------------------------

dataframes = [
    df[required_columns].copy()
    for df in dataframes
]


# --------------------------------------------------
# 5. Combine all 5 files
# --------------------------------------------------

combined_df = pd.concat(
    dataframes,
    ignore_index=True
)

print("\nRecords before cleaning:", len(combined_df))


# --------------------------------------------------
# 6. Clean text and department
# --------------------------------------------------

combined_df["text"] = (
    combined_df["text"]
    .astype(str)
    .str.strip()
)

combined_df["department"] = (
    combined_df["department"]
    .astype(str)
    .str.strip()
)


# --------------------------------------------------
# 7. Remove empty records
# --------------------------------------------------

combined_df = combined_df[
    (combined_df["text"] != "") &
    (combined_df["department"] != "")
]


# --------------------------------------------------
# 8. Remove duplicate complaints
# --------------------------------------------------

before = len(combined_df)

combined_df = combined_df.drop_duplicates(
    subset=["text", "department"]
)

duplicates_removed = before - len(combined_df)

print("Duplicates removed:", duplicates_removed)


# --------------------------------------------------
# 9. Reset index
# --------------------------------------------------

combined_df = combined_df.reset_index(drop=True)


# --------------------------------------------------
# 10. Department distribution
# --------------------------------------------------

print("\nDepartment distribution:")

print(
    combined_df["department"].value_counts()
)


# --------------------------------------------------
# 11. Save
# --------------------------------------------------

combined_df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8"
)


# --------------------------------------------------
# 12. Final information
# --------------------------------------------------

print("\n========================================")
print("NEW DATASET COMBINED SUCCESSFULLY")
print("========================================")

print("Files combined :", len(csv_files))
print("Total records  :", len(combined_df))
print("Output file    :", OUTPUT_FILE)