const natural = require("natural");

const classifier = new natural.BayesClassifier();

/* Academic */

classifier.addDocument(
    "teacher did not mark attendance",
    "Academic"
);

classifier.addDocument(
    "exam date sheet issue",
    "Academic"
);

classifier.addDocument(
    "marks are incorrect",
    "Academic"
);

classifier.addDocument(
    "course registration problem",
    "Academic"
);

/* IT */

classifier.addDocument(
    "wifi not working",
    "IT Services"
);

classifier.addDocument(
    "internet is slow",
    "IT Services"
);

classifier.addDocument(
    "printer is not working",
    "IT Services"
);

classifier.addDocument(
    "computer lab issue",
    "IT Services"
);

/* Hostel */

classifier.addDocument(
    "fan not working in hostel room",
    "Hostel/Provost Office"
);

classifier.addDocument(
    "water shortage in hostel",
    "Hostel/Provost Office"
);

classifier.addDocument(
    "washroom is dirty",
    "Hostel/Provost Office"
);

classifier.addDocument(
    "mess food quality is poor",
    "Hostel/Provost Office"
);

/* Maintenance */

classifier.addDocument(
    "light is not working",
    "Maintenance & Facilities"
);

classifier.addDocument(
    "water leakage in classroom",
    "Maintenance & Facilities"
);

classifier.addDocument(
    "broken chair",
    "Maintenance & Facilities"
);

classifier.addDocument(
    "electricity problem",
    "Maintenance & Facilities"
);

/* Administrative */

classifier.addDocument(
    "fee voucher problem",
    "Administrative Offices"
);

classifier.addDocument(
    "scholarship issue",
    "Administrative Offices"
);

classifier.addDocument(
    "admission office issue",
    "Administrative Offices"
);

classifier.addDocument(
    "transcript request",
    "Administrative Offices"
);

classifier.train();

module.exports = classifier;