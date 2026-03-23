/* ================================================
   สำนักงานต้องสาป — PROGRESS ENGINE
   js/progress.js

   Saves and loads player progress using localStorage.
   Each player (by ID) has a separate save per exam type.
   So player 00003890 can have two saves:
     sanganSap_00003890_life
     sanganSap_00003890_nonlife
   
   Multiple players can share the same device safely.
   If localStorage is unavailable (private browsing,
   storage full), the game still works — just no saving.
   ================================================ */

const progress = (() => {

  /* Storage key prefix */
  const PREFIX = 'sanganSap_v2';

  /* Build the localStorage key for a player+examType */
  function _key(playerId, examType) {
    return `${PREFIX}_${playerId}_${examType}`;
  }


  /* ================================================
     SAVE
     Call this after every stage completion.
     Saves: stage1Passed, stageResults, timestamp.
     Returns true on success, false on failure.
     ================================================ */
  function save(playerId, examType, stateData) {
    if (!playerId || !examType) return false;
    try {
      const payload = {
        playerId,
        examType,
        stage1Passed: stateData.stage1Passed,
        stageResults: stateData.stageResults,
        savedAt:      Date.now(),   // Unix ms timestamp
      };
      localStorage.setItem(_key(playerId, examType), JSON.stringify(payload));
      return true;
    } catch (e) {
      // Storage quota exceeded or private browsing — fail silently
      console.warn('สำนักงานต้องสาป: Could not save progress.', e);
      return false;
    }
  }


  /* ================================================
     LOAD
     Returns the saved state object, or null if
     nothing is saved / data is corrupted.
     ================================================ */
  function load(playerId, examType) {
    if (!playerId || !examType) return null;
    try {
      const raw = localStorage.getItem(_key(playerId, examType));
      if (!raw) return null;

      const data = JSON.parse(raw);

      // Basic structure validation
      if (!data || typeof data.stageResults !== 'object') return null;

      return data;  // { playerId, examType, stage1Passed, stageResults, savedAt }
    } catch (e) {
      console.warn('สำนักงานต้องสาป: Could not load progress.', e);
      return null;
    }
  }


  /* ================================================
     HAS SAVED
     Quick boolean check — did this player save
     progress for this exam type on this device?
     ================================================ */
  function hasSaved(playerId, examType) {
    if (!playerId || !examType) return false;
    try {
      return !!localStorage.getItem(_key(playerId, examType));
    } catch (e) {
      return false;
    }
  }


  /* ================================================
     CLEAR
     Wipes the saved progress for a specific
     player+examType. Called when player chooses
     "เริ่มใหม่ตั้งแต่ต้น" on the continue screen.
     ================================================ */
  function clear(playerId, examType) {
    if (!playerId || !examType) return;
    try {
      localStorage.removeItem(_key(playerId, examType));
    } catch (e) {
      console.warn('สำนักงานต้องสาป: Could not clear progress.', e);
    }
  }


  /* ================================================
     FORMAT SAVED TIME
     Converts savedAt timestamp into a human-readable
     Thai relative time string for the continue screen.
     e.g. "10 นาทีที่แล้ว", "2 ชั่วโมงที่แล้ว"
     ================================================ */
  function formatSavedTime(savedAt) {
    if (!savedAt) return '';
    const diffMs  = Date.now() - savedAt;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1)   return 'เมื่อกี้นี้';
    if (diffMin < 60)  return `${diffMin} นาทีที่แล้ว`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)   return `${diffHr} ชั่วโมงที่แล้ว`;

    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} วันที่แล้ว`;
  }


  /* ================================================
     PUBLIC API
     ================================================ */
  return { save, load, hasSaved, clear, formatSavedTime };

})();