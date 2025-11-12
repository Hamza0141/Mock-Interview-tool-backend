const conn = require("../config/db.config");

async function getUserReport(userId) {
  try {
    // 1) INTERVIEWS (simple: rely on meta_evaluation already stored)
    const [interviews] = await conn.query(
      `SELECT 
         i.interview_id AS id,
         'interview' AS type,
         i.job_title AS title,
         i.difficulty,
         i.status,
         i.meta_evaluation,
         i.behavioral_skill_tags,
         i.started_at,
         i.ended_at
       FROM interview_sessions AS i
       WHERE i.user_profile_id = ?
       ORDER BY i.started_at DESC`,
      [userId]
    );

    // 2) SPEECHES + LATEST feedback only (tiny subquery)
    const [speeches] = await conn.query(
      `SELECT 
         p.speech_id AS id,
         'speech' AS type,
         p.speech_title AS title,
         p.status,
         p.created_at AS started_at,
         p.created_at AS ended_at,
         sf.ai_feedback
       FROM public_speeches AS p
       LEFT JOIN (
         SELECT sf1.*
         FROM speech_feedback sf1
         INNER JOIN (
           SELECT speech_id, MAX(created_at) AS max_created
           FROM speech_feedback
           GROUP BY speech_id
         ) latest
         ON latest.speech_id = sf1.speech_id AND latest.max_created = sf1.created_at
       ) sf
       ON p.speech_id = sf.speech_id
       WHERE p.profile_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // Helpers
    const safeJSON = (v) => {
      try {
        if (!v) return null;
        return typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        return null;
      }
    };
    const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : n);

    // --- Process Interviews ---
    const processedInterviews = interviews.map((i) => {
      let average_score = 0;
      let metrics = { note: "awaiting evaluation" };
      let skills = [];

      const meta = safeJSON(i.meta_evaluation);
      if (meta && typeof meta === "object") {
        // Accept either meta.average_scores or legacy overall_score
        const avgScores = meta.average_scores;
        if (avgScores && typeof avgScores === "object") {
          metrics = {
            depth: round2(+avgScores.depth || 0),
            clarity: round2(+avgScores.clarity || 0),
            grammar: round2(+avgScores.grammar || 0),
            relevance: round2(+avgScores.relevance || 0),
            correctness: round2(+avgScores.correctness || 0),
            overall: round2(+avgScores.overall || 0),
          };
          average_score = metrics.overall || 0;
        } else if (Number.isFinite(+meta.overall_score)) {
          average_score = round2(+meta.overall_score);
          metrics = { overall: average_score };
        }
      }

      const tagList = safeJSON(i.behavioral_skill_tags);
      if (Array.isArray(tagList)) skills = tagList;

      return {
        id: i.id,
        type: i.type, // "interview"
        title: i.title,
        difficulty: i.difficulty, // interviews keep difficulty
        status: i.status,
        average_score,
        metrics,
        skills,
        started_at: i.started_at,
        ended_at: i.ended_at,
      };
    });

    // --- Process Speeches ---
    const processedSpeeches = speeches.map((s) => {
      // No difficulty for speeches (omit field entirely)
      let average_score = 0;
      let metrics = { note: "awaiting evaluation" };

      const fb = safeJSON(s.ai_feedback);
      const sc = fb?.scores;
      if (sc && typeof sc === "object") {
        metrics = {
          structure: round2(+sc.structure || 0),
          clarity: round2(+sc.clarity || 0),
          tone: round2(+sc.tone || 0),
          engagement: round2(+sc.engagement || 0),
          persuasiveness: round2(+sc.persuasiveness || 0),
          grammar: round2(+sc.grammar || 0),
          overall: round2(+sc.overall || 0),
        };
        average_score = metrics.overall || 0;
      }

      return {
        id: s.id,
        type: s.type, // "speech"
        title: s.title,
        status: s.status,
        average_score,
        metrics,
        skills: [], // can be filled later if needed
        started_at: s.started_at,
        ended_at: s.ended_at,
      };
    });

    // --- Combine & Sort Recent ---
    const recent = [...processedInterviews, ...processedSpeeches].sort(
      (a, b) => new Date(b.started_at) - new Date(a.started_at)
    );

    // --- Compute Averages (only evaluated items > 0) ---
    const iScores = processedInterviews
      .map((x) => (x.average_score > 0 ? x.average_score : null))
      .filter((n) => n !== null);
    const sScores = processedSpeeches
      .map((x) => (x.average_score > 0 ? x.average_score : null))
      .filter((n) => n !== null);

    const performanceComparison = {
      interviews: {
        avgScore: iScores.length
          ? round2(iScores.reduce((a, b) => a + b, 0) / iScores.length)
          : 0,
        count: processedInterviews.length,
      },
      speeches: {
        avgScore: sScores.length
          ? round2(sScores.reduce((a, b) => a + b, 0) / sScores.length)
          : 0,
        count: processedSpeeches.length,
      },
    };

    return {
      success: true,
      data: {
        performanceComparison,
        recent,
      },
    };
  } catch (err) {
    console.error("❌ Error building report:", err.message);
    return {
      success: false,
      message: "Failed to build user report.",
      data: null,
    };
  }
}

module.exports = {
  getUserReport,
};
