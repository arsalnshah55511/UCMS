const natural = require("natural");
const nspell = require("nspell");
const dictionary = require("dictionary-en");

const classifier = new natural.BayesClassifier();

function generateTrainingPairs(subjects, problems, label) {
    subjects.forEach((subject) => {
        problems.forEach((problem) => {
            classifier.addDocument(`${subject} ${problem}`, label);
        });
    });
}

// ---------- Academic ----------
generateTrainingPairs(
    [
        "marks", "result", "results", "attendance", "exam", "exams", "grading",
        "lecture", "assignment", "gpa", "cgpa", "transcript", "semester",
        "quiz", "midterm", "final exam", "paper checking", "class schedule",
        "timetable", "course registration", "credit hours", "thesis",
        "supervisor", "grade", "roll number", "enrollment"
    ],
    [
        "not updated", "delayed", "wrong", "not declared", "missing",
        "incorrect", "not checked", "cancelled without notice",
        "not uploaded", "not announced", "error", "not available",
        "conflict", "not assigned", "issue", "problem", "complaint",
        "needs correction", "pending", "not responding"
    ],
    "Academic"
);

// ---------- IT Services ----------
generateTrainingPairs(
    [
        "wifi", "internet", "computer", "computers", "printer", "network",
        "portal", "projector", "login", "website", "system", "server",
        "email", "password", "student portal", "lms", "lab computer",
        "software", "laptop", "monitor", "keyboard", "mouse", "scanner",
        "id card system", "biometric attendance"
    ],
    [
        "not working", "very slow", "not turning on", "down", "unable to access",
        "broken", "not responding", "crashed", "frozen", "error", "not loading",
        "connection lost", "not installed", "outdated", "malfunctioning",
        "issue", "problem", "not functioning"
    ],
    "IT Services"
);

// ---------- Hostel/Provost Office ----------
// ---------- Hostel/Provost Office ----------
generateTrainingPairs(
    [
        "hostel room", "fan", "washroom", "mess food", "bed", "roommate",
        "warden", "hot water", "hostel bathroom", "hostel gate", "curfew",
        "hostel security", "laundry", "room allocation",
        "mattress", "hostel mess", "common room", "hostel cleanliness",
        "water cooler", "hostel electricity", "roommate conflict"
    ],
    [
        "not working", "broken", "dirty", "very bad", "needs repair",
        "not available", "unsafe", "unresponsive",
        "not resolved", "not clean", "delayed", "unfair"
    ],
    "Hostel/Provost Office"
);

// ---------- Maintenance & Facilities ----------
generateTrainingPairs(
    [
        "electricity", "power", "water", "light", "fan", "ac",
        "air conditioner", "chair", "table", "furniture", "washroom tap",
        "ceiling", "building", "classroom door", "window", "elevator",
        "staircase", "parking area", "generator", "plumbing", "drainage",
        "roof", "wall", "flooring", "heater", "sockets", "wiring"
    ],
    [
        "not working", "broken", "not turning on", "cut off", "leaking",
        "damaged", "fused", "not cooling", "outage", "needs repair",
        "malfunctioning", "unsafe", "loose", "cracked", "blocked",
        "not functioning", "issue", "problem"
    ],
    "Maintenance & Facilities"
);

// ---------- Administrative Offices ----------
generateTrainingPairs(
    [
        "fee", "scholarship", "admission", "transcript", "refund",
        "student card", "documents", "office", "fee challan", "bank challan",
        "hostel fee", "tuition fee", "financial aid", "degree", "certificate",
        "character certificate", "migration certificate", "bonafide certificate",
        "accounts office", "registrar office", "admission office"
    ],
    [
        "not processed", "wrong amount", "delayed", "not issued",
        "not responding", "generated incorrectly", "missing", "rejected",
        "pending", "not approved", "error", "not received", "incomplete",
        "issue", "problem", "not updated"
    ],
    "Administrative Offices"
);

classifier.train();

// Words that signal a complaint needs urgent attention
const urgentKeywords = [
    "urgent", "emergency", "immediately", "asap", "dangerous",
    "danger", "fire", "unsafe", "injured", "injury", "critical",
    "burning", "smoke", "electrocution", "leak", "flooding"
];

function detectPriority(text) {
    const lowerText = text.toLowerCase();
    const isUrgent = urgentKeywords.some((keyword) => lowerText.includes(keyword));
    return isUrgent ? "High" : "Medium";
}

const classificationStopwords = new Set([
    "a", "an", "the", "in", "of", "on", "at", "to", "for", "is", "are",
    "was", "were", "be", "been", "no", "not", "our", "this", "that",
    "it", "its", "and", "or", "but", "with", "from", "as", "by",
    "department", "there", "here",
    "problem", "issue", "complaint", "please",
    "repair", "repaired", "fix", "fixed", "resolve", "resolved", "help"
]);

function stripStopwordsForClassification(text) {
    return text
        .split(/\s+/)
        .filter((word) => !classificationStopwords.has(word.toLowerCase()))
        .join(" ");
}

const domainWords = [
    "wifi", "hostel", "app", "login", "portal", "chalan", "challan",
    "provost", "vc", "hod"
];

let spellChecker = null;

function loadSpellChecker() {
    return new Promise((resolve, reject) => {
        dictionary((err, dict) => {
            if (err) {
                reject(err);
                return;
            }
            const spell = nspell(dict);

            domainWords.forEach((word) => {
                spell.add(word);
            });

            resolve(spell);
        });
    });
}

async function analyzeComplaint(title, originalText) {

    if (!spellChecker) {
        spellChecker = await loadSpellChecker();
    }

    function correctText(text) {
        let preprocessedText = text;
        preprocessedText = preprocessedText.replace(/\bnt\b/gi, "not");
        preprocessedText = preprocessedText.replace(/\bplz\b/gi, "please");

        const words = preprocessedText.split(/\s+/);

        const correctedWords = words.map((word) => {
            const cleanWord = word.replace(/[^a-zA-Z']/g, "");

            if (cleanWord.length === 0) {
                return word;
            }

            if (spellChecker.correct(cleanWord)) {
                return word;
            }

            const suggestions = spellChecker.suggest(cleanWord);

            if (suggestions.length > 0) {
                return suggestions[0];
            }

            return word;
        });

        return correctedWords.join(" ");
    }

    const correctedText = correctText(originalText);
    const correctedTitle = correctText(title);

    const combinedText = `${correctedTitle} ${correctedText}`;

    const priority = detectPriority(combinedText);

    const classificationInput = stripStopwordsForClassification(combinedText);

    const classifications = classifier.getClassifications(classificationInput);
    const department = classifications[0].label;

    const totalScore = classifications.reduce((sum, c) => sum + c.value, 0);
    const confidence = totalScore > 0
        ? classifications[0].value / totalScore
        : 0;

    return {
        correctedText,
        department,
        confidence,
        priority
    };
}

module.exports = {
    analyzeComplaint
};