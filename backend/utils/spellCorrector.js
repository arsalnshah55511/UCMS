const nspell = require("nspell");
const dictionary = require("dictionary-en");

const {
    classifyComplaint
} = require("../ai/logisticClassifier");


// ==========================================================
// Urgent keywords
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


// ==========================================================
// Priority detection
// ==========================================================

function detectPriority(text) {

    const lowerText =
        text.toLowerCase();

    const isUrgent =
        urgentKeywords.some(
            keyword =>
                lowerText.includes(keyword)
        );

    return isUrgent
        ? "High"
        : "Medium";
}


// ==========================================================
// University-specific words
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


// ==========================================================
// Spell checker
// ==========================================================

let spellChecker = null;


// ==========================================================
// Load dictionary
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
                        word =>
                            spell.add(word)
                    );

                    resolve(spell);
                }
            );
        }
    );
}


// ==========================================================
// Confidence threshold
// ==========================================================

const CONFIDENCE_THRESHOLD = 0.4;


// ==========================================================
// Analyze complaint
// ==========================================================

async function analyzeComplaint(
    title,
    originalText
) {

    // Load spell checker once
    if (!spellChecker) {

        spellChecker =
            await loadSpellChecker();
    }


    // ------------------------------------------------------
    // Spelling correction
    // ------------------------------------------------------

    function correctText(text) {

        let preprocessedText =
            text || "";


        // Common chat abbreviations
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


        // Split text into words
        const words =
            preprocessedText.split(
                /\s+/
            );


        // Correct spelling
        const correctedWords =
            words.map(word => {

                const cleanWord =
                    word.replace(
                        /[^a-zA-Z']/g,
                        ""
                    );


                if (
                    cleanWord.length === 0
                ) {
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


    // ------------------------------------------------------
    // Correct complaint text
    // ------------------------------------------------------

    const correctedText =
        correctText(originalText);


    // ------------------------------------------------------
    // Correct title
    // ------------------------------------------------------

    const correctedTitle =
        correctText(title);


    // ------------------------------------------------------
    // Combine title and complaint
    // ------------------------------------------------------

    const combinedText =
        `${correctedTitle} ${correctedText}`;


    // ------------------------------------------------------
    // Detect priority
    // ------------------------------------------------------

    const priority =
        detectPriority(
            combinedText
        );


    // ------------------------------------------------------
    // ML classification
    //
    // Stopword removal is handled inside
    // logisticClassifier.js using the same
    // stopword list exported from Python.
    // ------------------------------------------------------

    const classification =
        classifyComplaint(
            combinedText
        );


    const department =
        classification.department;

    const confidence =
        classification.confidence;


    // ------------------------------------------------------
    // Confidence check
    // ------------------------------------------------------

    const requiresReview =
        confidence <
        CONFIDENCE_THRESHOLD;


    // ------------------------------------------------------
    // Return result
    // ------------------------------------------------------

    return {

        correctedText,

        department,

        confidence,

        priority,

        requiresReview
    };
}


// ==========================================================
// Export
// ==========================================================

module.exports = {
    analyzeComplaint,
    CONFIDENCE_THRESHOLD
};