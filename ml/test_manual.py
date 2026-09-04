
import joblib

# Load trained model
MODEL_PATH = "model/ucms_logistic_regression.joblib"

model = joblib.load(MODEL_PATH)

print("==========================================")
print("UCMS COMPLAINT CLASSIFIER")
print("==========================================")

print("Enter a complaint to test the model.")
print("Type 'exit' to stop.\n")


while True:

    complaint = input("Complaint: ").strip()

    if complaint.lower() == "exit":
        print("\nTesting finished.")
        break

    if not complaint:
        print("Please enter a complaint.\n")
        continue

    # Prediction
    prediction = model.predict(
        [complaint]
    )[0]

    # Probabilities
    probabilities = model.predict_proba(
        [complaint]
    )[0]

    classes = model.classes_

    # Get highest probability
    max_index = probabilities.argmax()

    confidence = probabilities[max_index]

    print("\n------------------------------------------")
    print("Prediction")
    print("------------------------------------------")

    print(f"Department : {prediction}")
    print(f"Confidence : {confidence * 100:.2f}%")

    print("\nDepartment probabilities:")

    for department, probability in sorted(
        zip(classes, probabilities),
        key=lambda x: x[1],
        reverse=True
    ):

        print(
            f"{department:30} "
            f"{probability * 100:.2f}%"
        )

    print("------------------------------------------\n")

