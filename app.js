/* ============================================================
   국제태권도장 홈페이지 · 도장운영시스템  app.js
   - localStorage 기반 영구 저장 (key: kukje_data_v1)
   - 공개 홈페이지 + 관리자 모드
   ============================================================ */
'use strict';

/* ---------------- 상수 ---------------- */
const STORE_KEY = 'kukje_data_v1';
const DEFAULT_PIN = '0000';
const PARTS = ['유아부', '초등부', '중고등·성인부', '선수·시범단(카도스)', '줄넘기·호신술 특화반'];
const BELTS = ['흰띠', '노랑띠', '초록띠', '파랑띠', '빨강띠', '품띠/단'];
const ATT_STATES = ['출석', '지각', '결석', '보강'];
const INQ_STATUS = ['대기', '연락완료', '체험예정', '등록완료'];
const INQ_STATUS_BADGE = { '대기': 'red', '연락완료': 'amber', '체험예정': 'blue', '등록완료': 'green' };
const PAY_METHODS = ['카드', '계좌이체', '제로페이', '현금'];
const GALLERY = [
  { src: 'assets/g05.jpg', cap: '수련 후 단체 사진' },
  { src: 'assets/g01.jpg', cap: '활짝 웃는 초등부' },
  { src: 'assets/g03.jpg', cap: '유아부 첫 수업' },
  { src: 'assets/g07.jpg', cap: '품새 수업' },
  { src: 'assets/g02.jpg', cap: '수업 전 인사' },
  { src: 'assets/g09.jpg', cap: '몸풀기 체조' },
  { src: 'assets/g04.jpg', cap: '노랑띠 친구' },
  { src: 'assets/g06.jpg', cap: '유아부 수업' },
  { src: 'assets/g08.jpg', cap: '품띠 선배' },
  { src: 'assets/g11.jpg', cap: '뜀틀 도전' },
  { src: 'assets/g13.jpg', cap: '격파 수업' },
  { src: 'assets/g12.jpg', cap: '자세 교정' }
];
const INQ_SOURCE = { '홈페이지': 'navy', '네이버예약': 'green', '전화': 'amber', '톡톡': 'blue', '기타': 'gray' };

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtWon = (n) => Number(n || 0).toLocaleString('ko-KR') + '원';
const todayStr = (d = new Date()) => {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const curMonth = () => todayStr().slice(0, 7);
const toastEl = $('#toast');
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}
function daysFromToday(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

/* ---------------- 샘플 데이터 ---------------- */
function sampleData() {
  const kids = [
    ['김하윤', '유아부', '여', '6세', '흰띠', '010-1111-2222', '김미영', '화·목 16:00', true, '낮잠 후 컨디션 좋음'],
    ['이준서', '유아부', '남', '5세', '흰띠', '010-2345-6789', '이재현', '월·수 15:00', true, ''],
    ['박서연', '유아부', '여', '7세', '노랑띠', '010-3456-7890', '박지훈', '화·목 16:00', false, '셔틀 미신청(직접 등하원)'],
    ['최도윤', '초등부', '남', '초1', '노랑띠', '010-4567-8901', '최수진', '월·수 17:00', true, '오성초 1학년'],
    ['정시우', '초등부', '남', '초2', '초록띠', '010-5678-9012', '정민석', '화·목 17:00', true, ''],
    ['한지아', '초등부', '여', '초3', '초록띠', '010-6789-0123', '한경민', '월·수 17:00', false, '발차기 모범생'],
    ['오예준', '초등부', '남', '초4', '파랑띠', '010-7890-1234', '오세영', '화·목 17:00', true, ''],
    ['윤하린', '초등부', '여', '초5', '빨강띠', '010-8901-2345', '윤승화', '월·수 18:30', false, '12월 국기원 2품 심사 준비'],
    ['강태현', '중고등·성인부', '남', '중2', '품띠/단', '010-9012-3456', '강현숙', '월·수 19:30', false, '1단 심사 준비'],
    ['신동현', '중고등·성인부', '남', '성인', '초록띠', '010-0123-4567', '-', '화·목 20:00', false, '직장인 스트레스 해소 목적'],
    ['문가은', '선수·시범단(카도스)', '여', '초6', '품띠/단', '010-1234-5678', '문정환', '월·화·목 19:00', true, '시범단 주장, 대회 준비 중'],
    ['배지후', '줄넘기·호신술 특화반', '남', '초3', '노랑띠', '010-2345-1111', '배성일', '금 17:00', false, '학교 줄넘기 시험 대비']
  ].map((k, i) => ({
    id: 'S' + String(101 + i),
    name: k[0], part: k[1], gender: k[2], age: k[3], belt: k[4],
    parentPhone: k[5], parentName: k[6], classTime: k[7], shuttle: k[8], memo: k[9],
    joined: '2026-03-02', active: true
  }));

  const today = todayStr();
  const attendance = {};
  for (let d = 1; d <= 6; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    attendance[todayStr(dt)] = {};
    kids.forEach((k, i) => { attendance[todayStr(dt)][k.id] = (i % 9 === 4) ? '결석' : (i % 7 === 3 ? '지각' : '출석'); });
  }
  attendance[today] = {};
  kids.slice(0, 7).forEach((k) => { attendance[today][k.id] = '출석'; });
  attendance[today]['S103'] = '지각';

  const payments = kids.map((k, i) => ({
    id: 'P' + String(201 + i),
    studentId: k.id,
    month: curMonth(),
    fee: 150000,
    paid: i % 4 !== 1,
    method: i % 4 === 1 ? null : ['카드', '계좌이체', '제로페이', '현금'][i % 4],
    paidAt: i % 4 !== 1 ? today : null
  }));
  payments[2].fee = 135000;

  const inquiries = [
    { id: 'Q301', date: '2026-11-15', name: '김은주', phone: '010-5555-1111', childName: '김서준', childAge: '7세 / 유치원', part: '유아부', time: '평일 오후', memo: '오성초 뒤아파트에 살아요. 셔틀 가능한지 궁금합니다.', status: '체험예정', replyNote: '11/18(수) 16시 체험 예정, 셔틀 안내 완료', source: '홈페이지' },
    { id: 'Q302', date: '2026-11-16', name: '정민호', phone: '010-4444-2222', childName: '정하율', childAge: '10세 / 초4', part: '초등부', time: '주말 오전', memo: '형제 함께 등록 시 할인이 있나요?', status: '연락완료', replyNote: '11/16 전화 안내(형제 10% 할인)', source: '네이버예약' },
    { id: 'Q303', date: today, name: '박소연', phone: '010-7777-3333', childName: '박지호', childAge: '12세 / 초6', part: '선수·시범단(카도스)', time: '평일 저녁', memo: '시범단 오디션 일정이 궁금합니다.', status: '대기', replyNote: '', source: '홈페이지' }
  ];

  const exams = [
    { id: 'E401', name: '윤하린', type: '국기원', target: '2품', date: '2026-12-05', status: '접수완료', memo: '천안지역 제13차' },
    { id: 'E402', name: '강태현', type: '국기원', target: '1단', date: '2026-12-05', status: '미접수', memo: '서류 미제출' },
    { id: 'E403', name: '문가은', type: '국기원', target: '3품', date: '2026-12-05', status: '미접수', memo: '' },
    { id: 'E404', name: '오예준', type: '도장자체', target: '파랑띠→빨강띠', date: '2026-11-28', status: '접수완료', memo: '도장 승급 심사' },
    { id: 'E405', name: '정시우', type: '도장자체', target: '초록띠→파랑띠', date: '2026-11-28', status: '합격', memo: '11월 분' }
  ];

  const notices = [
    { id: 'N501', title: '12월 국기원 승품·단 심사 안내', body: '2026년도 12월 국기원 승품·단 심사(천안지역, 제13차)가 아래와 같이 진행됩니다.\n\n· 심사 일시: 2026-12-05(토) 10:00~\n· 접수 기간: 2026-11-20(금) ~ 11-27(금)\n· 심의 종목: 1품~3품, 1단~3단\n· 장소: 접수 완료 후 공지\n\n접수를 희망하는 수련생은 접수 기간 내 사무실로 신청해 주세요. 도장 자체 모의 심사는 11월 말에 진행합니다.', date: '2026-11-17', tag: '심사' },
    { id: 'N502', title: '제44회 충청남도지사기 태권도대회 참가 안내', body: '제44회 충청남도지사기 태권도대회가 11/20~23 서산 시민체육관에서 열립니다(개회식 11/21 11:00).\n참가를 원하는 선수·시범단 수련생은 사범님에게 이번 주까지 알려주세요.', date: '2026-11-15', tag: '행사' },
    { id: 'N505', title: '0원 무료체험 신청 오픈', body: '국제태권도장 무료체험을 0원으로 신청하실 수 있습니다.\n\n· 체험 대상: 유아부·초등부·중고등·성인부·선수·시범단(카도스)\n· 신청 방법: 네이버 0원 예약 / 카카오톡 1:1 상담 / 네이버 톡톡 / 전화 041-563-4068\n· 체험은 1회 무료이며, 수업 30분 전에 오시면 도장 둘러보기와 상담까지 함께 진행합니다.', date: '2026-11-17', tag: '무료체험' }
  ];

  const schedule = [
    { part: '유아부', day: '월·수', time: '15:00 ~ 15:50', note: '놀이 중심 기본기', instructor: '박주영 관장' },
    { part: '유아부', day: '화·목', time: '16:00 ~ 16:50', note: '인사·예절 중심', instructor: '박주영 관장' },
    { part: '초등부', day: '월·수', time: '17:00 ~ 18:00', note: '품새 집반', instructor: '박주영 관장' },
    { part: '초등부', day: '화·목', time: '17:00 ~ 18:00', note: '겨루기 집반', instructor: '김사범' },
    { part: '초등부', day: '금', time: '17:00 ~ 18:00', note: '보강·승급 심사 보충', instructor: '김사범' },
    { part: '중고등·성인부', day: '월·수', time: '19:30 ~ 20:30', note: '품새·체력', instructor: '박주영 관장' },
    { part: '중고등·성인부', day: '화·목', time: '20:00 ~ 21:00', note: '호신술·스파링', instructor: '박주영 관장' },
    { part: '선수·시범단(카도스)', day: '월·화·목', time: '19:00 ~ 20:30', note: '시범 안무·대회 준비', instructor: '박주영 관장' },
    { part: '줄넘기·호신술 특화반', day: '금', time: '16:00 ~ 17:00', note: '줄넘기 급수', instructor: '김사범' },
    { part: '줄넘기·호신술 특화반', day: '토', time: '11:00 ~ 12:00', note: '호신술 기본', instructor: '박주영 관장' }
  ];

  return {
    version: 1,
    pin: DEFAULT_PIN,
    settings: {
      name: '국제태권도장',
      phone: '041-563-4068',
      mobile: '010-9980-3267',
      hours: '월~토 13:00 ~ 21:00',
      fee: 150000,
      address: '충남 천안시 서북구 오성1길 12-13, 경희빌딩 4층'
    },
    students: kids,
    attendance,
    payments,
    inquiries,
    exams,
    notices,
    schedule,
    counters: { S: 200, P: 300, Q: 400, E: 500, N: 600 }
  };
}

/* ---------------- 저장/복원 ---------------- */
function normalize(d) {
  const base = sampleData();
  const out = { ...base, ...d };
  out.settings = { ...base.settings, ...(d.settings || {}) };
  ['students', 'payments', 'inquiries', 'exams', 'notices', 'schedule'].forEach((k) => { if (!Array.isArray(d[k])) out[k] = base[k]; });
  if (!d.attendance || typeof d.attendance !== 'object') out.attendance = base.attendance;
  out.counters = { ...base.counters, ...(d.counters || {}) };
  // 2026-11-17: 지난·모순 샘플 공지(추석 휴무, 11월 자체 승급 심사 결과) 정리
  out.notices = out.notices.filter((n) => n && n.id !== 'N503' && n.id !== 'N504');
  if (!out.notices.some((n) => /무료체험/.test(n.title || ''))) {
    const ft = base.notices.find((n) => n.id === 'N505');
    if (ft) out.notices.unshift(ft);
  }
  if (typeof out.pin !== 'string' || !/^\d{4}$/.test(out.pin)) out.pin = DEFAULT_PIN;
  return out;
}
let DB = null;
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    DB = raw ? normalize(JSON.parse(raw)) : sampleData();
  } catch (e) {
    console.error('데이터 복원 실패, 샘플로 시작합니다.', e);
    DB = sampleData();
  }
}
let saveTimer = null;
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(DB));
    const el = $('#saveState');
    if (el) {
      el.textContent = '✓ 저장됨 ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      el.style.color = '#6fd6a0';
      setTimeout(() => { el.textContent = '● 브라우저에 자동 저장'; el.style.color = ''; }, 2200);
    }
  } catch (e) {
    console.error('저장 실패', e);
    toast('⚠️ 저장에 실패했습니다. 저장 공간을 확인해 주세요.');
  }
}
function nextId(prefix) {
  DB.counters[prefix] = (DB.counters[prefix] || 100) + 1;
  return prefix + String(DB.counters[prefix]);
}

/* ---------------- 공통 렌더 ---------------- */
function renderPublicData() {
  const s = DB.settings;
  $$('[data-academy-phone]').forEach((el) => {
    el.textContent = s.phone;
    const a = el.closest('a');
    if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('tel:')) a.href = 'tel:' + s.phone.replace(/[^0-9]/g, '');
  });
  $$('[data-academy-hours]').forEach((el) => { el.textContent = s.hours; });

  // time select
  const sel = $('#applyTime');
  if (sel) {
    const prev = sel.value;
    const opts = [...new Set(DB.schedule.map((r) => r.day + ' ' + r.time))];
    sel.innerHTML = '<option value="">선택해 주세요</option>' + opts.map((o) => `<option>${esc(o)}</option>`).join('');
    if (prev) sel.value = prev;
  }

  // schedule table
  const tb = $('#publicSchedule');
  if (tb) {
    tb.innerHTML = DB.schedule.length
      ? DB.schedule.map((r) => `<tr>
          <td class="td-part"><span class="p-dot"></span>${esc(r.part)}</td>
          <td class="td-day">${esc(r.day)}</td>
          <td><strong>${esc(r.time)}</strong></td>
          <td class="td-note">${esc(r.note || '')}</td>
          <td class="td-note">${esc(r.instructor || '')}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">등록된 시간표가 없습니다.</td></tr>';
  }

  // notices
  renderNotices();
}

function renderNotices() {
  const list = $('#noticeList');
  if (!list) return;
  const sorted = [...DB.notices].sort((a, b) => (a.date < b.date ? 1 : -1));
  const showAll = list.dataset.showAll === '1';
  const items = showAll ? sorted : sorted.slice(0, 4);
  list.innerHTML = items.length
    ? items.map((n) => `<article class="notice-item" data-notice="${n.id}" role="button" tabindex="0">
        <div class="notice-top">
          <span class="notice-tag ${esc(n.tag || '안내')}">${esc(n.tag || '안내')}</span>
          <span class="notice-date">${esc(n.date)}</span>
        </div>
        <h3>${esc(n.title)}</h3>
        <div class="notice-body">${esc(n.body)}</div>
      </article>`).join('')
    : '<div class="empty-state"><span class="empty-ico">📣</span>등록된 공지가 아직 없습니다.</div>';
  const btn = $('#moreNoticesBtn');
  if (btn) btn.textContent = showAll ? '공지 접기' : '공지 더보기';
}

/* ---------------- 갤러리 ---------------- */
let lbIndex = 0;
function openLightbox(i) {
  lbIndex = (i + GALLERY.length) % GALLERY.length;
  $('#lbImage').src = GALLERY[lbIndex].src;
  $('#lbImage').alt = GALLERY[lbIndex].cap;
  $('#lbCaption').textContent = GALLERY[lbIndex].cap;
  $('#lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  $('#lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

/* ---------------- 모달 ---------------- */
function openModal(title, html) {
  $('#genericModalTitle').textContent = title;
  $('#genericModalBody').innerHTML = html;
  $('#genericModal').classList.remove('hidden');
}
function closeModal() { $('#genericModal').classList.add('hidden'); }

/* ============================================================
   관리자
   ============================================================ */
const ADMIN_TABS = [
  ['dashboard', '📊', '대시보드'],
  ['students', '👥', '원생 관리'],
  ['attendance', '✅', '출결 관리'],
  ['payments', '💳', '수납·회비'],
  ['exams', '🏅', '심사 관리'],
  ['inquiries', '📨', '체험·상담 문의'],
  ['settings', '⚙️', '공지·시간표·설정']
];
let adminTab = 'dashboard';
let attDate = todayStr();
let payMonth = curMonth();
let searchQ = '', partFilter = '', beltFilter = '';

function adminUnlocked() { return sessionStorage.getItem('kukje_admin_ok') === '1'; }
function openAdmin() {
  if (adminUnlocked()) { enterAdmin(); return; }
  $('#pinError').classList.add('hidden');
  $('#pinInput').value = '';
  $('#pinModal').classList.remove('hidden');
  setTimeout(() => $('#pinInput').focus(), 60);
}
function enterAdmin() {
  $('#pinModal').classList.add('hidden');
  $('#publicApp').classList.add('hidden');
  $('#adminApp').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('#adminToday').textContent = todayStr() + ' (' + ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()] + ')';
  renderAdmin();
  window.scrollTo(0, 0);
}
function exitAdmin() {
  $('#adminApp').classList.add('hidden');
  $('#publicApp').classList.remove('hidden');
  document.body.style.overflow = '';
  sessionStorage.removeItem('kukje_admin_ok');
  renderPublicData();
  renderNotices();
}

function renderAdmin() {
  $('#adminNav').innerHTML = ADMIN_TABS.map(([id, ico, label]) => {
    const badge = id === 'inquiries' ? DB.inquiries.filter((q) => q.status === '대기').length : 0;
    return `<button type="button" class="nav-item ${adminTab === id ? 'active' : ''}" data-tab="${id}">
      <span>${ico}</span><span class="nav-label">${label}</span>
      ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
    </button>`;
  }).join('');
  const views = {
    dashboard: viewDashboard, students: viewStudents, attendance: viewAttendance,
    payments: viewPayments, exams: viewExams, inquiries: viewInquiries, settings: viewSettings
  };
  $('#adminMain').innerHTML = views[adminTab]();
}

/* ---------- 1. 대시보드 ---------- */
function viewDashboard() {
  const total = DB.students.length;
  const today = todayStr();
  const tAtt = DB.attendance[today] || {};
  const attCount = Object.values(tAtt).filter((v) => v === '출석' || v === '지각').length;
  const absent = Object.values(tAtt).filter((v) => v === '결석').length;
  const unchecked = total - Object.keys(tAtt).length;
  const month = curMonth();
  const pm = DB.payments.filter((p) => p.month === month);
  const paid = pm.filter((p) => p.paid).length;
  const unpaidList = pm.filter((p) => !p.paid);
  const rate = pm.length ? Math.round((paid / pm.length) * 100) : 0;
  const waiting = DB.inquiries.filter((q) => q.status === '대기').length;
  const plannedExams = DB.exams
    .filter((e) => e.status !== '합격')
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const soon = plannedExams.filter((e) => { const d = daysFromToday(e.date); return d !== null && d >= 0 && d <= 30; });

  return `
  <div class="adm-head">
    <div><h2>대시보드</h2><p class="adm-sub">오늘 ${today} · 도장 운영 한눈에 보기</p></div>
    <div class="adm-actions"><button type="button" class="mini-btn" data-tab-jump="attendance">오늘 출결 입력 →</button></div>
  </div>

  <div class="stat-grid">
    <div class="stat-card"><span class="stat-label">총 원생</span><div class="stat-value">${total}명</div><span class="stat-sub">활동 원생 기준</span></div>
    <div class="stat-card"><span class="stat-label">오늘 출석 현황</span><div class="stat-value green">${attCount}명</div><span class="stat-sub">지각 포함 · 미체크 ${unchecked}명 · 결석 ${absent}명</span></div>
    <div class="stat-card"><span class="stat-label">이번 달 수납률</span><div class="stat-value ${rate >= 80 ? 'green' : 'red'}">${rate}%</div><span class="stat-sub">${paid}/${pm.length}건 납부 · 미납 ${unpaidList.length}건</span></div>
    <div class="stat-card"><span class="stat-label">미처리 문의</span><div class="stat-value ${waiting ? 'red' : 'green'}">${waiting}건</div><span class="stat-sub">체험·상담 대기 중</span></div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>📌 다가오는 심사 일정</h3><span class="panel-sub">30일 이내</span></div>
    <div class="panel-body">
      ${soon.length ? `<div class="mini-list">${soon.map((e) => {
        const d = daysFromToday(e.date);
        return `<div class="mini-item"><span class="badge ${e.type === '국기원' ? 'navy' : 'gray'}">${esc(e.type)}</span>
          <strong>${esc(e.name)}</strong> <span>${esc(e.target)}</span>
          <span class="badge ${e.status === '접수완료' ? 'green' : 'amber'}">${esc(e.status)}</span>
          <span class="mini-meta"><strong>${esc(e.date)}</strong><br>D-${d}</span></div>`;
      }).join('')}</div>` : '<div class="empty-state"><span class="empty-ico">🏅</span>30일 이내 예정된 심사가 없습니다.</div>'}
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>📨 최근 체험·상담 문의</h3><button type="button" class="mini-btn" data-tab-jump="inquiries">전체 보기 →</button></div>
    <div class="panel-body">
      ${DB.inquiries.length ? `<div class="mini-list">${DB.inquiries.slice(0, 5).map((q) => `<div class="mini-item">
        <span class="badge ${INQ_STATUS_BADGE[q.status] || 'gray'}">${esc(q.status)}</span>
        <strong>${esc(q.name)}</strong><span class="td-muted">${esc(q.phone)}</span>
        ${q.childName ? `<span class="td-muted">자녀 ${esc(q.childName)}</span>` : ''}
        <span class="mini-meta">${esc(q.date)}</span></div>`).join('')}</div>` : '<div class="empty-state">문의가 없습니다.</div>'}
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>💳 미납 원생 (이번 달)</h3><button type="button" class="mini-btn" data-tab-jump="payments">수납 관리 →</button></div>
    <div class="panel-body">
      ${unpaidList.length ? `<div class="mini-list">${unpaidList.map((p) => {
        const st = DB.students.find((s) => s.id === p.studentId);
        return `<div class="mini-item"><strong>${esc(st ? st.name : '삭제된 원생')}</strong>
          <span class="td-muted">${st ? esc(st.part) : ''}</span>
          <span class="badge red">미납</span>
          <span class="mini-meta">${fmtWon(p.fee)}</span></div>`;
      }).join('')}</div>` : '<div class="empty-state"><span class="empty-ico">🎉</span>이번 달 미납이 없습니다!</div>'}
    </div>
  </div>`;
}

/* ---------- 2. 원생 관리 ---------- */
function viewStudents() {
  let list = DB.students;
  if (searchQ) {
    const q = searchQ.toLowerCase();
    list = list.filter((s) => [s.name, s.parentName, s.parentPhone, s.age].join(' ').toLowerCase().includes(q));
  }
  if (partFilter) list = list.filter((s) => s.part === partFilter);
  if (beltFilter) list = list.filter((s) => s.belt === beltFilter);

  return `
  <div class="adm-head">
    <div><h2>원생 관리</h2><p class="adm-sub">총 ${DB.students.length}명 · 검색 결과 ${list.length}명</p></div>
    <div class="adm-actions"><button type="button" class="mini-btn primary" data-act="add-student">＋ 원생 추가</button></div>
  </div>

  <div class="filter-bar">
    <input type="search" placeholder="이름·학부모·연락처 검색" value="${esc(searchQ)}" data-filter="q" />
    <select data-filter="part">
      <option value="">전체 부</option>
      ${PARTS.map((p) => `<option ${p === partFilter ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
    <select data-filter="belt">
      <option value="">전체 띠</option>
      ${BELTS.map((b) => `<option ${b === beltFilter ? 'selected' : ''}>${b}</option>`).join('')}
    </select>
  </div>

  <div class="panel"><div class="table-wrap">
    ${list.length ? `<table class="data-table">
      <thead><tr><th>원생</th><th>부</th><th>나이</th><th>띠</th><th>학부모 연락처</th><th>수업시간</th><th>셔틀</th><th>메모</th><th>관리</th></tr></thead>
      <tbody>${list.map((s) => `<tr>
        <td class="td-name">${esc(s.name)}${s.active ? '' : ' <span class="badge gray">비활동</span>'}</td>
        <td class="td-muted">${esc(s.part)}</td>
        <td>${esc(s.gender || '')} ${esc(s.age || '')}</td>
        <td><span class="badge ${beltBadge(s.belt)}">${esc(s.belt)}</span></td>
        <td class="td-muted">${esc(s.parentName || '')} ${esc(s.parentPhone || '')}</td>
        <td class="td-muted">${esc(s.classTime || '')}</td>
        <td>${s.shuttle ? '🚐 탑승' : '<span class="td-muted">미신청</span>'}</td>
        <td class="td-muted" style="max-width:180px">${esc(s.memo || '')}</td>
        <td><div class="row-actions">
          <button type="button" class="mini-btn" data-student-edit="${s.id}">수정</button>
          <button type="button" class="mini-btn danger" data-student-del="${s.id}">삭제</button>
        </div></td>
      </tr>`).join('')}</tbody>
    </table>` : '<div class="empty-state"><span class="empty-ico">👥</span>조건에 맞는 원생이 없습니다.</div>'}
  </div></div>`;
}
function beltBadge(b) {
  return { '흰띠': 'gray', '노랑띠': 'amber', '초록띠': 'green', '파랑띠': 'blue', '빨강띠': 'red', '품띠/단': 'navy' }[b] || 'gray';
}
function studentForm(s) {
  const v = s || { name: '', part: PARTS[0], gender: '남', age: '', belt: BELTS[0], parentName: '', parentPhone: '', classTime: '', shuttle: false, memo: '', joined: todayStr(), active: true };
  return `<div class="form-grid">
    <label class="field"><span class="field-label">원생 이름 <b>*</b></span><input name="name" value="${esc(v.name)}" required /></label>
    <label class="field"><span class="field-label">부</span><select name="part">${PARTS.map((p) => `<option ${p === v.part ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">성별</span><select name="gender">${['남', '여'].map((g) => `<option ${g === v.gender ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">나이 / 학년</span><input name="age" value="${esc(v.age)}" placeholder="예) 8세 / 초1" /></label>
    <label class="field"><span class="field-label">띠</span><select name="belt">${BELTS.map((b) => `<option ${b === v.belt ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">학부모 이름</span><input name="parentName" value="${esc(v.parentName)}" /></label>
    <label class="field full"><span class="field-label">학부모 연락처</span><input name="parentPhone" value="${esc(v.parentPhone)}" placeholder="010-0000-0000" inputmode="tel" /></label>
    <label class="field full"><span class="field-label">수업 시간</span><input name="classTime" value="${esc(v.classTime)}" placeholder="예) 화·목 17:00" /></label>
    <label class="field full"><span class="field-label">메모</span><textarea name="memo" rows="2">${esc(v.memo)}</textarea></label>
    <label class="check-grid"><label><input type="checkbox" name="shuttle" ${v.shuttle ? 'checked' : ''}/> 등하원 셔틀 탑승</label>
    <label><input type="checkbox" name="active" ${v.active ? 'checked' : ''}/> 활동 중</label></label>
  </div>
  <div class="modal-foot">
    <button type="button" class="btn btn-ghost-dark" data-action="close-modal">취소</button>
    <button type="button" class="btn btn-navy" data-student-save="${esc(v.id || '')}">저장</button>
  </div>`;
}
function saveStudent(id) {
  const box = $('#genericModalBody');
  const get = (n) => box.querySelector(`[name="${n}"]`);
  const name = get('name').value.trim();
  if (!name) { toast('원생 이름을 입력해 주세요.'); return; }
  const obj = {
    name, part: get('part').value, gender: get('gender').value, age: get('age').value.trim(),
    belt: get('belt').value, parentName: get('parentName').value.trim(), parentPhone: get('parentPhone').value.trim(),
    classTime: get('classTime').value.trim(), memo: get('memo').value.trim(),
    shuttle: get('shuttle').checked, active: get('active').checked
  };
  if (id) {
    Object.assign(DB.students.find((s) => s.id === id), obj);
    toast('수정되었습니다 ✓');
  } else {
    DB.students.push({ id: nextId('S'), joined: todayStr(), ...obj });
    toast('원생이 추가되었습니다 ✓');
  }
  save();
  closeModal();
  renderAdmin();
}
function delStudent(id) {
  const s = DB.students.find((x) => x.id === id);
  if (!s) return;
  openModal('원생 삭제', `<p class="modal-desc"><strong>${esc(s.name)}</strong> 원생을 삭제할까요?<br />출결·수납 기록에서도 함께 사라집니다. 되돌릴 수 없습니다.</p>
    <div class="modal-foot"><button type="button" class="btn btn-ghost-dark" data-action="close-modal">취소</button>
    <button type="button" class="btn btn-danger" data-student-del-ok="${id}">삭제합니다</button></div>`);
}

/* ---------- 3. 출결 관리 ---------- */
function viewAttendance() {
  const rec = DB.attendance[attDate] || {};
  const summary = { 출석: 0, 지각: 0, 결석: 0, 보강: 0 };
  Object.values(rec).forEach((v) => { if (summary[v] !== undefined) summary[v]++; });
  const total = DB.students.length;
  const checked = Object.keys(rec).length;
  const rate = checked ? Math.round(((summary['출석'] + summary['지각']) / checked) * 100) : 0;

  return `
  <div class="adm-head">
    <div><h2>출결 관리</h2><p class="adm-sub">날짜를 고르고 원터치로 체크하세요</p></div>
  </div>

  <div class="stat-grid">
    <div class="stat-card"><span class="stat-label">출석</span><div class="stat-value green">${summary['출석']}명</div></div>
    <div class="stat-card"><span class="stat-label">지각</span><div class="stat-value" style="color:var(--amber)">${summary['지각']}명</div></div>
    <div class="stat-card"><span class="stat-label">결석</span><div class="stat-value red">${summary['결석']}명</div></div>
    <div class="stat-card"><span class="stat-label">출석률</span><div class="stat-value">${rate}%</div><span class="stat-sub">체크 ${checked}/${total}명 · 보강 ${summary['보강']}명</span></div>
  </div>

  <div class="filter-bar">
    <input type="date" value="${attDate}" data-att-date />
    <label><input type="checkbox" data-att-today/> 오늘 날짜</label>
  </div>

  <div class="panel"><div class="table-wrap">
    ${DB.students.length ? `<table class="data-table">
      <thead><tr><th>원생</th><th>부</th><th>상태</th><th style="width:270px">체크</th></tr></thead>
      <tbody>${DB.students.map((s) => `<tr>
        <td class="td-name">${esc(s.name)}</td>
        <td class="td-muted">${esc(s.part)}</td>
        <td>${rec[s.id] ? `<span class="badge ${attBadge(rec[s.id])}">${rec[s.id]}</span>` : '<span class="badge gray">미체크</span>'}</td>
        <td><div class="row-actions">
          ${ATT_STATES.map((st) => `<button type="button" class="att-btn ${rec[s.id] === st ? 'on-' + st : ''}" data-att="${s.id}|${st}">${st}</button>`).join('')}
        </div></td>
      </tr>`).join('')}</tbody>
    </table>` : '<div class="empty-state">등록된 원생이 없습니다.</div>'}
  </div></div>`;
}
function attBadge(st) { return { '출석': 'green', '지각': 'amber', '결석': 'red', '보강': 'blue' }[st] || 'gray'; }
function setAtt(sid, st) {
  if (!DB.attendance[attDate]) DB.attendance[attDate] = {};
  const cur = DB.attendance[attDate][sid];
  if (cur === st) delete DB.attendance[attDate][sid]; else DB.attendance[attDate][sid] = st;
  save();
  renderAdmin();
}

/* ---------- 4. 수납·회비 ---------- */
function viewPayments() {
  let rows = DB.payments.filter((p) => p.month === payMonth);
  if (payUnpaidOnly) rows = rows.filter((p) => !p.paid);
  const unpaid = rows.filter((p) => !p.paid);
  const total = rows.reduce((a, p) => a + Number(p.fee || 0), 0);
  const collected = rows.filter((p) => p.paid).reduce((a, p) => a + Number(p.fee || 0), 0);

  const stuOf = (id) => DB.students.find((s) => s.id === id);

  return `
  <div class="adm-head">
    <div><h2>수납 · 회비 관리</h2><p class="adm-sub">월별 수련비 납부 현황</p></div>
    <div class="adm-actions"><button type="button" class="mini-btn primary" data-act="gen-month">이번 달 회계 생성</button></div>
  </div>

  <div class="stat-grid">
    <div class="stat-card"><span class="stat-label">납부 완료</span><div class="stat-value green">${fmtWon(collected)}</div></div>
    <div class="stat-card"><span class="stat-label">미수납</span><div class="stat-value red">${fmtWon(unpaid.reduce((a, p) => a + Number(p.fee || 0), 0))}</div><span class="stat-sub">${unpaid.length}건</span></div>
    <div class="stat-card"><span class="stat-label">당월 총 청구</span><div class="stat-value">${fmtWon(total)}</div><span class="stat-sub">${rows.length}건</span></div>
    <div class="stat-card"><span class="stat-label">수납률</span><div class="stat-value">${rows.length ? Math.round((collected / total) * 100) : 0}%</div></div>
  </div>

  <div class="filter-bar">
    <input type="month" value="${payMonth}" data-pay-month />
    <label><input type="checkbox" data-pay-unpaid-only ${payUnpaidOnly ? 'checked' : ''}/> 미납자 모아보기</label>
  </div>

  <div class="panel"><div class="table-wrap">
    ${rows.length ? `<table class="data-table">
      <thead><tr><th>원생</th><th>부</th><th>월</th><th>금액</th><th>납부</th><th>결제수단</th><th>납부일</th><th>변경</th></tr></thead>
      <tbody>${rows.map((p) => {
        const st = stuOf(p.studentId);
        return `<tr>
          <td class="td-name">${esc(st ? st.name : '삭제된 원생')}</td>
          <td class="td-muted">${st ? esc(st.part) : '-'}</td>
          <td class="td-muted">${esc(p.month)}</td>
          <td><input type="number" value="${Number(p.fee)}" data-fee="${p.id}" style="width:110px;border:1.5px solid #d4dce8;border-radius:7px;padding:5px 8px" />원</td>
          <td>${p.paid ? '<span class="badge green">납부</span>' : '<span class="badge red">미납</span>'}</td>
          <td>${p.method ? `<span class="badge navy">${esc(p.method)}</span>` : '<span class="td-muted">-</span>'}</td>
          <td class="td-muted">${p.paidAt ? esc(p.paidAt) : '-'}</td>
          <td><div class="row-actions">
            <button type="button" class="mini-btn ${p.paid ? '' : 'primary'}" data-pay-toggle="${p.id}">${p.paid ? '미납으로' : '납부'}</button>
            ${PAY_METHODS.map((m) => `<button type="button" class="mini-btn" data-pay-method="${p.id}|${m}">${m}</button>`).join('')}
            <button type="button" class="mini-btn danger" data-pay-del="${p.id}">삭제</button>
          </div></td>
        </tr>`;
      }).join('')}</tbody>
    </table>` : '<div class="empty-state"><span class="empty-ico">💳</span>이 달의 회계 항목이 없습니다. [이번 달 회계 생성]을 눌러 시작하세요.</div>'}
  </div></div>`;
}
let payUnpaidOnly = false;

/* ---------- 5. 심사 관리 ---------- */
function viewExams() {
  const sorted = [...DB.exams].sort((a, b) => (a.date > b.date ? 1 : -1));
  const kkt = sorted.filter((e) => e.type === '국기원');
  const own = sorted.filter((e) => e.type !== '국기원');
  const block = (title, list, hint) => `
    <div class="panel">
      <div class="panel-head"><div><h3>${title}</h3><span class="panel-sub">${hint}</span></div></div>
      <div class="table-wrap">
      ${list.length ? `<table class="data-table">
        <thead><tr><th>수련생</th><th>심사</th><th>대상</th><th>일시</th><th>접수 상태</th><th>메모</th><th>관리</th></tr></thead>
        <tbody>${list.map((e) => `<tr>
          <td class="td-name">${esc(e.name)}</td>
          <td><span class="badge ${e.type === '국기원' ? 'navy' : 'gray'}">${esc(e.type)}</span></td>
          <td>${esc(e.target)}</td>
          <td class="td-muted">${esc(e.date)}</td>
          <td><span class="badge ${e.status === '합격' ? 'green' : e.status === '접수완료' ? 'blue' : 'amber'}">${esc(e.status)}</span></td>
          <td class="td-muted">${esc(e.memo || '')}</td>
          <td><div class="row-actions">
            <button type="button" class="mini-btn" data-exam-edit="${e.id}">수정</button>
            <button type="button" class="mini-btn danger" data-exam-del="${e.id}">삭제</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>` : '<div class="empty-state">등록된 심사 대상자가 없습니다.</div>'}
      </div>
    </div>`;

  return `
  <div class="adm-head">
    <div><h2>승급 · 국기원 심사 관리</h2><p class="adm-sub">도장 자체 승급 심사와 국기원 승품·단 심사를 함께 관리합니다</p></div>
    <div class="adm-actions"><button type="button" class="mini-btn primary" data-act="add-exam">＋ 심사 대상자 등록</button></div>
  </div>
  ${block('🏅 국기원 승품·단 심사', kkt, '예: 2026-12-05 천안지역 제13차 (접수 11/20~27)')}
  ${block('🥋 도장 자체 승급 심사', own, '분기·월별 도장 자체 심사')}`;
}
function examForm(e) {
  const v = e || { name: '', type: '국기원', target: '', date: '2026-12-05', status: '미접수', memo: '' };
  return `<div class="form-grid">
    <label class="field full"><span class="field-label">수련생 이름 <b>*</b></span><input name="name" value="${esc(v.name)}" list="studentNameList" required /></label>
    <datalist id="studentNameList">${DB.students.map((s) => `<option value="${esc(s.name)}"></option>`).join('')}</datalist>
    <label class="field"><span class="field-label">심사 구분</span><select name="type">${['국기원', '도장자체'].map((t) => `<option ${t === v.type ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">대상 (띠/품/단)</span><input name="target" value="${esc(v.target)}" placeholder="예) 2품 / 1단 / 파랑띠→빨강띠" /></label>
    <label class="field"><span class="field-label">심사 일시</span><input type="date" name="date" value="${esc(v.date)}" /></label>
    <label class="field"><span class="field-label">접수 상태</span><select name="status">${['미접수', '접수완료', '합격'].map((s2) => `<option ${s2 === v.status ? 'selected' : ''}>${s2}</option>`).join('')}</select></label>
    <label class="field full"><span class="field-label">메모</span><textarea name="memo" rows="2">${esc(v.memo)}</textarea></label>
  </div>
  <div class="modal-foot">
    <button type="button" class="btn btn-ghost-dark" data-action="close-modal">취소</button>
    <button type="button" class="btn btn-navy" data-exam-save="${esc(v.id || '')}">저장</button>
  </div>`;
}
function saveExam(id) {
  const box = $('#genericModalBody');
  const get = (n) => box.querySelector(`[name="${n}"]`);
  const name = get('name').value.trim();
  if (!name) { toast('수련생 이름을 입력해 주세요.'); return; }
  const obj = { name, type: get('type').value, target: get('target').value.trim(), date: get('date').value, status: get('status').value, memo: get('memo').value.trim() };
  if (id) Object.assign(DB.exams.find((e) => e.id === id), obj);
  else DB.exams.push({ id: nextId('E'), ...obj });
  save(); closeModal(); renderAdmin();
  toast('심사 정보가 저장되었습니다 ✓');
}

/* ---------- 6. 체험·상담 문의 ---------- */
function viewInquiries() {
  const sorted = [...DB.inquiries].sort((a, b) => (a.date < b.date ? 1 : -1));
  return `
  <div class="adm-head">
    <div><h2>체험 · 상담 문의</h2><p class="adm-sub">홈페이지 신청서와 예약 문의가 여기에 쌓입니다</p></div>
  </div>
  ${sorted.length ? sorted.map((q) => `<div class="panel">
    <div class="panel-head">
      <div>
        <h3>${esc(q.name)} <span class="td-muted">${esc(q.phone)}</span></h3>
        <span class="panel-sub">${esc(q.date)} · 접수처 <span class="badge ${INQ_SOURCE[q.source] || 'gray'}">${esc(q.source)}</span></span>
      </div>
      <div class="adm-actions">
        ${INQ_STATUS.map((s2) => `<button type="button" class="mini-btn ${q.status === s2 ? 'gold' : ''}" data-inq-status="${q.id}|${s2}">${s2}</button>`).join('')}
        <button type="button" class="mini-btn danger" data-inq-del="${q.id}">삭제</button>
      </div>
    </div>
    <div class="panel-body">
      <div class="form-grid">
        <div><span class="field-label">자녀 정보</span><p>${esc(q.childName || '-')} / ${esc(q.childAge || '-')}</p></div>
        <div><span class="field-label">희망 부 · 시간</span><p>${esc(q.part || '-')}${q.time ? ' · ' + esc(q.time) : ''}</p></div>
        <div class="full"><span class="field-label">문의 메모</span><p style="white-space:pre-line">${esc(q.memo || '-')}</p></div>
        <div class="full">
          <span class="field-label">상담 기록 (응대 메모 저장)</span>
          <div style="display:flex;gap:8px">
            <input type="text" data-inq-note="${q.id}" value="${esc(q.replyNote || '')}" placeholder="예) 11/18 16시 체험 예정, 셔틀 안내 완료" style="flex:1;border:1.5px solid #d4dce8;border-radius:9px;padding:9px 12px" />
            <button type="button" class="mini-btn primary" data-inq-note-save="${q.id}">메모 저장</button>
            <a class="mini-btn" href="tel:${esc(q.phone.replace(/[^0-9+]/g, ''))}">☎ 전화</a>
          </div>
        </div>
      </div>
    </div>
  </div>`).join('') : '<div class="empty-state"><span class="empty-ico">📨</span>아직 문의가 없습니다. 홈페이지 신청 폼에서 접수되면 이곳에 표시됩니다.</div>'}`;
}

/* ---------- 7. 공지·시간표·설정 ---------- */
function viewSettings() {
  const s = DB.settings;
  return `
  <div class="adm-head"><div><h2>공지 · 시간표 · 도장 설정</h2><p class="adm-sub">여기서 바꾸면 홈페이지에 즉시 반영됩니다</p></div></div>

  <div class="panel">
    <div class="panel-head"><div><h3>📣 공지사항 관리</h3><span class="panel-sub">홈페이지 공지사항 섹션에 바로 노출됩니다</span></div>
      <div class="adm-actions"><button type="button" class="mini-btn primary" data-act="add-notice">＋ 공지 등록</button></div></div>
    <div class="table-wrap">
      ${DB.notices.length ? `<table class="data-table">
        <thead><tr><th>제목</th><th>분류</th><th>날짜</th><th>관리</th></tr></thead>
        <tbody>${[...DB.notices].sort((a, b) => (a.date < b.date ? 1 : -1)).map((n) => `<tr>
          <td class="td-name">${esc(n.title)}</td>
          <td><span class="badge gray">${esc(n.tag)}</span></td>
          <td class="td-muted">${esc(n.date)}</td>
          <td><div class="row-actions">
            <button type="button" class="mini-btn" data-notice-edit="${n.id}">수정</button>
            <button type="button" class="mini-btn danger" data-notice-del="${n.id}">삭제</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>` : '<div class="empty-state">공지가 없습니다.</div>'}
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><div><h3>🕒 수업 시간표 관리</h3><span class="panel-sub">홈페이지 시간표에 즉시 반영됩니다</span></div>
      <div class="adm-actions"><button type="button" class="mini-btn primary" data-act="add-sched">＋ 시간 추가</button></div></div>
    <div class="table-wrap">
      ${DB.schedule.length ? `<table class="data-table">
        <thead><tr><th>부</th><th>요일</th><th>시간</th><th>내용</th><th>지도</th><th>관리</th></tr></thead>
        <tbody>${DB.schedule.map((r, i) => `<tr>
          <td class="td-name">${esc(r.part)}</td><td>${esc(r.day)}</td><td>${esc(r.time)}</td>
          <td class="td-muted">${esc(r.note || '')}</td><td class="td-muted">${esc(r.instructor || '')}</td>
          <td><div class="row-actions">
            <button type="button" class="mini-btn" data-sched-edit="${i}">수정</button>
            <button type="button" class="mini-btn danger" data-sched-del="${i}">삭제</button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>` : '<div class="empty-state">시간표가 비어 있습니다.</div>'}
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>🏫 도장 기본 정보</h3><span class="panel-sub">전화번호·운영시간·수련비를 바꾸면 홈페이지 전체에 반영됩니다</span></div>
    <div class="panel-body">
      <div class="form-grid">
        <label class="field"><span class="field-label">도장 전화</span><input data-setting="phone" value="${esc(s.phone)}" /></label>
        <label class="field"><span class="field-label">휴대폰(대표)</span><input data-setting="mobile" value="${esc(s.mobile)}" /></label>
        <label class="field"><span class="field-label">운영시간</span><input data-setting="hours" value="${esc(s.hours)}" placeholder="예) 월~토 13:00 ~ 21:00" /></label>
        <label class="field"><span class="field-label">월 수련비(원)</span><input type="number" data-setting="fee" value="${Number(s.fee)}" /></label>
        <label class="field full"><span class="field-label">주소</span><input data-setting="address" value="${esc(s.address)}" /></label>
      </div>
      <button type="button" class="btn btn-navy" data-act="save-settings">설정 저장</button>
      <span class="td-muted small" style="margin-left:10px">저장 즉시 홈페이지에 반영됩니다.</span>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>🔐 관리자 PIN 변경</h3></div>
    <div class="panel-body">
      <div class="pin-change">
        <label class="field"><span class="field-label">새 PIN 4자리</span><input type="password" inputmode="numeric" maxlength="4" id="pinNew" placeholder="••••" /></label>
        <label class="field"><span class="field-label">새 PIN 확인</span><input type="password" inputmode="numeric" maxlength="4" id="pinNew2" placeholder="••••" /></label>
        <button type="button" class="btn btn-navy" data-act="change-pin">PIN 변경</button>
        <p class="td-muted small">현재 PIN이 <strong>${'•'.repeat(4)}</strong>(기본값 0000)로 설정되어 있습니다.</p>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>💾 데이터 관리</h3></div>
    <div class="panel-body">
      <div class="setting-row" style="margin-bottom:14px">
        <button type="button" class="btn btn-ghost-dark" data-action="admin-backup">JSON 백업 내보내기</button>
        <button type="button" class="btn btn-ghost-dark" data-action="admin-restore">JSON 복원 불러오기</button>
        <button type="button" class="btn btn-ghost-dark" data-action="admin-sample">샘플 초기화</button>
      </div>
      <p class="td-muted small">모든 데이터는 이 브라우저의 localStorage에만 저장됩니다. 기기 변경 전에는 JSON 백업을 꼭 만들어 두세요.</p>
      <div class="danger-zone" style="margin-top:16px">
        <h4>⚠️ 전체 초기화</h4>
        <p>원생·출결·수납·문의 등 모든 데이터를 지우고 샘플 상태로 되돌립니다.</p>
        <button type="button" class="btn btn-danger" data-act="reset-all">전체 초기화 (샘플로)</button>
      </div>
    </div>
  </div>`;
}
function noticeForm(n) {
  const v = n || { title: '', tag: '안내', body: '', date: todayStr() };
  return `<div class="form-grid">
    <label class="field full"><span class="field-label">제목 <b>*</b></span><input name="title" value="${esc(v.title)}" required /></label>
    <label class="field"><span class="field-label">분류</span><select name="tag">${['안내', '심사', '행사', '휴무'].map((t) => `<option ${t === v.tag ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">날짜</span><input type="date" name="date" value="${esc(v.date)}" /></label>
    <label class="field full"><span class="field-label">내용</span><textarea name="body" rows="5">${esc(v.body)}</textarea></label>
  </div>
  <div class="modal-foot">
    <button type="button" class="btn btn-ghost-dark" data-action="close-modal">취소</button>
    <button type="button" class="btn btn-navy" data-notice-save="${esc(v.id || '')}">저장하고 홈페이지에 올리기</button>
  </div>`;
}
function saveNotice(id) {
  const box = $('#genericModalBody');
  const get = (n) => box.querySelector(`[name="${n}"]`);
  const title = get('title').value.trim();
  if (!title) { toast('제목을 입력해 주세요.'); return; }
  const obj = { title, tag: get('tag').value, body: get('body').value, date: get('date').value };
  if (id) Object.assign(DB.notices.find((n) => n.id === id), obj);
  else DB.notices.push({ id: nextId('N'), ...obj });
  save(); closeModal(); renderAdmin(); renderNotices();
  toast('공지가 저장되고 홈페이지에 반영되었습니다 ✓');
}
function schedForm(r, idx) {
  const v = r || { part: PARTS[0], day: '월', time: '', note: '', instructor: '' };
  return `<div class="form-grid">
    <label class="field full"><span class="field-label">부</span><select name="part">${PARTS.map((p) => `<option ${p === v.part ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">요일</span><input name="day" value="${esc(v.day)}" placeholder="예) 월·수 / 토" /></label>
    <label class="field"><span class="field-label">시간 <b>*</b></span><input name="time" value="${esc(v.time)}" placeholder="예) 17:00 ~ 18:00" required /></label>
    <label class="field full"><span class="field-label">수업 내용</span><input name="note" value="${esc(v.note || '')}" placeholder="예) 품새 집반" /></label>
    <label class="field full"><span class="field-label">지도</span><input name="instructor" value="${esc(v.instructor || '')}" placeholder="예) 박주영 관장" /></label>
  </div>
  <div class="modal-foot">
    <button type="button" class="btn btn-ghost-dark" data-action="close-modal">취소</button>
    <button type="button" class="btn btn-navy" data-sched-save="${idx === null ? '' : idx}">저장</button>
  </div>`;
}
function saveSched(idx) {
  const box = $('#genericModalBody');
  const get = (n) => box.querySelector(`[name="${n}"]`);
  const time = get('time').value.trim();
  if (!time) { toast('시간을 입력해 주세요.'); return; }
  const obj = { part: get('part').value, day: get('day').value.trim(), time, note: get('note').value.trim(), instructor: get('instructor').value.trim() };
  if (idx !== '') DB.schedule[Number(idx)] = obj; else DB.schedule.push(obj);
  save(); closeModal(); renderAdmin();
  toast('시간표가 저장되고 홈페이지에 반영되었습니다 ✓');
}

/* ---------------- 백업/복원/샘플 ---------------- */
function backup() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `국제태권도장_운영데이터_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('백업 파일을 내려받았습니다 ✓');
}
function restore(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = normalize(JSON.parse(r.result));
      DB = d;
      save();
      renderAdmin();
      renderPublicData();
      toast('복원이 완료되었습니다 ✓');
    } catch (e) {
      console.error(e);
      toast('⚠️ 올바른 백업 파일이 아닙니다.');
    }
  };
  r.readAsText(file);
}
function resetSample() {
  openModal('샘플 초기화', `<p class="modal-desc">모든 데이터를 지우고 <strong>샘플 데이터</strong>(원생 12명, 출결, 수납, 심사, 문의, 공지, 시간표)로 되돌립니다.<br />현재 데이터를 남기고 싶다면 먼저 JSON 백업을 하세요.</p>
  <div class="modal-foot"><button type="button" class="btn btn-ghost-dark" data-action="close-modal">취소</button>
  <button type="button" class="btn btn-danger" data-act="reset-all-ok">초기화합니다</button></div>`);
}

/* ============================================================
   이벤트 바인딩
   ============================================================ */
function bindOnce() {
  // header
  const header = $('#siteHeader');
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

  document.addEventListener('click', (e) => {
    const t = e.target;
    const hit = (sel) => t.closest(sel);

    // nav toggle (mobile)
    if (hit('[data-action="toggle-nav"]')) {
      const nav = $('#mainNav');
      const open = nav.classList.toggle('open');
      e.target.closest('button').setAttribute('aria-expanded', open);
      if (open) {
        nav.style.cssText = 'display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:#fff;color:var(--navy-800);padding:18px 6%;gap:4px;box-shadow:var(--shadow-md);z-index:99';
        nav.style.marginLeft = '0';
        $$('a', nav).forEach((a) => { a.style.cssText = 'padding:11px 6px;border-bottom:1px solid var(--line);color:var(--navy-800)'; });
      }
      return;
    }
    // close mobile nav on link click
    if (hit('#mainNav a') && window.innerWidth < 900) {
      $('#mainNav').classList.remove('open');
      $('#mainNav').style.cssText = '';
    }

    // admin open/exit
    if (hit('[data-action="open-admin"]')) { openAdmin(); return; }
    if (hit('[data-action="exit-admin"]')) { exitAdmin(); return; }
    if (hit('[data-action="lock-admin"]')) { sessionStorage.removeItem('kukje_admin_ok'); toast('관리자 모드를 잠갔습니다.'); exitAdmin(); return; }
    if (hit('[data-action="demo-admin"]')) { sessionStorage.setItem('kukje_admin_ok', '1'); enterAdmin(); return; }

    // modal close
    if (hit('[data-action="close-modal"]')) { closeModal(); return; }
    if (t.id === 'genericModal') { closeModal(); return; }

    // lightbox
    const gal = hit('.gal-item');
    if (gal) { openLightbox(Number(gal.dataset.gallery)); return; }
    if (hit('[data-action="close-lightbox"]')) { closeLightbox(); return; }
    if (t.id === 'lightbox') { closeLightbox(); return; }
    if (hit('[data-action="lb-prev"]')) { openLightbox(lbIndex - 1); return; }
    if (hit('[data-action="lb-next"]')) { openLightbox(lbIndex + 1); return; }

    // notice expand
    const ni = hit('.notice-item');
    if (ni) {
      const body = $('.notice-body', ni);
      const openMore = body.style.display === 'none';
      body.style.display = openMore ? '' : 'none';
      return;
    }
    if (hit('[data-action="toggle-more-notices"]')) {
      const list = $('#noticeList');
      list.dataset.showAll = list.dataset.showAll === '1' ? '' : '1';
      renderNotices();
      return;
    }

    // backup / restore / sample
    if (hit('[data-action="admin-backup"]')) { backup(); return; }
    if (hit('[data-action="admin-restore"]')) { $('#restoreFile').click(); return; }
    if (hit('[data-action="admin-sample"]')) { resetSample(); return; }

    // admin nav
    const tabBtn = hit('[data-tab]');
    if (tabBtn) { adminTab = tabBtn.dataset.tab; renderAdmin(); return; }
    const jump = hit('[data-tab-jump]');
    if (jump) { adminTab = jump.dataset.tabJump; renderAdmin(); return; }

    /* ---- admin: students ---- */
    if (hit('[data-act="add-student"]')) { openModal('원생 추가', studentForm(null)); return; }
    const sEdit = hit('[data-student-edit]');
    if (sEdit) { openModal('원생 정보 수정', studentForm(DB.students.find((s) => s.id === sEdit.dataset.studentEdit))); return; }
    const sSave = hit('[data-student-save]');
    if (sSave) { saveStudent(sSave.dataset.studentSave || null); return; }
    const sDel = hit('[data-student-del]');
    if (sDel) { delStudent(sDel.dataset.studentDel); return; }
    const sDelOk = hit('[data-student-del-ok]');
    if (sDelOk) {
      const id = sDelOk.dataset.studentDelOk;
      DB.students = DB.students.filter((s) => s.id !== id);
      save(); closeModal(); renderAdmin();
      toast('삭제되었습니다.');
      return;
    }

    /* ---- admin: attendance ---- */
    const att = hit('[data-att]');
    if (att) { const [sid, st] = att.dataset.att.split('|'); setAtt(sid, st); return; }

    /* ---- admin: payments ---- */
    const pt = hit('[data-pay-toggle]');
    if (pt) {
      const p = DB.payments.find((x) => x.id === pt.dataset.payToggle);
      p.paid = !p.paid;
      p.method = p.paid ? (p.method || '카드') : p.method;
      p.paidAt = p.paid ? todayStr() : null;
      save(); renderAdmin();
      return;
    }
    const pm2 = hit('[data-pay-method]');
    if (pm2) {
      const [id, m] = pm2.dataset.payMethod.split('|');
      const p = DB.payments.find((x) => x.id === id);
      p.method = m;
      if (!p.paid) { p.paid = true; p.paidAt = todayStr(); }
      save(); renderAdmin();
      toast(`${m}로 기록했습니다 ✓`);
      return;
    }
    const pd = hit('[data-pay-del]');
    if (pd) {
      DB.payments = DB.payments.filter((x) => x.id !== pd.dataset.payDel);
      save(); renderAdmin();
      return;
    }
    if (hit('[data-act="gen-month"]')) {
      let added = 0;
      DB.students.forEach((s) => {
        const exists = DB.payments.some((p) => p.studentId === s.id && p.month === curMonth());
        if (!exists) { DB.payments.push({ id: nextId('P'), studentId: s.id, month: curMonth(), fee: Number(DB.settings.fee) || 150000, paid: false, method: null, paidAt: null }); added++; }
      });
      save(); renderAdmin();
      toast(added ? `${added}건의 회계 항목을 생성했습니다 ✓` : '이번 달 항목이 이미 있습니다.');
      return;
    }

    /* ---- admin: exams ---- */
    if (hit('[data-act="add-exam"]')) { openModal('심사 대상자 등록', examForm(null)); return; }
    const eEdit = hit('[data-exam-edit]');
    if (eEdit) { openModal('심사 정보 수정', examForm(DB.exams.find((x) => x.id === eEdit.dataset.examEdit))); return; }
    const eSave = hit('[data-exam-save]');
    if (eSave) { saveExam(eSave.dataset.examSave || null); return; }
    const eDel = hit('[data-exam-del]');
    if (eDel) {
      DB.exams = DB.exams.filter((x) => x.id !== eDel.dataset.examDel);
      save(); renderAdmin();
      return;
    }

    /* ---- admin: inquiries ---- */
    const qs = hit('[data-inq-status]');
    if (qs) {
      const [id, st] = qs.dataset.inqStatus.split('|');
      const q = DB.inquiries.find((x) => x.id === id);
      q.status = st;
      save(); renderAdmin();
      toast(`상태를 [${st}](으)로 바꿨습니다 ✓`);
      return;
    }
    const qn = hit('[data-inq-note-save]');
    if (qn) {
      const q = DB.inquiries.find((x) => x.id === qn.dataset.inqNoteSave);
      q.replyNote = $(`[data-inq-note="${qn.dataset.inqNoteSave}"]`).value;
      save();
      toast('상담 메모를 저장했습니다 ✓');
      return;
    }
    const qd = hit('[data-inq-del]');
    if (qd) {
      DB.inquiries = DB.inquiries.filter((x) => x.id !== qd.dataset.inqDel);
      save(); renderAdmin();
      return;
    }

    /* ---- admin: notices ---- */
    if (hit('[data-act="add-notice"]')) { openModal('공지 등록', noticeForm(null)); return; }
    const nEdit = hit('[data-notice-edit]');
    if (nEdit) { openModal('공지 수정', noticeForm(DB.notices.find((x) => x.id === nEdit.dataset.noticeEdit))); return; }
    const nSave = hit('[data-notice-save]');
    if (nSave) { saveNotice(nSave.dataset.noticeSave || null); return; }
    const nDel = hit('[data-notice-del]');
    if (nDel) {
      DB.notices = DB.notices.filter((x) => x.id !== nDel.dataset.noticeDel);
      save(); renderAdmin(); renderNotices();
      toast('공지를 삭제했습니다.');
      return;
    }

    /* ---- admin: schedule ---- */
    if (hit('[data-act="add-sched"]')) { openModal('시간표 추가', schedForm(null, null)); return; }
    const scEdit = hit('[data-sched-edit]');
    if (scEdit) { const i = Number(scEdit.dataset.schedEdit); openModal('시간표 수정', schedForm(DB.schedule[i], i)); return; }
    const scSave = hit('[data-sched-save]');
    if (scSave) { saveSched(scSave.dataset.schedSave); return; }
    const scDel = hit('[data-sched-del]');
    if (scDel) {
      DB.schedule.splice(Number(scDel.dataset.schedDel), 1);
      save(); renderAdmin();
      return;
    }

    /* ---- admin: settings actions ---- */
    if (hit('[data-act="save-settings"]')) {
      $$('[data-setting]').forEach((inp) => {
        const k = inp.dataset.setting;
        DB.settings[k] = k === 'fee' ? Number(inp.value) || 0 : inp.value.trim();
      });
      save(); renderPublicData();
      toast('설정이 저장되고 홈페이지에 반영되었습니다 ✓');
      return;
    }
    if (hit('[data-act="change-pin"]')) {
      const a = $('#pinNew').value, b = $('#pinNew2').value;
      if (!/^\d{4}$/.test(a)) { toast('PIN은 숫자 4자리입니다.'); return; }
      if (a !== b) { toast('새 PIN이 서로 다릅니다.'); return; }
      DB.pin = a; save();
      $('#pinNew').value = ''; $('#pinNew2').value = '';
      toast('관리자 PIN이 변경되었습니다 ✓');
      return;
    }
    if (hit('[data-act="reset-all-ok"]')) {
      DB = sampleData();
      save(); closeModal(); renderAdmin(); renderPublicData();
      toast('샘플 데이터로 초기화했습니다.');
      return;
    }
    if (hit('[data-act="reset-all"]')) { resetSample(); return; }
  });

  // live filters (input events)
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.filter === 'q') { searchQ = t.value; refreshListOnly('students'); }
    else if (t.dataset.filter === 'part' || t.dataset.filter === 'belt') { /* handled in change */ }
    else if (t.dataset.attDate !== undefined) { attDate = t.value || todayStr(); renderAdmin(); }
    else if (t.id === 'pinInput') {
      if (t.value.length === 4) { $('#pinForm').requestSubmit(); }
    }
    else if (t.dataset.fee) {
      const p = DB.payments.find((x) => x.id === t.dataset.fee);
      if (p) { p.fee = Number(t.value) || 0; saveDebounced(); }
    }
    else if (t.dataset.setting) { /* saved on button */ }
  });
  let saveDebounceT = null;
  function saveDebounced() {
    clearTimeout(saveDebounceT);
    saveDebounceT = setTimeout(save, 600);
  }
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.filter === 'part') { partFilter = t.value; renderAdmin(); }
    else if (t.dataset.filter === 'belt') { beltFilter = t.value; renderAdmin(); }
    else if (t.dataset.attToday !== undefined) { if (t.checked) { attDate = todayStr(); renderAdmin(); } }
    else if (t.dataset.payMonth !== undefined) { payMonth = t.value || curMonth(); renderAdmin(); }
    else if (t.dataset.payUnpaidOnly !== undefined) { payUnpaidOnly = t.checked; renderAdmin(); }
    else if (t.id === 'restoreFile' && t.files[0]) { restore(t.files[0]); t.value = ''; }
  });

  // PIN form
  $('#pinForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#pinInput').value;
    if (v === DB.pin) { sessionStorage.setItem('kukje_admin_ok', '1'); enterAdmin(); }
    else { $('#pinError').classList.remove('hidden'); $('#pinInput').value = ''; $('#pinInput').focus(); }
  });

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#lightbox').classList.contains('hidden')) closeLightbox();
      closeModal();
    }
    if (!$('#lightbox').classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') openLightbox(lbIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(lbIndex + 1);
    }
  });
}
function refreshListOnly(tab) { renderAdmin(); }

/* ---------------- init ---------------- */
function init() {
  load();
  renderPublicData();
  bindOnce();
  $('#year').textContent = new Date().getFullYear();
  console.log('%c국제태권도장 홈페이지·운영시스템 ready', 'color:#c8a24a;font-weight:bold');
}
init();
