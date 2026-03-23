/* ================================================
   สำนักงานต้องสาป — GAME CONTROLLER
   js/game.js
   Phase 4: Real Firebase questions + Rarity system
   ================================================ */


/* ================================================
   STAGE DEFINITIONS
   ================================================ */
const STAGES = {
  life: [
    { id: 1, name: 'จรรยาบรรณประกันชีวิต',    emoji: '💙', questionCount: 10, mustPass: true  },
    { id: 2, name: 'หลักการประกันชีวิต',        emoji: '👻', questionCount: 20, mustPass: false },
    { id: 3, name: 'ประมวลกฎหมายแพ่งชีวิต',    emoji: '⚖',  questionCount: 5,  mustPass: false },
    { id: 4, name: 'พ.ร.บ. ชีวิต',             emoji: '💸', questionCount: 5,  mustPass: false },
  ],
  nonlife: [
    { id: 1, name: 'จรรยาบรรณประกันวินาศภัย',  emoji: '🤍', questionCount: 10, mustPass: true  },
    { id: 2, name: 'หลักการประกันวินาศภัย',      emoji: '😚', questionCount: 5,  mustPass: false },
    { id: 3, name: 'ประมวลกฎหมายแพ่งวินาศภัย',  emoji: '⚖',  questionCount: 10, mustPass: false },
    { id: 4, name: 'พ.ร.บ. วินาศภัย',           emoji: '💸', questionCount: 10, mustPass: false },
    { id: 5, name: 'ประกันอัคคีภัย',            emoji: '🔥', questionCount: 5,  mustPass: false },
    { id: 6, name: 'ประกันตัวเรือและขนส่ง',      emoji: '🚢', questionCount: 5,  mustPass: false },
    { id: 7, name: 'ประกันภัยรถยนต์',           emoji: '🚗', questionCount: 5,  mustPass: false },
    { id: 8, name: 'ประกันภัยเบ็ดเตล็ด',        emoji: '🐄', questionCount: 5,  mustPass: false },
  ]
};

const POINTS_PER_QUESTION   = 2;
const STAGE1_PASS_THRESHOLD = 7;


/* ================================================
   GAME STATE
   ================================================ */
let gameState = {
  examType:       null,
  playerId:       null,
  playerType:     null,   // ← NEW: 'hq' | 'current' | 'newco' (Phase 2 fills this)
  area:           null,   // ← NEW: region, for 'current' players only
  cohort:         null,   // ← NEW: รุ่น, for 'newco' players only
  memberNo:       null,   // ← NEW: เลขที่, for 'newco' players only
  currentStageId: null,
  stageResults:   {},
  stage1Passed:   false,
  ambientStarted: false,
};


/* ================================================
   SCREEN NAVIGATION
   ================================================ */
function showScreen(screenId) {
  audio.init();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  // ★ Show black cat admin button only on welcome screen ★
  const catBtn = document.querySelector('.admin-cat-btn');
  if (catBtn) {
    catBtn.style.display = (screenId === 'screen-welcome') ? '' : 'none';
  }
}


/* ================================================
   SCREEN 2 — SELECT EXAM TYPE
   ================================================ */
function selectExam(type) {
  gameState.examType = type;
  document.getElementById('employee-id-input').value = '';
  document.getElementById('input-error').classList.add('hidden');
  showScreen('screen-enter-id');
}
/* ================================================
   SCREEN 2 — SELECT PLAYER TYPE
   ================================================ */
function selectPlayerType(type) {
  gameState.playerType = type;

  if (type === 'hq') {
    document.getElementById('hq-id-input').value = '';
    document.getElementById('hq-id-error').classList.add('hidden');
    showScreen('screen-hq-id');
  } else if (type === 'current') {
    showScreen('screen-current-area');
  } else if (type === 'newco') {
    document.getElementById('newco-cohort-input').value = '';
    document.getElementById('newco-member-input').value = '';
    document.getElementById('newco-error').classList.add('hidden');
    showScreen('screen-newco-id');
  }
}


/* ================================================
   SCREEN 2A — HQ: CONFIRM EMPLOYEE ID
   ================================================ */
function confirmHQId() {
  const input   = document.getElementById('hq-id-input');
  const errorEl = document.getElementById('hq-id-error');
  const value   = input.value.trim();

  if (!/^\d{8}$/.test(value)) {
    errorEl.classList.remove('hidden');
    input.focus();
    return;
  }

  errorEl.classList.add('hidden');
  gameState.playerId = value;

  if (!gameState.ambientStarted) {
    audio.startAmbient();
    gameState.ambientStarted = true;
  }

  showScreen('screen-choose-exam');
}


/* ================================================
   SCREEN 2B-1 — SELECT AREA
   ================================================ */
function selectArea(area) {
  gameState.area = area;
  document.getElementById('current-area-display').textContent = `👤 พื้นที่: ${area}`;
  document.getElementById('current-id-input').value = '';
  document.getElementById('current-id-error').classList.add('hidden');
  showScreen('screen-current-id');
}


/* ================================================
   SCREEN 2B-2 — CURRENT EMPLOYEE: CONFIRM ID
   ================================================ */
function confirmCurrentId() {
  const input   = document.getElementById('current-id-input');
  const errorEl = document.getElementById('current-id-error');
  const value   = input.value.trim();

  if (!/^\d{8}$/.test(value)) {
    errorEl.classList.remove('hidden');
    input.focus();
    return;
  }

  errorEl.classList.add('hidden');
  gameState.playerId = value;

  if (!gameState.ambientStarted) {
    audio.startAmbient();
    gameState.ambientStarted = true;
  }

  showScreen('screen-choose-exam');
}


/* ================================================
   SCREEN 2C — NEW CO: CONFIRM รุ่น + เลขที่
   ================================================ */
function confirmNewCO() {
  const cohortInput = document.getElementById('newco-cohort-input');
  const memberInput = document.getElementById('newco-member-input');
  const errorEl     = document.getElementById('newco-error');
  const cohortVal   = cohortInput.value.trim();
  const memberVal   = memberInput.value.trim();

  if (!/^\d{3}$/.test(cohortVal) || !/^\d{2}$/.test(memberVal)) {
    errorEl.classList.remove('hidden');
    if (!/^\d{3}$/.test(cohortVal)) cohortInput.focus();
    else memberInput.focus();
    return;
  }

  errorEl.classList.add('hidden');
  gameState.cohort   = cohortVal;
  gameState.memberNo = memberVal;
  gameState.playerId = `${cohortVal}-${memberVal}`;

  if (!gameState.ambientStarted) {
    audio.startAmbient();
    gameState.ambientStarted = true;
  }

  showScreen('screen-choose-exam');
}


/* ================================================
   BACK FROM EXAM CHOICE
   Routes back to the correct ID screen based
   on which player type is active.
   ================================================ */
function goBackFromExamChoice() {
  if (gameState.playerType === 'hq')      showScreen('screen-hq-id');
  else if (gameState.playerType === 'current') showScreen('screen-current-id');
  else if (gameState.playerType === 'newco')   showScreen('screen-newco-id');
  else showScreen('screen-player-type');
}


/* ================================================
   SCREEN 3 — SELECT EXAM TYPE
   ================================================ */
function selectExam(type) {
  gameState.examType = type;

  if (progress.hasSaved(gameState.playerId, gameState.examType)) {
    showContinuePrompt();
  } else {
    updatePlayerInfoDisplays();
    showScreen('screen-stage-select');
    buildStageList();
  }
}


/* ================================================
   SCREEN 3.5 — CONTINUE PROMPT
   ================================================ */
function showContinuePrompt() {
  const savedData = progress.load(gameState.playerId, gameState.examType);

  if (!savedData) {
    updatePlayerInfoDisplays();
    showScreen('screen-stage-select');
    buildStageList();
    return;
  }

  const examName = gameState.examType === 'life' ? 'ประกันชีวิต' : 'ประกันวินาศภัย';
  const stages   = STAGES[gameState.examType];

  document.getElementById('continue-player-id').textContent =
    gameState.playerType === 'newco'
      ? `New CO รุ่น ${gameState.cohort} เลขที่ ${gameState.memberNo}`
      : `ผู้เตรียมสอบหมายเลข ${gameState.playerId}`;
  document.getElementById('continue-path-label').textContent = `เส้นทาง: ${examName}`;
  document.getElementById('continue-saved-time').textContent =
    `💾 บันทึกไว้เมื่อ ${progress.formatSavedTime(savedData.savedAt)}`;

  const rowsEl = document.getElementById('continue-stage-rows');
  rowsEl.innerHTML = '';

  let totalPts = 0, totalMaxPts = 0;

  stages.forEach(stage => {
    const result = savedData.stageResults[stage.id];
    if (!result) return;

    totalPts    += result.points;
    totalMaxPts += stage.questionCount * POINTS_PER_QUESTION;

    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `
      <p class="summary-row-stage">
        ด่านที่ ${stage.id} ${stage.emoji} ${stage.name}
      </p>
      <p class="summary-row-score">
        ✅ ถูก ${result.correct}  ❌ ผิด ${result.wrong}
        │  ${result.points} / ${stage.questionCount * POINTS_PER_QUESTION} คะแนน
      </p>
    `;
    rowsEl.appendChild(row);
  });

  if (rowsEl.children.length === 0) {
    rowsEl.innerHTML = `
      <div class="summary-row">
        <p class="summary-row-stage" style="color:var(--text-muted,#504520);">
          ยังไม่มีด่านที่ผ่านแล้ว
        </p>
      </div>`;
  }

  document.getElementById('continue-total').textContent =
    `🏆 คะแนนสะสม: ${totalPts} คะแนน`;

  showScreen('screen-continue');
}

function continueFromSave() {
  const savedData = progress.load(gameState.playerId, gameState.examType);
  if (savedData) {
    gameState.stage1Passed = savedData.stage1Passed || false;
    gameState.stageResults = savedData.stageResults  || {};
  }
  updatePlayerInfoDisplays();
  showScreen('screen-stage-select');
  buildStageList();
}

function restartFresh() {
  progress.clear(gameState.playerId, gameState.examType);
  gameState.stage1Passed = false;
  gameState.stageResults = {};
  updatePlayerInfoDisplays();
  showScreen('screen-stage-select');
  buildStageList();
}


/* ================================================
   UPDATE ALL PLAYER INFO DISPLAYS
   ================================================ */
function updatePlayerInfoDisplays() {
  const id       = gameState.playerId;
  const examName = gameState.examType === 'life' ? 'ประกันชีวิต' : 'ประกันวินาศภัย';

  // Label differs for New CO vs everyone else
  const label = gameState.playerType === 'newco'
    ? `New CO รุ่น ${gameState.cohort} เลขที่ ${gameState.memberNo}`
    : `ผู้เตรียมสอบหมายเลข ${id}`;

  // HUD shows short ID — New CO shows cohort-memberNo
  const hudId = gameState.playerType === 'newco'
    ? `${gameState.cohort}-${gameState.memberNo}`
    : id;

  document.getElementById('stage-select-player-id').textContent = label;
  document.getElementById('stage-select-path').textContent      = 'เส้นทาง: ' + examName;
  document.getElementById('summary-player-id').textContent      = label;
  document.getElementById('summary-path-label').textContent     = 'เส้นทาง: ' + examName;
  document.getElementById('fail-player-id').textContent         = label;
  document.getElementById('complete-player-id').textContent     = label;
  document.getElementById('q-player-id').textContent            = hudId;
}


/* ================================================
   SCREEN 4 — BUILD STAGE LIST
   ================================================ */
function buildStageList() {
  const container = document.getElementById('stage-list');
  container.innerHTML = '';

  const stages = STAGES[gameState.examType];

  stages.forEach((stage) => {
    const isStage1    = stage.id === 1;
    const isUnlocked  = isStage1 || gameState.stage1Passed;
    const result      = gameState.stageResults[stage.id];
    const isCompleted = !!result;

    const item = document.createElement('div');
    item.className = 'stage-item ' +
      (isCompleted ? 'completed ' : '') +
      (isUnlocked  ? 'unlocked'   : 'locked');

    if (isUnlocked) item.onclick = () => startStage(stage.id);

    let scoreHTML = isUnlocked ? '🚪 เข้าได้' : '🔒 ล็อก';
    if (isCompleted) {
      const pts    = result.correct * POINTS_PER_QUESTION;
      const maxPts = stage.questionCount * POINTS_PER_QUESTION;
      scoreHTML    = `✅ ${result.correct}/${stage.questionCount}<br>${pts}/${maxPts} คะแนน`;
    }

    item.innerHTML = `
      <div class="stage-item-left">
        <p class="stage-item-name">
          ${stage.emoji} ด่านที่ ${stage.id} — ${stage.name}
        </p>
        <p class="stage-item-sub">
          ${stage.questionCount} ข้อ │ ${stage.questionCount * POINTS_PER_QUESTION} คะแนน
        </p>
        ${isStage1
          ? `<p class="stage-item-note">⚠️ ต้องผ่าน 7/10 เพื่อปลดล็อกด่านอื่น</p>`
          : ''}
      </div>
      <div class="stage-item-right">${scoreHTML}</div>
    `;

    container.appendChild(item);
  });
}


/* ================================================
   SCREEN 5 — START STAGE (now ASYNC — fetches
   real questions from Firebase via questions.js)
   ================================================ */
let questionSession = {
  stageId:       null,
  questions:     [],
  currentIndex:  0,
  correctCount:  0,
  wrongCount:    0,
  rarityCounts:  { N: 0, R: 0, SR: 0, UR: 0 },
};

async function startStage(stageId) {
  gameState.currentStageId     = stageId;
  questionSession.stageId      = stageId;
  questionSession.currentIndex = 0;
  questionSession.correctCount = 0;
  questionSession.wrongCount   = 0;
  questionSession.rarityCounts = { N: 0, R: 0, SR: 0, UR: 0 };

  const stage = STAGES[gameState.examType].find(s => s.id === stageId);

  // Show question screen immediately with loading state
  showScreen('screen-question');

  // Update HUD while loading
  document.getElementById('q-stage-name').textContent    = `${stage.emoji} ${stage.name}`;
  document.getElementById('q-progress-text').textContent = `1/${stage.questionCount}`;
  document.getElementById('progress-fill').style.width   = '0%';

  // Set loading state on question box + doors
  document.getElementById('question-text').textContent = '⏳ กำลังโหลดคำถาม...';
  document.getElementById('option-left').textContent   = '—';
  document.getElementById('option-right').textContent  = '—';

  // Clear rarity badge during load
  const badgeEl = document.getElementById('question-rarity-badge');
  if (badgeEl) badgeEl.innerHTML = '';

  // Disable doors while fetching
  const doorL = document.getElementById('choice-left');
  const doorR = document.getElementById('choice-right');
  doorL.style.pointerEvents = 'none';
  doorR.style.pointerEvents = 'none';

  try {
    // ★ FIREBASE: fetch real questions from Firestore ★
    questionSession.questions = await questions.fetchForStage(
      gameState.examType,
      stageId,
      stage.questionCount
    );
  } catch (e) {
    console.error('game.js: Failed to fetch questions:', e);
    questionSession.questions = [];
  }

  // Re-enable doors after fetch
  doorL.style.pointerEvents = '';
  doorR.style.pointerEvents = '';

  // ← guard goes HERE, still inside startStage
  if (questionSession.questions.length === 0) {
    document.getElementById('question-text').textContent =
      '⚠️ ยังไม่มีคำถามในด่านนี้ กรุณาเพิ่มคำถามในระบบ Admin';
    document.getElementById('option-left').textContent  = '—';
    document.getElementById('option-right').textContent = '—';
    return; // exits startStage before renderQuestion is called
  }

  // Render first question
  renderQuestion();
}                          // ← startStage closes HERE

/* ================================================
   RENDER QUESTION
   ================================================ */
function renderQuestion() {
  const session = questionSession;
  const q       = session.questions[session.currentIndex];
  const stage   = STAGES[gameState.examType].find(s => s.id === session.stageId);
  const total   = stage.questionCount;
  const current = session.currentIndex + 1;

  // HUD
  document.getElementById('q-stage-name').textContent    = `${stage.emoji} ${stage.name}`;
  document.getElementById('q-progress-text').textContent = `${current}/${total}`;

  // Progress bar
  const pct = ((current - 1) / total) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';

  // Question text + options
  document.getElementById('question-text').textContent = q.questionText || q.text || '—';
  document.getElementById('option-left').textContent   = q.leftOption   || '—';
  document.getElementById('option-right').textContent  = q.rightOption  || '—';

  // ★ RARITY BADGE on question box ★
  const rarity       = q.rarity || 'N';
  const rarityConfig = questions.getRarityConfig(rarity);
  const badgeEl      = document.getElementById('question-rarity-badge');

  if (badgeEl) {
    // Only show badge for R and above — N stays invisible (feels ambient)
    if (rarity === 'N') {
      badgeEl.innerHTML = '';
    } else {
      badgeEl.innerHTML = `
        <span class="q-rarity-tag"
          style="color:${rarityConfig.color};
                 border-color:${rarityConfig.color};
                 box-shadow: 0 0 8px ${rarityConfig.glowColor};">
          ${rarityConfig.icon} ${rarityConfig.label} ${rarityConfig.stars}
        </span>
      `;
    }
  }

  resetDoorClasses();
}

function resetDoorClasses() {
  const doorL    = document.getElementById('choice-left');
  const doorR    = document.getElementById('choice-right');
  const corridor = document.getElementById('corridor-scene');
  if (doorL)    doorL.classList.remove('door-open', 'door-wrong');
  if (doorR)    doorR.classList.remove('door-open', 'door-wrong');
  if (corridor) corridor.classList.remove('walk-through');
}


/* ================================================
   ANSWER SELECTION
   ================================================ */
const CORRECT_FLAVORS = [
  'ประตูเปิดออก...',
  'แสงสว่างเล็กน้อยส่องเข้ามา',
  'คุณรู้สึกเบาขึ้นเล็กน้อย',
  'เสียงแมวดังขึ้นในระยะไกล',
  'ฝุ่นในอากาศดูเบาบางลง',
];

const WRONG_FLAVORS = [
  'ประตูไม่ขยับ...',
  'ความมืดเข้มข้นขึ้นอีกเล็กน้อย',
  'เสียงถอนหายใจดังมาจากมุมมืด',
  'มีบางอย่างขีดเขียนบนกำแพง',
  'อุณหภูมิในห้องลดลงกะทันหัน',
];

function selectAnswer(side) {
  const doorL = document.getElementById('choice-left');
  const doorR = document.getElementById('choice-right');
  doorL.style.pointerEvents = 'none';
  doorR.style.pointerEvents = 'none';

  const q           = questionSession.questions[questionSession.currentIndex];
  const isCorrect   = (side === q.correctAnswer);
  const clickedDoor = side === 'left' ? doorL : doorR;

  // ★ FIRE-AND-FORGET: log this answer event to Firestore ★
  logger.logAnswer({
    questionId:  q.id,
    playerId:    gameState.playerId,
    playerType:  gameState.playerType,   // null in Phase 1
    area:        gameState.area,         // null in Phase 1
    cohort:      gameState.cohort,       // null in Phase 1
    memberNo:    gameState.memberNo,     // null in Phase 1
    isCorrect,
    examType:    gameState.examType,
    stageId:     questionSession.stageId,
  });

  // ★ Track rarity of this question ★
  const rarity = q.rarity || 'N';
  
  questionSession.rarityCounts[rarity] =
    (questionSession.rarityCounts[rarity] || 0) + 1;

  if (isCorrect) {
    questionSession.correctCount++;
    audio.playCorrect();
    clickedDoor.classList.add('door-open');

    setTimeout(() => {
      const corridor = document.getElementById('corridor-scene');
      corridor.classList.add('walk-through');
      audio.playWalkThrough();

      setTimeout(() => {
        showFeedback(true, q.explanation, rarity);
      }, 520);
    }, 420);

  } else {
    questionSession.wrongCount++;
    audio.playWrong();
    clickedDoor.classList.add('door-wrong');

    document.body.classList.remove('shake', 'red-flash');
    void document.body.offsetWidth;
    document.body.classList.add('shake', 'red-flash');
    setTimeout(() => document.body.classList.remove('shake', 'red-flash'), 600);

    setTimeout(() => {
      showFeedback(false, q.explanation, rarity);
    }, 480);
  }
}


/* ================================================
   FEEDBACK SCREEN
   ================================================ */
function showFeedback(isCorrect, explanation, rarity) {
  const banner   = document.getElementById('feedback-banner');
  const iconEl   = document.getElementById('feedback-icon');
  const verdict  = document.getElementById('feedback-verdict');
  const flavor   = document.getElementById('feedback-flavor');
  const expEl    = document.getElementById('feedback-explanation');
  const scoreEl  = document.getElementById('feedback-running-score');
  const corridor = document.getElementById('feedback-corridor');

  const flavors      = isCorrect ? CORRECT_FLAVORS : WRONG_FLAVORS;
  const randomFlavor = flavors[Math.floor(Math.random() * flavors.length)];

  if (isCorrect) {
    banner.className    = 'feedback-banner correct green-pulse';
    iconEl.textContent  = '✅';
    verdict.textContent = 'ถูกต้อง!';
    corridor.className  = 'feedback-corridor tint-correct';
  } else {
    banner.className    = 'feedback-banner wrong';
    iconEl.textContent  = '❌';
    verdict.textContent = 'ผิด...';
    corridor.className  = 'feedback-corridor tint-wrong';
  }

  flavor.textContent = randomFlavor;
  expEl.textContent  = explanation || '—';

  // ★ RARITY LINE on feedback screen ★
  const rarityConfig = questions.getRarityConfig(rarity || 'N');
  const rarityEl     = document.getElementById('feedback-rarity');
  if (rarityEl) {
    rarityEl.textContent = `${rarityConfig.icon} [${rarityConfig.label}] ${rarityConfig.name} ${rarityConfig.stars}`;
    rarityEl.style.color = rarityConfig.color;
    // Hide rarity line for N — keeps it feeling invisible/ambient
    rarityEl.style.display = (rarity === 'N') ? 'none' : 'block';
  }

  const pts           = questionSession.correctCount * POINTS_PER_QUESTION;
  scoreEl.textContent = `คะแนนสะสมด่านนี้: ${pts} คะแนน`;

  showScreen('screen-feedback');

  document.getElementById('choice-left').style.pointerEvents  = '';
  document.getElementById('choice-right').style.pointerEvents = '';
}


/* ================================================
   NEXT QUESTION / END OF STAGE
   ================================================ */
function nextQuestion() {
  questionSession.currentIndex++;
  const stage = STAGES[gameState.examType].find(
    s => s.id === questionSession.stageId
  );

  if (questionSession.currentIndex >= stage.questionCount) {
    endStage();
  } else {
    showScreen('screen-question');
    renderQuestion();
  }
}

function endStage() {
  const session = questionSession;
  const stageId = session.stageId;
  const stage   = STAGES[gameState.examType].find(s => s.id === stageId);
  const correct = session.correctCount;
  const wrong   = session.wrongCount;
  const pts     = correct * POINTS_PER_QUESTION;

  // Save result including rarity counts
  gameState.stageResults[stageId] = {
    correct,
    wrong,
    points:       pts,
    rarityCounts: { ...session.rarityCounts },
  };

  if (stageId === 1 && correct < STAGE1_PASS_THRESHOLD) {
    audio.playStageFail();
    progress.save(gameState.playerId, gameState.examType, gameState);
    showFailScreen(stage, correct, wrong, pts);
    return;
  }

  if (stageId === 1) gameState.stage1Passed = true;

  audio.playStagePass();

  const saved = progress.save(gameState.playerId, gameState.examType, gameState);
  if (saved) showSaveToast();

  const allStages   = STAGES[gameState.examType];
  const allComplete = allStages.every(s => gameState.stageResults[s.id]);

  allComplete ? showAllCompleteScreen() : showSummaryScreen();
}


/* ================================================
   SAVE TOAST
   ================================================ */
function showSaveToast() {
  const existing = document.getElementById('save-toast');
  if (existing) existing.remove();

  const toast       = document.createElement('div');
  toast.id          = 'save-toast';
  toast.className   = 'save-toast';
  toast.textContent = '💾 บันทึกแล้ว';
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('save-toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('save-toast--visible');
    setTimeout(() => toast.remove(), 500);
  }, 2200);
}


/* ================================================
   SUMMARY SCREEN (Screen 7)
   ================================================ */
function showSummaryScreen() {
  const allStages     = STAGES[gameState.examType];
  const rowsContainer = document.getElementById('summary-stage-rows');
  rowsContainer.innerHTML = '';

  let totalPts = 0, totalMaxPts = 0;

  allStages.forEach(stage => {
    const result = gameState.stageResults[stage.id];
    if (!result) return;

    totalPts    += result.points;
    totalMaxPts += stage.questionCount * POINTS_PER_QUESTION;

    // Build rarity counts line if any non-N rarities were encountered
    const rc          = result.rarityCounts || {};
    const rarityParts = [];
    if (rc.N)  rarityParts.push(`📄 N×${rc.N}`);
    if (rc.R)  rarityParts.push(`📘 R×${rc.R}`);
    if (rc.SR) rarityParts.push(`⭐ SR×${rc.SR}`);
    if (rc.UR) rarityParts.push(`💎 UR×${rc.UR}`);
    const rarityLine = rarityParts.length > 0
      ? `<p class="summary-row-rarity">${rarityParts.join('  ')}</p>`
      : '';

    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `
      <p class="summary-row-stage">
        ด่านที่ ${stage.id} ${stage.emoji} ${stage.name}
      </p>
      <p class="summary-row-score">
        ✅ ถูก ${result.correct}  ❌ ผิด ${result.wrong}
        │  ${result.points} / ${stage.questionCount * POINTS_PER_QUESTION} คะแนน
      </p>
      ${rarityLine}
    `;
    rowsContainer.appendChild(row);
  });

  document.getElementById('summary-total').textContent =
    `🏆 คะแนนรวมสะสม: ${totalPts} คะแนน`;

  showScreen('screen-summary');
}


/* ================================================
   FAIL SCREEN (Screen 8)
   ================================================ */
function showFailScreen(stage, correct, wrong, pts) {
  const maxPts = stage.questionCount * POINTS_PER_QUESTION;
  document.getElementById('fail-stage-label').textContent =
    `ด่านที่ 1 ${stage.emoji} ${stage.name}`;
  document.getElementById('fail-score-detail').textContent =
    `✅ ถูก ${correct}  ❌ ผิด ${wrong}  │  ${pts} / ${maxPts} คะแนน`;
  showScreen('screen-fail');
}

function retryStageOne() {
  delete gameState.stageResults[1];
  startStage(1);
}


/* ================================================
   ALL-COMPLETE SCREEN (Screen 9)
   ================================================ */
function showAllCompleteScreen() {
  const allStages = STAGES[gameState.examType];
  let totalPts = 0, totalMaxPts = 0;

  allStages.forEach(stage => {
    const result = gameState.stageResults[stage.id];
    if (result) totalPts += result.points;
    totalMaxPts += stage.questionCount * POINTS_PER_QUESTION;
  });

  document.getElementById('complete-total-score').textContent =
    `คะแนนรวมทั้งหมด: ${totalPts} / ${totalMaxPts} คะแนน`;

  showScreen('screen-all-complete');
}


/* ================================================
   NAVIGATION HELPERS
   ================================================ */
function goToStageSelect() {
  buildStageList();
  showScreen('screen-stage-select');
}

function resetGame() {
  if (gameState.playerId && gameState.examType) {
    progress.clear(gameState.playerId, gameState.examType);
  }
  audio.stopAmbient();

  gameState = {
    examType:       null,
    playerId:       null,
    playerType:     null,   // ← ADD
    area:           null,   // ← ADD
    cohort:         null,   // ← ADD
    memberNo:       null,   // ← ADD
    currentStageId: null,
    stageResults:   {},
    stage1Passed:   false,
    ambientStarted: false,
  };

  questionSession = {
    stageId:      null,
    questions:    [],
    currentIndex: 0,
    correctCount: 0,
    wrongCount:   0,
    rarityCounts: { N: 0, R: 0, SR: 0, UR: 0 },
  };

  showScreen('screen-welcome');
}


/* ================================================
   MUTE TOGGLE
   ================================================ */
function toggleAudio() {
  const isMuted = audio.toggleMute();
  const btn     = document.getElementById('mute-btn');
  if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
}


/* ================================================
   DOOR HOVER SOUNDS
   ================================================ */
function attachDoorHoverSounds() {
  ['choice-left', 'choice-right'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mouseenter', () => audio.playDoorHover());
    el.addEventListener('touchstart', () => audio.playDoorHover(), { passive: true });
  });
}


/* ================================================
   INIT
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  showScreen('screen-welcome');
  attachDoorHoverSounds();
   document.getElementById('hq-id-input')
    .addEventListener('keydown', e => { if (e.key === 'Enter') confirmHQId(); });
  document.getElementById('current-id-input')
    .addEventListener('keydown', e => { if (e.key === 'Enter') confirmCurrentId(); });
  document.getElementById('newco-cohort-input')
    .addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('newco-member-input').focus(); });
  document.getElementById('newco-member-input')
    .addEventListener('keydown', e => { if (e.key === 'Enter') confirmNewCO(); });
});