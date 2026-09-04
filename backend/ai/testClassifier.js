
const {
    classifyComplaint
} = require("./logisticClassifier");

const complaints = [

    "The WiFi in the computer lab is extremely slow",

    "My examination result has not been uploaded",

    "The fan in my hostel room is broken",

    "There is no electricity in our classroom",

    "My scholarship application is still pending"
];

for (const complaint of complaints) {

    const result =
        classifyComplaint(complaint);

    console.log("\n================================");

    console.log(
        "Complaint:",
        complaint
    );

    console.log(
        "Department:",
        result.department
    );

    console.log(
        "Confidence:",
        (result.confidence * 100).toFixed(2) + "%"
    );

    console.log("\nProbabilities:");

    result.probabilities
        .sort(
            (a, b) =>
                b.probability - a.probability
        )
        .forEach(item => {

            console.log(
                `${item.department}: ` +
                `${(item.probability * 100).toFixed(2)}%`
            );
        });
}

