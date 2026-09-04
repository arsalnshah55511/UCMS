
const nspell = require("nspell");
const dictionary = require("dictionary-en");

// NEW: Logistic Regression classifier
const {
    classifyComplaint
} = require("../ai/logisticClassifier");



// ==========================================================
// Priority Detection
// ==========================================================

const urgentKeywords = [
    "urgent",
    "emergency",
    "immediately",
    "asap",
    "dangerous",
    "danger",
    "fire",
    "unsafe",
    "injured",
    "injury",
    "critical",
    "burning",
    "smoke",
    "electrocution",
    "leak",
    "flooding"
];


function detectPriority(text) {

    const lowerText =
        text.toLowerCase();

    const isUrgent =
        urgentKeywords.some(
            (keyword) =>
                lowerText.includes(keyword)
        );

    return isUrgent
        ? "High"
        : "Medium";
}


// ==========================================================
// Classification Stopwords
// ==========================================================

const classificationStopwords = new Set([
    "a",
    "an",
    "the",
    "in",
    "of",
    "on",
    "at",
    "to",
    "for",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "no",
    "not",
    "our",
    "this",
    "that",
    "it",
    "its",
    "and",
    "or",
    "but",
    "with",
    "from",
    "as",
    "by",
    "department",
    "there",
    "here",
    "problem",
    "issue",
    "complaint",
    "please",
    "repair",
    "repaired",
    "fix",
    "fixed",
    "resolve",
    "resolved",
    "help"
]);


function stripStopwordsForClassification(text) {

    return text
        .split(/\s+/)
        .filter(
            (word) =>
                !classificationStopwords.has(
                    word.toLowerCase()
                )
        )
        .join(" ");
}


// ==========================================================
// Domain-specific words for spell checker
// ==========================================================

const domainWords = [
    "wifi",
    "hostel",
    "app",
    "login",
    "portal",
    "chalan",
    "challan",
    "provost",
    "vc",
    "hod"
];


let spellChecker = null;


// ==========================================================
// Load Spell Checker
// ==========================================================

function loadSpellChecker() {

    return new Promise(
        (resolve, reject) => {

            dictionary(
                (err, dict) => {

                    if (err) {
                        reject(err);
                        return;
                    }

                    const spell =
                        nspell(dict);

                    domainWords.forEach(
                        (word) => {
                            spell.add(word);
                        }
                    );

                    resolve(spell);
                }
            );
        }
    );
}


// ==========================================================
// Confidence Threshold
// ==========================================================

const CONFIDENCE_THRESHOLD = 0.4;


// ==========================================================
// Analyze Complaint
// ==========================================================

async function analyzeComplaint(
    title,
    originalText
) {

    // ------------------------------------------
    // Load spell checker once
    // ------------------------------------------

    if (!spellChecker) {
        spellChecker =
            await loadSpellChecker();
    }


    // ------------------------------------------
    // Spell correction
    // ------------------------------------------

    function correctText(text) {

        let preprocessedText =
            text || "";

        // Common typing shortcuts
        preprocessedText =
            preprocessedText.replace(
                /\bnt\b/gi,
                "not"
            );

        preprocessedText =
            preprocessedText.replace(
                /\bplz\b/gi,
                "please"
            );


        const words =
            preprocessedText.split(/\s+/);


        const correctedWords =
            words.map((word) => {

                const cleanWord =
                    word.replace(
                        /[^a-zA-Z']/g,
                        ""
                    );


                if (cleanWord.length === 0) {
                    return word;
                }


                // Word is already correct
                if (
                    spellChecker.correct(
                        cleanWord
                    )
                ) {
                    return word;
                }


                // Try spelling suggestions
                const suggestions =
                    spellChecker.suggest(
                        cleanWord
                    );


                if (
                    suggestions.length > 0
                ) {
                    return suggestions[0];
                }


                return word;
            });


        return correctedWords.join(" ");
    }


    // ------------------------------------------
    // Correct title and complaint
    // ------------------------------------------

    const correctedText =
        correctText(originalText);

    const correctedTitle =
        correctText(title);


    // ------------------------------------------
    // Combine title + complaint
    // ------------------------------------------

    const combinedText =
        `${correctedTitle} ${correctedText}`;


    // ------------------------------------------
    // Detect priority
    // ------------------------------------------

    const priority =
        detectPriority(combinedText);


    // ------------------------------------------
    // Prepare classification text
    // ------------------------------------------

    const classificationInput =
        stripStopwordsForClassification(
            combinedText
        );


    // ------------------------------------------
    // Logistic Regression prediction
    // ------------------------------------------

    const classification =
        classifyComplaint(
            classificationInput
        );


    const department =
        classification.department;


    const confidence =
        classification.confidence;


    // ------------------------------------------
    // Determine review status
    // ------------------------------------------

    const requiresReview =
        confidence <
        CONFIDENCE_THRESHOLD;


    // ------------------------------------------
    // Return AI analysis
    // ------------------------------------------

    return {

        correctedText,

        department,

        confidence,

        priority,

        requiresReview
    };
}


// ==========================================================
// Exports
// ==========================================================

module.exports = {

    analyzeComplaint,

    CONFIDENCE_THRESHOLD
};

