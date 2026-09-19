/* Cloudflare Worker: Gemini creates concise course content; the Worker builds
 * the remaining mock timetable fields deterministically for a fast response. */
const DEFAULT_ORIGIN = 'https://chunyang0808.github.io';
const reply = (data, status, headers) => new Response(JSON.stringify(data), { status, headers });
const text = value => typeof value === 'string' ? value.slice(0, 100) : '';

function headers(origin, env) {
  const allowed = String(env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).split(',').map(v => v.trim()).filter(Boolean);
  return { 'Access-Control-Allow-Origin': origin && allowed.includes(origin) ? origin : DEFAULT_ORIGIN, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json; charset=UTF-8', Vary: 'Origin' };
}

function cleanContext(value) {
  if (!value || typeof value !== 'object') return null;
  const cleanList = (items, limit) => Array.isArray(items) ? items.map(text).filter(Boolean).slice(0, limit) : [];
  return { department: text(value.department) || '資訊工程學系', grade: text(value.grade) || '二年級', level: text(value.level) || 'bachelor', departments: cleanList(value.departments, 30), csFaculty: cleanList(value.csFaculty, 30), classrooms: cleanList(value.classrooms, 120) };
}

const SEED_INSTRUCTION = `你是完全虛構的繁體中文大學課程命名引擎。只輸出 JSON，不要 Markdown。
根物件只能含 courses、announcements。courses 恰好 54 筆，每筆只能含 name、englishName、requiredType。
前 30 筆為登入系所的專業課，requiredType 為 必修 或 選修，必須適合該系所，不可一律寫資訊工程課程；後 24 筆為跨領域通識課，requiredType 必為 通識。
54 門中文課名都要不同且自然，不可用序號或「（2）」機械複製。碩士與博士班課程須偏重進階研究與專題，不能只是大學部基礎課改標籤。英文名稱要與中文課名對應，且只能使用英文，不要摻雜中文字。不得把資訊工程教師安排到其他系所。announcements 為 3 個一般展示通知字串，不可包含日期、網址、電話、校規或行動指示。`;

function normalizeSeeds(seed) {
  const list = Array.isArray(seed?.courses) ? seed.courses : [];
  if (list.length !== 54 || list.some((course, index) => !text(course?.name) || !text(course?.englishName) || (index < 30 ? !['必修', '選修'].includes(course?.requiredType) : course?.requiredType !== '通識'))) throw new Error('Incomplete AI course list');
  const names = list.map((course) => text(course.name));
  if (new Set(names).size < 45) throw new Error('Repeated AI course names');
  return { courses: list.map((course) => ({ name: text(course.name), englishName: text(course.englishName), requiredType: course.requiredType })), announcements: Array.isArray(seed?.announcements) && seed.announcements.length ? seed.announcements.map(text).filter(Boolean).slice(0, 3) : ['本頁資料為展示用模擬內容。'] };
}

function buildRecord(seed, context) {
  const data = normalizeSeeds(seed);
  const surnames = ['林', '陳', '王', '李', '張', '黃', '吳', '蔡', '許', '鄭', '劉', '謝'];
  const givenNames = ['子晴', '承恩', '雅婷', '昱安', '思穎', '柏宇', '若涵', '俊佑', '宜蓁', '家豪', '宥真', '書帆'];
  const offset = Math.max(0, context.departments.indexOf(context.department));
  const teachers = context.department === '資訊工程學系' && context.csFaculty.length ? context.csFaculty : givenNames.map((given, index) => `${surnames[(index + offset) % surnames.length]}${given}`);
  const generalTeachers = ['林知遠', '陳映彤', '王書庭', '李嘉恩', '張語晴', '黃柏鈞', '許欣然', '鄭思齊'];
  const rooms = context.classrooms.length ? context.classrooms : ['E318｜智慧計算實驗室', 'I101｜圖資電腦教室', 'E202｜理工大樓教室'];
  const times = ['一', '二', '三', '四', '五'].flatMap(day => [1, 3, 5, 7, 9, 11].map(slot => `(${day})${slot}-${slot + 1}`));
  const selectedSlots = [0, 7, 14, 21, 28, 11, 18];
  const selectedIndexes = new Set([0, 1, 2, 3, 4, 5, 6]);
  const courses = data.courses.map((seedCourse, i) => {
    const selected = selectedIndexes.has(i); const capacity = i % 9 === 0 ? 45 : 50; const enrolled = i % 7 === 0 ? capacity : 12 + (i * 3 % (capacity - 12));
    return { code: `${i < 30 ? `D${String(offset + 1).padStart(2, '0')}` : 'GE'}${String(i + 1).padStart(3, '0')}`, name: seedCourse.name, englishName: seedCourse.englishName, className: i < 30 ? `${context.department}${context.grade}` : '日大學通識', group: String((i % 2) + 1).padStart(2, '0'), credits: i < 30 ? '3.0' : '2.0', requiredType: seedCourse.requiredType, teacher: i < 30 ? teachers[i % teachers.length] : generalTeachers[i % generalTeachers.length], classroom: rooms[i % rooms.length], time: selected ? times[selectedSlots[i]] : times[(i * 7 + 3) % times.length], hours: i < 30 ? '3.0' : '2.0', semesterType: '學期', capacity: String(capacity), minimum: '10', enrolled: String(enrolled), remarks: enrolled === capacity ? '額滿' : '', selected };
  });
  courses.slice(0, 30).forEach(course => { const match = /^\(([一二三四五])\)(\d+)-(\d+)$/.exec(course.time); if (match) { const start = Math.min(Number(match[2]), 10); course.time = `(${match[1]})${start}-${start + 2}`; } });
  return { student: { displayName: '展示學生', studentId: 'DEMO', department: context.department, programLabel: context.department, academicYear: '115', semester: '第1學期' }, courses, grades: courses.slice(0, 24).map((course, i) => ({ courseCode: course.code, score: i % 8 === 0 ? '尚未公告' : String(72 + (i * 3 % 26)) })), announcements: data.announcements, safeEmptyPages: ['請假明細', '獎懲紀錄', '兵役申辦', '離校審核'] };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''; const allowed = String(env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).split(',').map(v => v.trim()).filter(Boolean); const cors = headers(origin, env);
    if (origin && !allowed.includes(origin)) return reply({ error: 'Origin not allowed' }, 403, cors);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, cors);
    if (!env.GEMINI_API_KEY) return reply({ error: 'AI service is not configured' }, 503, cors);
    let input; try { input = await request.json(); } catch { return reply({ error: 'Invalid JSON' }, 400, cors); }
    const context = cleanContext(input.context);
    if (input.model !== 'gemini-2.5-flash' || !context || !input.schema || typeof input.schema !== 'object') return reply({ error: 'Invalid request' }, 400, cors);
    try {
      const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify({ system_instruction: { parts: [{ text: SEED_INSTRUCTION }] }, contents: [{ role: 'user', parts: [{ text: JSON.stringify(context) }] }], generationConfig: { temperature: 0.85, maxOutputTokens: 8192, responseMimeType: 'application/json' } }) });
      if (!upstream.ok) { const detail = await upstream.text(); console.error('Gemini seed failed', { status: upstream.status, detail: detail.slice(0, 400) }); return reply({ error: 'AI generation failed', upstreamStatus: upstream.status }, 502, cors); }
      const payload = await upstream.json(); const output = payload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
      return reply(buildRecord(JSON.parse(output), context), 200, cors);
    } catch { return reply({ error: 'AI returned invalid data' }, 502, cors); }
  }
};
