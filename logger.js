/* ================================================
   สำนักงานต้องสาป — ANSWER LOGGER
   js/logger.js

   Fire-and-forget analytics logger.
   Writes one document to Firestore answerLogs
   collection per answer event.

   Never awaited — never blocks gameplay.
   If write fails, it fails silently.
   ================================================ */

const logger = (() => {

  /* ================================================
     LOG ANSWER
     Called once per question answered.
     playerType / area / cohort / memberNo will be
     null in Phase 1 — populated in Phase 2 when
     the identity system is built.
     ================================================ */
  function logAnswer({
    questionId,
    playerId,
    playerType,
    area,
    cohort,
    memberNo,
    isCorrect,
    examType,
    stageId,
  }) {
    // Silently skip if Firebase isn't ready
    if (!window.db) return;

    const entry = {
      questionId:  questionId  || null,
      playerId:    playerId    || null,
      playerType:  playerType  || null,  // 'hq' | 'current' | 'newco'
      area:        area        || null,  // for 'current' only
      cohort:      cohort      || null,  // for 'newco' only
      memberNo:    memberNo    || null,  // for 'newco' only
      isCorrect,
      examType,
      stageId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // ★ FIRE AND FORGET — intentionally no await, no .catch() ★
    // Player experience never waits for analytics.
    window.db.collection('answerLogs').add(entry);
  }

  /* ================================================
     PUBLIC API
     ================================================ */
  return { logAnswer };

})();