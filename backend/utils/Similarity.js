const natural = require("natural");
const { TfIdf } = natural;

// Cosine similarity between two TF-IDF term-weight vectors (plain objects
// of term -> weight, as produced by buildVector() below).
function cosineSimilarity(vecA, vecB) {
    const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

    let dot = 0;
    let magA = 0;
    let magB = 0;

    terms.forEach((term) => {
        const a = vecA[term] || 0;
        const b = vecB[term] || 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
    });

    if (magA === 0 || magB === 0) return 0;

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Similarity score above which two complaints are considered related.
// Kept conservative — complaint text is short, so TF-IDF vectors are
// sparse and even genuinely similar complaints won't score extremely high.
const SIMILARITY_THRESHOLD = 0.35;

// How far back to look when comparing against existing complaints, so
// this doesn't get slower as a department's history grows indefinitely.
const LOOKBACK_DAYS = 90;

/**
 * Compares a new complaint's text against other open complaints in the
 * same department (any submitter) and returns the ones judged similar.
 * Used to flag likely duplicate/recurring issues for staff — students
 * never see this.
 *
 * @param {string} text - combined title + text of the new complaint
 * @param {string} department
 * @param {Object} Complaint - the mongoose model (passed in rather than
 *        required directly, to avoid a circular require with the model file)
 * @param {string|null} excludeId - the new complaint's own _id, once saved
 * @returns {Promise<Array<{ complaint: Object, score: number }>>}
 */
async function findSimilarComplaints(text, department, Complaint, excludeId = null) {

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const candidates = await Complaint.find({
        department,
        status: { $ne: "Rejected" },
        createdAt: { $gte: since },
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("title correctedText originalText");

    if (candidates.length === 0) return [];

    const tfidf = new TfIdf();

    // Document 0 is always the new complaint's text; candidates follow,
    // so their index in `candidates` is always (tfidf index - 1).
    tfidf.addDocument(text);
    candidates.forEach((c) => {
        tfidf.addDocument(`${c.title} ${c.correctedText || c.originalText}`);
    });

    function buildVector(docIndex) {
        const vector = {};
        tfidf.listTerms(docIndex).forEach((item) => {
            vector[item.term] = item.tfidf;
        });
        return vector;
    }

    const newVector = buildVector(0);

    return candidates
        .map((c, i) => ({
            complaint: c,
            score: cosineSimilarity(newVector, buildVector(i + 1)),
        }))
        .filter((entry) => entry.score >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.score - a.score);
}

module.exports = {
    findSimilarComplaints,
    SIMILARITY_THRESHOLD,
};