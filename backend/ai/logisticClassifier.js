
const fs = require("fs");
const path = require("path");

// ==========================================================
// Load exported Python model
// ==========================================================

const modelPath = path.join(
    __dirname,
    "ucms_model.json"
);

const model = JSON.parse(
    fs.readFileSync(modelPath, "utf8")
);

const tfidf = model.feature_extraction;
const classifier = model.classifier;


// ==========================================================
// Confidence Threshold
// ==========================================================

// If confidence is below 40%,
// the complaint requires manual routing.
const CONFIDENCE_THRESHOLD = 0.4;


// ==========================================================
// Stopwords
// ==========================================================

const stopwordSet = new Set(
    tfidf.stop_words || []
);


// ==========================================================
// Text preprocessing
// ==========================================================

function preprocessText(text) {

    let processed = String(text || "");

    // Match TfidfVectorizer(lowercase=True)
    if (tfidf.lowercase) {
        processed = processed.toLowerCase();
    }

    return processed;
}


// ==========================================================
// Tokenization
// ==========================================================

function tokenize(text) {

    const processed = preprocessText(text);

    /*
     * Matches the default scikit-learn token pattern:
     *
     * (?u)\b\w\w+\b
     *
     * Tokens must contain at least 2 characters.
     */

    const matches = processed.match(
        /[a-z0-9_]{2,}/g
    );

    if (!matches) {
        return [];
    }

    return matches;
}


// ==========================================================
// Stopword removal
// ==========================================================

function removeStopwords(tokens) {

    return tokens.filter(
        token => !stopwordSet.has(token)
    );
}


// ==========================================================
// Generate n-grams
// ==========================================================

function generateNgrams(tokens) {

    const ngrams = [];

    const minN =
        tfidf.ngram_range[0];

    const maxN =
        tfidf.ngram_range[1];

    for (
        let n = minN;
        n <= maxN;
        n++
    ) {

        for (
            let i = 0;
            i <= tokens.length - n;
            i++
        ) {

            ngrams.push(
                tokens
                    .slice(i, i + n)
                    .join(" ")
            );
        }
    }

    return ngrams;
}


// ==========================================================
// Create TF-IDF vector
// ==========================================================

function createTfidfVector(text) {

    // Tokenize
    let tokens =
        tokenize(text);

    // Remove English stopwords
    tokens =
        removeStopwords(tokens);

    // Generate 1-grams and 2-grams
    const ngrams =
        generateNgrams(tokens);

    // Create empty vector
    const vector =
        new Array(
            classifier.number_of_features
        ).fill(0);

    // Count terms
    const termCounts = {};

    for (const term of ngrams) {

        if (
            Object.prototype.hasOwnProperty.call(
                tfidf.vocabulary,
                term
            )
        ) {

            termCounts[term] =
                (termCounts[term] || 0) + 1;
        }
    }

    // Calculate TF-IDF
    for (
        const [term, count]
        of Object.entries(termCounts)
    ) {

        const index =
            tfidf.vocabulary[term];

        let termFrequency;

        if (tfidf.sublinear_tf) {

            // Matches sublinear_tf=True
            termFrequency =
                1 + Math.log(count);

        } else {

            termFrequency =
                count;
        }

        const idf =
            tfidf.idf[index];

        vector[index] =
            termFrequency * idf;
    }

    // L2 normalization
    if (tfidf.norm === "l2") {

        let norm = 0;

        for (const value of vector) {

            norm += value * value;
        }

        norm = Math.sqrt(norm);

        if (norm > 0) {

            for (
                let i = 0;
                i < vector.length;
                i++
            ) {

                vector[i] =
                    vector[i] / norm;
            }
        }
    }

    return vector;
}


// ==========================================================
// Dot product
// ==========================================================

function dotProduct(a, b) {

    let result = 0;

    for (
        let i = 0;
        i < a.length;
        i++
    ) {

        result +=
            a[i] * b[i];
    }

    return result;
}


// ==========================================================
// Softmax
// ==========================================================

function softmax(scores) {

    const maxScore =
        Math.max(...scores);

    const exponentials =
        scores.map(
            score =>
                Math.exp(
                    score - maxScore
                )
        );

    const total =
        exponentials.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    return exponentials.map(
        value =>
            value / total
    );
}


// ==========================================================
// Classify complaint
// ==========================================================

function classifyComplaint(text) {

    // Convert complaint to TF-IDF vector
    const vector =
        createTfidfVector(text);

    const scores = [];

    // Calculate score for every department
    for (
        let classIndex = 0;
        classIndex <
        classifier.number_of_classes;
        classIndex++
    ) {

        const weights =
            classifier.coefficients[
                classIndex
            ];

        const bias =
            classifier.intercepts[
                classIndex
            ];

        const score =
            dotProduct(
                vector,
                weights
            ) + bias;

        scores.push(score);
    }

    // Convert scores to probabilities
    const probabilities =
        softmax(scores);

    // Find highest probability
    let bestIndex = 0;

    for (
        let i = 1;
        i < probabilities.length;
        i++
    ) {

        if (
            probabilities[i] >
            probabilities[bestIndex]
        ) {

            bestIndex = i;
        }
    }

    // Highest probability is the confidence
    const confidence =
        probabilities[bestIndex];

    // Check whether manual routing is required
    const requiresReview =
        confidence < CONFIDENCE_THRESHOLD;

    return {

        // Predicted department
        department:
            classifier.classes[
                bestIndex
            ],

        // Confidence of prediction
        confidence,

        // True when confidence is below 40%
        // and backend should use manual routing.
        requiresReview,

        // Probability of every department
        probabilities:
            classifier.classes.map(
                (department, index) => ({
                    department,
                    probability:
                        probabilities[index]
                })
            )
    };
}


// ==========================================================
// Export
// ==========================================================

module.exports = {
    classifyComplaint,
    CONFIDENCE_THRESHOLD
};

