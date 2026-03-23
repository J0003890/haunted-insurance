// js/questions.js
// Firebase Firestore question fetching + randomization — Phase 5

const questions = (() => {

  /* ══════════════════════════════════════════
     RARITY CONFIG
     Colors locked in Phase 4
  ══════════════════════════════════════════ */
  const RARITY_CONFIG = {
    N: {
      label:     'N',
      name:      'Common',
      color:     '#c8c4b0',
      glowColor: 'rgba(200,196,176,0.4)',
      icon:      '📄',
      stars:     '',
    },
    R: {
      label:     'R',
      name:      'Rare',
      color:     '#e8a030',
      glowColor: 'rgba(232,160,48,0.5)',
      icon:      '📘',
      stars:     '★',
    },
    SR: {
      label:     'SR',
      name:      'Super Rare',
      color:     '#a855f7',
      glowColor: 'rgba(168,85,247,0.5)',
      icon:      '⭐',
      stars:     '★★',
    },
    UR: {
      label:     'UR',
      name:      'Ultra Rare',
      color:     '#FA4786',
      glowColor: 'rgba(250,71,134,0.5)',
      icon:      '💎',
      stars:     '★★★',
    },
  };

  /* ══════════════════════════════════════════
     GET RARITY CONFIG
  ══════════════════════════════════════════ */
  function getRarityConfig(rarity) {
    return RARITY_CONFIG[rarity] || RARITY_CONFIG['N'];
  }

  /* ══════════════════════════════════════════
     SHUFFLE — Fisher-Yates
  ══════════════════════════════════════════ */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ══════════════════════════════════════════
     FETCH FOR STAGE
     Queries Firestore → shuffles → picks `count`
  ══════════════════════════════════════════ */
  async function fetchForStage(examType, stageId, count) {
    const db = firebase.firestore();

    const snapshot = await db.collection('questions')
      .where('examType', '==', examType)
      .where('stageId',  '==', stageId)
      .get();

    if (snapshot.empty) {
      console.warn(
        `questions.js: No questions found — examType="${examType}", stageId=${stageId}`
      );
      return [];
    }

    const all      = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const shuffled = shuffle(all);
    return shuffled.slice(0, count);
  }

  /* ══════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════ */
  return {
    fetchForStage,
    getRarityConfig,
  };

})();