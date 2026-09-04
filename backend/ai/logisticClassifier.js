const fs = require("fs");
const path = require("path");

// --------------------------------------------------
// Load exported scikit-learn model
// --------------------------------------------------

const modelPath = path.join(
    __dirname,
    "ucms_model.json"
);

const model = JSON.parse(
    fs.readFileSync(modelPath, "utf8")
);

const tfidf = model.feature_extraction;
const classifier = model.classifier;


// --------------------------------------------------
// Text preprocessing
// --------------------------------------------------

function preprocessText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


// --------------------------------------------------
// Tokenization
// --------------------------------------------------

function tokenize(text) {
    return preprocessText(text)
        .split(/\s+/)
        .filter(Boolean);
}


// --------------------------------------------------
// Generate unigrams + bigrams
// --------------------------------------------------

function generateNgrams(tokens) {

    const ngrams = [];

    // Unigrams
    for (const token of tokens) {
        ngrams.push(token);
    }

    // Bigrams
    for (let i = 0; i < tokens.length - 1; i++) {
        ngrams.push(
            `${tokens[i]} ${tokens[i + 1]}`
        );
    }

    return ngrams;
}


// --------------------------------------------------
// Calculate TF-IDF vector
// --------------------------------------------------

function createTfidfVector(text) {

    const tokens = tokenize(text);

    const ngrams = generateNgrams(tokens);

    const vector = new Array(
        classifier.number_of_features
    ).fill(0);

    // Count terms
    const termCounts = {};

    for (const term of ngrams) {

        if (tfidf.vocabulary[term] !== undefined) {

            termCounts[term] =
                (termCounts[term] || 0) + 1;
        }
    }

    const totalTerms = ngrams.length;

    if (totalTerms === 0) {
        return vector;
    }

    // --------------------------------------------------
    // TF-IDF
    // --------------------------------------------------

    for (const [term, count] of Object.entries(
        termCounts
    )) {

        const index = tfidf.vocabulary[term];

        const tf =
            count / totalTerms;

        // sublinear_tf=True
        const sublinearTf =
            1 + Math.log(count);

        const idf =
            tfidf.idf[index];

        vector[index] =
            sublinearTf * idf;
    }

    // --------------------------------------------------
    // L2 normalization
    // --------------------------------------------------

    let norm = 0;

    for (const value of vector) {
        norm += value * value;
    }

    norm = Math.sqrt(norm);

    if (norm > 0) {

        for (let i = 0; i < vector.length; i++) {
            vector[i] /= norm;
        }
    }

    return vector;
}


// --------------------------------------------------
// Dot product
// --------------------------------------------------

function dotProduct(a, b) {

    let result = 0;

    for (let i = 0; i < a.length; i++) {
        result += a[i] * b[i];
    }

    return result;
}


// --------------------------------------------------
// Softmax
// --------------------------------------------------

function softmax(scores) {

    const maxScore = Math.max(...scores);

    const expScores = scores.map(
        score => Math.exp(score - maxScore)
    );

    const total = expScores.reduce(
        (sum, value) => sum + value,
        0
    );

    return expScores.map(
        value => value / total
    );
}


// --------------------------------------------------
// Predict department
// --------------------------------------------------

function classifyComplaint(text) {

    const vector = createTfidfVector(text);

    const scores = [];

    for (
        let classIndex = 0;
        classIndex < classifier.number_of_classes;
        classIndex++
    ) {

        const weights =
            classifier.coefficients[classIndex];

        const bias =
            classifier.intercepts[classIndex];

        const score =
            dotProduct(vector, weights) + bias;

        scores.push(score);
    }

    const probabilities =
        softmax(scores);

    let bestIndex = 0;

    for (let i = 1; i < probabilities.length; i++) {

        if (
            probabilities[i] >
            probabilities[bestIndex]
        ) {
            bestIndex = i;
        }
    }

    return {
        department: classifier.classes[bestIndex],

        confidence:
            probabilities[bestIndex],

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


// --------------------------------------------------
// Export
// --------------------------------------------------

module.exports = {
    classifyComplaint
};

