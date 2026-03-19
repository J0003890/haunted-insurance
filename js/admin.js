/* ================================================
   สำนักงานต้องสาป — ADMIN PANEL LOGIC
   js/admin.js
   ================================================ */


/* ================================================
   CONSTANTS
   ================================================ */
const ADMIN_PASSWORD = 'insurlearn2026';

/* Stage definitions — mirrors game.js exactly */
const STAGES = {
  life: [
    { id: 1, name: 'จรรยาบรรณประกันชีวิต',    emoji: '💙', questionCount: 10 },
    { id: 2, name: 'หลักการประกันชีวิต',        emoji: '👻', questionCount: 20 },
    { id: 3, name: 'ประมวลกฎหมายแพ่งชีวิต',    emoji: '⚖',  questionCount: 5  },
    { id: 4, name: 'พ.ร.บ. ชีวิต',             emoji: '💸', questionCount: 5  },
  ],
  nonlife: [
    { id: 1, name: 'จรรยาบรรณประกันวินาศภัย',  emoji: '🤍', questionCount: 10 },
    { id: 2, name: 'หลักการประกันวินาศภัย',      emoji: '😚', questionCount: 5  },
    { id: 3, name: 'ประมวลกฎหมายแพ่งวินาศภัย',  emoji: '⚖',  questionCount: 10 },
    { id: 4, name: 'พ.ร.บ. วินาศภัย',           emoji: '💸', questionCount: 10 },
    { id: 5, name: 'ประกันอัคคีภัย',            emoji: '🔥', questionCount: 5  },
    { id: 6, name: 'ประกันตัวเรือและขนส่ง',      emoji: '🚢', questionCount: 5  },
    { id: 7, name: 'ประกันภัยรถยนต์',           emoji: '🚗', questionCount: 5  },
    { id: 8, name: 'ประกันภัยเบ็ดเตล็ด',        emoji: '🐄', questionCount: 5  },
  ]
};

const RARITY_CONFIG = {
  N:  { label: 'N',  name: 'ธรรมดา',     icon: '📄', cssClass: 'rarity-N'  },
  R:  { label: 'R',  name: 'หายาก',      icon: '📘', cssClass: 'rarity-R'  },
  SR: { label: 'SR', name: 'หายากมาก',   icon: '⭐', cssClass: 'rarity-SR' },
  UR: { label: 'UR', name: 'หายากที่สุด', icon: '💎', cssClass: 'rarity-UR' },
};

/* Descriptions shown in rarity preview */
const RARITY_DESC = {
  N:  'คำถามพื้นฐาน — ดึงข้อมูลตรงๆ จากที่อ่านมา (~50% ของคลัง)',
  R:  'คำถามประยุกต์ — ต้องเข้าใจ ไม่ใช่แค่จำ (~30% ของคลัง)',
  SR: 'คำถามหลอกล่อ — ดูง่ายแต่มีกับดัก (~15% ของคลัง)',
  UR: 'คำถามยาก — หลายแนวคิดรวมกัน คนส่วนใหญ่ตอบผิด (~5% ของคลัง)',
};


/* ================================================
   STATE
   ================================================ */
let allQuestions = [];   // all questions cached from Firestore
let editingId    = null; // null = add mode | string = edit mode (doc ID)


/* ================================================
   INIT — runs when page loads
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  populateStageDropdown();
  updateRarityPreview();

  // ★ DARK MODE: restore saved preference on load ★
  if (localStorage.getItem('adminDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('dark-mode-btn');
    if (btn) btn.textContent = '☀️';
  }

  // ★ SESSION AUTH CHECK: Skip password if already logged in this session ★
  if (sessionStorage.getItem('adminAuthenticated') === 'true') {
    document.getElementById('gate').style.display = 'none';
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAllQuestions();
  }

  document.getElementById('gate-input')
    .addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
});


/* ================================================
   PASSWORD GATE
   ================================================ */
function checkPassword() {
  const input = document.getElementById('gate-input');
  const error = document.getElementById('gate-error');

  if (input.value === ADMIN_PASSWORD) {
    document.getElementById('gate').style.display    = 'none';
    document.getElementById('admin-panel').classList.remove('hidden');
    sessionStorage.setItem('adminAuthenticated', 'true'); // Save auth state
    loadAllQuestions();  // load question bank immediately on login
  } else {
    error.classList.remove('hidden');
    input.value = '';
    input.focus();
    // Brief shake animation on the card
    const card = document.querySelector('.gate-card');
    card.style.animation = 'none';
    requestAnimationFrame(() => {
      card.style.animation = 'gateShake 0.35s ease';
    });
  }
}

function logout() {
  if (confirm('ออกจากระบบ Admin?')) {
    sessionStorage.removeItem('adminAuthenticated'); // Clear auth state
    location.reload();
  }
}


/* ================================================
   FORM — STAGE DROPDOWN
   Populates the stage <select> based on
   whichever insurance type radio is selected.
   ================================================ */
function populateStageDropdown() {
  const type     = document.querySelector('input[name="insuranceType"]:checked').value;
  const select   = document.getElementById('stage-select');
  const stages   = STAGES[type];
  const prevVal  = select.value;

  select.innerHTML = '';
  stages.forEach(stage => {
    const opt   = document.createElement('option');
    opt.value   = stage.id;
    opt.textContent = `ด่าน ${stage.id} — ${stage.emoji} ${stage.name} (${stage.questionCount} ข้อ)`;
    select.appendChild(opt);
  });

  // Try to restore previous selection if valid for new type
  if (prevVal && select.querySelector(`option[value="${prevVal}"]`)) {
    select.value = prevVal;
  }
}


/* ================================================
   FORM — RARITY PREVIEW
   Updates the preview badge below the rarity select.
   ================================================ */
function updateRarityPreview() {
  const rarity  = document.getElementById('rarity-select').value;
  const config  = RARITY_CONFIG[rarity];
  const preview = document.getElementById('rarity-preview');

  preview.innerHTML = `
    <span class="rarity-badge ${config.cssClass}">
      ${config.icon} ${config.label} — ${config.name}
    </span>
    <span class="rarity-desc">${RARITY_DESC[rarity]}</span>
  `;
}


/* ================================================
   FORM — RARITY BADGE HTML HELPER
   Used in the question bank card rendering.
   ================================================ */
function getRarityBadgeHTML(rarity) {
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['N'];
  return `<span class="rarity-badge ${config.cssClass}">${config.icon} ${config.label}</span>`;
}


/* ================================================
   FORM — SUBMIT HANDLER
   Decides whether to ADD or UPDATE based on editingId.
   ================================================ */
async function submitQuestion(event) {
  event.preventDefault();

  const data = readForm();
  if (!data) return; // validation failed

  // ★ PHASE 4: DUPLICATE DETECTION ★
  // Normalize text (removes all spaces & ignores case) to catch copy-paste variants
  const normalize = (text) => text.trim().toLowerCase().replace(/\s+/g, '');
  const normalizedInput = normalize(data.questionText);
  
  const isDuplicate = allQuestions.some(q => 
    normalize(q.questionText) === normalizedInput && 
    q.id !== editingId // Ignore itself if we are just editing an existing question
  );

  if (isDuplicate) {
    const proceed = confirm("⚠️ พบคำถามที่คล้ายกันในระบบแล้ว!\n\nคำถามนี้อาจซ้ำซ้อน คุณแน่ใจหรือไม่ว่าต้องการเพิ่ม/แก้ไข?");
    if (!proceed) return;
  }

  if (editingId) {
    await updateQuestion(editingId, data);
  } else {
    await addQuestion(data);
  }
}


/* ================================================
   READ FORM VALUES
   Returns a clean data object, or null if invalid.
   ================================================ */
function readForm() {
  const examType       = document.querySelector('input[name="insuranceType"]:checked')?.value;
  const stageId        = parseInt(document.getElementById('stage-select').value);
  const questionText   = document.getElementById('q-text-input').value.trim();
  const leftOption     = document.getElementById('left-option').value.trim();
  const rightOption    = document.getElementById('right-option').value.trim();
  const correctAnswer  = document.querySelector('input[name="correctAnswer"]:checked')?.value;
  const explanation    = document.getElementById('explanation').value.trim();
  const rarity         = document.getElementById('rarity-select').value;
  const isActive       = document.querySelector('input[name="isActive"]:checked')?.value === 'true';

  // Basic validation
  if (!questionText || !leftOption || !rightOption || !explanation) {
    showFormMessage('กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมาย *', 'error');
    return null;
  }

  return {
    examType,
    stageId,
    questionText,
    leftOption,
    rightOption,
    correctAnswer,
    explanation,
    rarity,
    isActive,
  };
}


/* ================================================
   ADD QUESTION — writes new doc to Firestore
   ================================================ */
async function addQuestion(data) {
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.textContent = 'กำลังบันทึก...';
  submitBtn.disabled    = true;

  try {
    await window.db.collection('questions').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showFormMessage('✅ เพิ่มคำถามสำเร็จ!', 'success');
    document.getElementById('question-form').reset();
    populateStageDropdown();
    updateRarityPreview();
    await loadAllQuestions(); // refresh the bank

  } catch (e) {
    console.error('admin.js addQuestion error:', e);
    showFormMessage('❌ เกิดข้อผิดพลาด: ' + e.message, 'error');
  } finally {
    submitBtn.textContent = '➕ เพิ่มคำถาม';
    submitBtn.disabled    = false;
  }
}


/* ================================================
   UPDATE QUESTION — overwrites existing Firestore doc
   ================================================ */
async function updateQuestion(id, data) {
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.textContent = 'กำลังบันทึก...';
  submitBtn.disabled    = true;

  try {
    await window.db.collection('questions').doc(id).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showFormMessage('✅ แก้ไขคำถามสำเร็จ!', 'success');
    cancelEdit();
    await loadAllQuestions();

  } catch (e) {
    console.error('admin.js updateQuestion error:', e);
    showFormMessage('❌ เกิดข้อผิดพลาด: ' + e.message, 'error');
  } finally {
    submitBtn.textContent = '💾 บันทึกการแก้ไข';
    submitBtn.disabled    = false;
  }
}


/* ================================================
   EDIT MODE — populate form with existing data
   ================================================ */
function enterEditMode(id) {
  const q = allQuestions.find(q => q.id === id);
  if (!q) return;

  editingId = id;

  // Update form heading
  document.getElementById('form-title').textContent = '✏️ แก้ไขคำถาม';
  document.getElementById('submit-btn').textContent  = '💾 บันทึกการแก้ไข';
  document.getElementById('cancel-edit-btn').classList.remove('hidden');
  document.getElementById('edit-id').value = id;

  // Fill in insurance type
  document.querySelector(`input[name="insuranceType"][value="${q.examType}"]`).checked = true;
  populateStageDropdown();

  // Fill stage (after dropdown is populated)
  document.getElementById('stage-select').value = q.stageId;

  // Fill text fields
  document.getElementById('q-text-input').value = q.questionText;
  document.getElementById('left-option').value  = q.leftOption;
  document.getElementById('right-option').value = q.rightOption;
  document.getElementById('explanation').value  = q.explanation;

  // Fill radios
  document.querySelector(`input[name="correctAnswer"][value="${q.correctAnswer}"]`).checked = true;
  document.querySelector(`input[name="isActive"][value="${q.isActive}"]`).checked = true;

  // Fill rarity
  document.getElementById('rarity-select').value = q.rarity || 'N';
  updateRarityPreview();

  // Scroll form into view
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  showFormMessage('', 'success'); // clear any previous message
}

function cancelEdit() {
  editingId = null;
  document.getElementById('form-title').textContent       = '➕ เพิ่มคำถามใหม่';
  document.getElementById('submit-btn').textContent        = '➕ เพิ่มคำถาม';
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  document.getElementById('edit-id').value                 = '';
  document.getElementById('question-form').reset();
  populateStageDropdown();
  updateRarityPreview();
  showFormMessage('', '');
}


/* ================================================
   DELETE QUESTION
   ================================================ */
async function deleteQuestion(id) {
  const q = allQuestions.find(q => q.id === id);
  const preview = q ? `"${q.questionText.substring(0, 40)}..."` : id;

  if (!confirm(`ลบคำถามนี้ถาวรเลยไหม?\n\n${preview}\n\nการกระทำนี้ไม่สามารถยกเลิกได้`)) return;

  try {
    await window.db.collection('questions').doc(id).delete();
    await loadAllQuestions();
    showFormMessage('🗑️ ลบคำถามแล้ว', 'success');
  } catch (e) {
    console.error('admin.js deleteQuestion error:', e);
    alert('เกิดข้อผิดพลาด: ' + e.message);
  }
}


/* ================================================
   TOGGLE ACTIVE STATUS — quick toggle without opening edit
   ================================================ */
async function toggleActive(id, currentStatus) {
  try {
    await window.db.collection('questions').doc(id).update({
      isActive:  !currentStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await loadAllQuestions();
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + e.message);
  }
}


/* ================================================
   LOAD ALL QUESTIONS FROM FIRESTORE
   Fetches the entire questions collection once.
   All filtering is done client-side for speed
   and to avoid Firestore composite index requirements.
   ================================================ */
async function loadAllQuestions() {
  document.getElementById('question-bank').innerHTML =
    '<p class="loading-text">⏳ กำลังโหลดคำถาม...</p>';

  if (!window.db) {
    document.getElementById('question-bank').innerHTML =
      '<p class="loading-text">❌ Firebase ไม่ได้เชื่อมต่อ</p>';
    return;
  }

  try {
    const snapshot = await window.db
      .collection('questions')
      .orderBy('examType')
      .get();

    allQuestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    updateHeaderStats();
    applyFilters();

  } catch (e) {
    console.error('admin.js loadAllQuestions error:', e);

    // Index error — give a helpful message
    if (e.message && e.message.includes('index')) {
      document.getElementById('question-bank').innerHTML = `
        <p class="loading-text">
          ⚠️ Firestore ต้องการ Index<br><br>
          กรุณาดูที่ Browser Console (F12)<br>
          แล้วคลิกลิงก์สีฟ้าเพื่อสร้าง Index อัตโนมัติ<br>
          รอประมาณ 1 นาที แล้ว Refresh หน้านี้
        </p>`;

      // Fallback: try without orderBy
      try {
        const snap2 = await window.db.collection('questions').get();
        allQuestions = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateHeaderStats();
        applyFilters();
      } catch (_) {}
    } else {
      document.getElementById('question-bank').innerHTML =
        `<p class="loading-text">❌ ${e.message}</p>`;
    }
  }
}


/* ================================================
   FILTER — when insurance type filter changes,
   update the stage filter dropdown too.
   ================================================ */
function onFilterTypeChange() {
  updateFilterStageDropdown();
  applyFilters();
}

function updateFilterStageDropdown() {
  const type        = document.getElementById('filter-type').value;
  const stageFilter = document.getElementById('filter-stage');
  stageFilter.innerHTML = '<option value="all">ทุกด่าน</option>';

  if (type === 'all') return;

  STAGES[type].forEach(stage => {
    const opt = document.createElement('option');
    opt.value = stage.id;
    opt.textContent = `ด่าน ${stage.id} — ${stage.emoji} ${stage.name}`;
    stageFilter.appendChild(opt);
  });
}


/* ================================================
   APPLY FILTERS — client-side filter on allQuestions
   ================================================ */
function applyFilters() {
  const typeFilter   = document.getElementById('filter-type').value;
  const stageFilter  = document.getElementById('filter-stage').value;
  const rarityFilter = document.getElementById('filter-rarity').value;
  const activeFilter = document.getElementById('filter-active').value;

  let filtered = [...allQuestions];

  if (typeFilter   !== 'all') filtered = filtered.filter(q => q.examType === typeFilter);
  if (stageFilter  !== 'all') filtered = filtered.filter(q => String(q.stageId) === stageFilter);
  if (rarityFilter !== 'all') filtered = filtered.filter(q => (q.rarity || 'N') === rarityFilter);
  if (activeFilter !== 'all') filtered = filtered.filter(q => String(q.isActive) === activeFilter);

  // Sort by examType → stageId → rarity weight
  const rarityOrder = { N: 0, R: 1, SR: 2, UR: 3 };
  filtered.sort((a, b) => {
    if (a.examType !== b.examType) return a.examType < b.examType ? -1 : 1;
    if (a.stageId !== b.stageId) return a.stageId - b.stageId;
    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0); // rarer first
  });

  updateBankStats(filtered);
  renderQuestionBank(filtered);
}


/* ================================================
   UPDATE HEADER STATS (top of page)
   ================================================ */
function updateHeaderStats() {
  const total   = allQuestions.length;
  const active  = allQuestions.filter(q => q.isActive !== false).length;
  const life    = allQuestions.filter(q => q.examType === 'life').length;
  const nonlife = allQuestions.filter(q => q.examType === 'nonlife').length;

  document.getElementById('header-stats').textContent =
    `รวม ${total} คำถาม (เปิด ${active}) │ ชีวิต ${life} │ วินาศภัย ${nonlife}`;
}


/* ================================================
   UPDATE BANK STATS (inside question bank section)
   ================================================ */
function updateBankStats(filtered) {
  const counts = { N: 0, R: 0, SR: 0, UR: 0 };
  filtered.forEach(q => { counts[q.rarity || 'N']++; });

  document.getElementById('bank-stats').innerHTML = `
    <span class="stat-chip total">รวม ${filtered.length} ข้อ</span>
    <span class="stat-chip n-chip">📄 N: ${counts.N}</span>
    <span class="stat-chip r-chip">📘 R: ${counts.R}</span>
    <span class="stat-chip sr-chip">⭐ SR: ${counts.SR}</span>
    <span class="stat-chip ur-chip">💎 UR: ${counts.UR}</span>
  `;
}


/* ================================================
   RENDER QUESTION BANK
   Builds one .q-card per filtered question.
   ================================================ */
function renderQuestionBank(filtered) {
  const bank = document.getElementById('question-bank');

  if (filtered.length === 0) {
    bank.innerHTML = '<p class="empty-text">ไม่พบคำถามที่ตรงกับตัวกรอง</p>';
    return;
  }

  bank.innerHTML = '';

  filtered.forEach(q => {
    const rarity     = q.rarity || 'N';
    const isActive   = q.isActive !== false;
    const stageName  = getStageNameById(q.examType, q.stageId);
    const typeLabel  = q.examType === 'life' ? '💙 ชีวิต' : '🤍 วินาศภัย';
    const leftClass  = q.correctAnswer === 'left'  ? 'correct' : '';
    const rightClass = q.correctAnswer === 'right' ? 'correct' : '';

    const card = document.createElement('div');
    card.className = `q-card${isActive ? '' : ' inactive'}`;
    card.id        = `q-card-${q.id}`;

    card.innerHTML = `
      <div class="q-card-top">
        ${getRarityBadgeHTML(rarity)}
        <span class="q-stage-chip">${typeLabel} │ ด่าน ${q.stageId} — ${stageName}</span>
        <span class="q-active-chip ${isActive ? 'active' : 'inactive'}">
          ${isActive ? '✅ เปิด' : '🚫 ซ่อน'}
        </span>
      </div>

      <p class="q-card-question">${escapeHTML(q.questionText)}</p>

      <div class="q-card-options">
        <div class="q-option ${leftClass}">
          <span class="q-option-label">◀ ซ้าย${q.correctAnswer === 'left' ? ' ✓' : ''}</span>
          ${escapeHTML(q.leftOption)}
        </div>
        <div class="q-option ${rightClass}">
          <span class="q-option-label">ขวา ▶${q.correctAnswer === 'right' ? ' ✓' : ''}</span>
          ${escapeHTML(q.rightOption)}
        </div>
      </div>

      <div class="q-card-explanation">
        💡 ${escapeHTML(q.explanation)}
      </div>

      <div class="q-card-actions">
        <button class="btn-toggle"
          onclick="toggleExplanation('${q.id}')">
          💡 คำอธิบาย
        </button>
        <button class="btn-edit"
          onclick="enterEditMode('${q.id}')">
          ✏️ แก้ไข
        </button>
        <button class="btn-toggle"
          onclick="toggleActive('${q.id}', ${isActive})">
          ${isActive ? '🚫 ซ่อน' : '✅ เปิด'}
        </button>
        <button class="btn-delete"
          onclick="deleteQuestion('${q.id}')">
          🗑️ ลบ
        </button>
      </div>
    `;

    bank.appendChild(card);
  });
}


/* ================================================
   TOGGLE EXPLANATION VISIBILITY ON CARD
   ================================================ */
function toggleExplanation(id) {
  const card = document.getElementById(`q-card-${id}`);
  if (card) card.classList.toggle('show-explanation');
}


/* ================================================
   PHASE 4: EXPORT TO EXCEL
   ================================================ */
function exportQuestionsToExcel() {
  if (typeof XLSX === 'undefined') {
    alert("⏳ กำลังโหลดไลบรารี Excel โปรดรอสักครู่แล้วกดอีกครั้ง...");
    return;
  }
  if (allQuestions.length === 0) {
    alert("❌ ไม่มีคำถามสำหรับ Export");
    return;
  }

  // Apply the same filtering as the UI right now
  const typeFilter   = document.getElementById('filter-type').value;
  const stageFilter  = document.getElementById('filter-stage').value;
  const rarityFilter = document.getElementById('filter-rarity').value;
  const activeFilter = document.getElementById('filter-active').value;

  let filtered = [...allQuestions];

  if (typeFilter   !== 'all') filtered = filtered.filter(q => q.examType === typeFilter);
  if (stageFilter  !== 'all') filtered = filtered.filter(q => String(q.stageId) === stageFilter);
  if (rarityFilter !== 'all') filtered = filtered.filter(q => (q.rarity || 'N') === rarityFilter);
  if (activeFilter !== 'all') filtered = filtered.filter(q => String(q.isActive) === activeFilter);

  if (filtered.length === 0) {
    alert("❌ ไม่พบคำถามที่ตรงกับตัวกรองปัจจุบัน");
    return;
  }

  // Format data specifically for Excel
  const exportData = filtered.map(q => ({
    "ประเภทประกัน": q.examType === 'life' ? 'ชีวิต' : 'วินาศภัย',
    "ด่าน": q.stageId,
    "ความหายาก": q.rarity || 'N',
    "สถานะ": q.isActive !== false ? 'เปิด' : 'ซ่อน',
    "คำถาม": q.questionText,
    "ประตูซ้าย": q.leftOption,
    "ประตูขวา": q.rightOption,
    "เฉลย": q.correctAnswer === 'left' ? 'ซ้าย' : 'ขวา',
    "คำอธิบาย": q.explanation
  }));

  // Create workbook and trigger download
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Question Bank");
  XLSX.writeFile(wb, "haunted_insurance_questions.xlsx");
}


/* ================================================
   UTILITIES
   ================================================ */

/* Get stage name from type + id */
function getStageNameById(insuranceType, stageId) {
  const stages = STAGES[insuranceType];
  if (!stages) return '—';
  const stage = stages.find(s => s.id === parseInt(stageId));
  return stage ? `${stage.emoji} ${stage.name}` : `ด่าน ${stageId}`;
}

/* Escape HTML to prevent XSS in rendered question text */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* Show a message below the form */
function showFormMessage(msg, type) {
  const el = document.getElementById('form-message');
  if (!msg) { el.classList.add('hidden'); return; }
  el.className   = `form-message ${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  // Auto-hide success messages after 3s
  if (type === 'success') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
}

/* ================================================
   DARK MODE TOGGLE
   ================================================ */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  const btn    = document.getElementById('dark-mode-btn');

  // Switch icon
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';

  // Persist preference — survives page refresh
  localStorage.setItem('adminDarkMode', isDark);
}