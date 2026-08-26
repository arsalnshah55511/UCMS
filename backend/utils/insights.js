function daysAgo(date) {
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function generateInsights(complaints) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const thisWeek = complaints.filter(
        (c) => now - new Date(c.createdAt).getTime() <= 7 * oneDay
    );
    const lastWeek = complaints.filter((c) => {
        const age = now - new Date(c.createdAt).getTime();
        return age > 7 * oneDay && age <= 14 * oneDay;
    });

    const totalThisWeek = thisWeek.length;
    const totalLastWeek = lastWeek.length;

    // --- Volume trend sentence ---
    let trendSentence;
    if (totalLastWeek === 0) {
        trendSentence = totalThisWeek > 0
            ? `${totalThisWeek} complaint${totalThisWeek === 1 ? "" : "s"} were submitted this week.`
            : "No complaints have been submitted this week.";
    } else {
        const percentChange = Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100);
        const direction = percentChange >= 0 ? "up" : "down";
        trendSentence = `${totalThisWeek} complaint${totalThisWeek === 1 ? "" : "s"} were submitted this week, ${direction} ${Math.abs(percentChange)}% from last week.`;
    }

    // --- Department breakdown sentence (this week only) ---
    const deptCounts = {};
    thisWeek.forEach((c) => {
        deptCounts[c.department] = (deptCounts[c.department] || 0) + 1;
    });

    const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

    let deptSentence = "";
    if (sortedDepts.length > 0 && totalThisWeek > 0) {
        const topTwo = sortedDepts.slice(0, 2);
        const topCombinedCount = topTwo.reduce((sum, [, count]) => sum + count, 0);
        const topPercent = Math.round((topCombinedCount / totalThisWeek) * 100);
        const deptNames = topTwo.map(([name]) => name).join(" and ");
        deptSentence = ` ${deptNames} account${topTwo.length === 1 ? "s" : ""} for ${topPercent}% of this week's volume.`;
    }

    // --- Unresolved High priority sentence (system-wide, not just this week) ---
    const unresolvedHighPriority = complaints.filter(
        (c) => c.priority === "High" && (c.status === "Pending" || c.status === "In-Process")
    );

    let prioritySentence = "";
    if (unresolvedHighPriority.length > 0) {
        const oldest = unresolvedHighPriority.reduce((oldest, c) =>
            new Date(c.createdAt) < new Date(oldest.createdAt) ? c : oldest
        );
        const oldestDays = daysAgo(oldest.createdAt);
        prioritySentence = ` ${unresolvedHighPriority.length} High priority complaint${
            unresolvedHighPriority.length === 1 ? " remains" : "s remain"
        } unresolved, the oldest for ${oldestDays} day${oldestDays === 1 ? "" : "s"}.`;
    }

    const summary = `${trendSentence}${deptSentence}${prioritySentence}`;

    return {
        summary,
        totalThisWeek,
        totalLastWeek,
        topDepartments: sortedDepts.slice(0, 3).map(([department, count]) => ({ department, count })),
        unresolvedHighPriorityCount: unresolvedHighPriority.length,
    };
}

module.exports = { generateInsights };