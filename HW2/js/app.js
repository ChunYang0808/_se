const departments = ['國際暨大陸事務學系', '建築學系', '海洋與邊境管理學系', '應用英語學系', '華語文學系', '都市計畫與景觀學系', '企業管理學系', '工業工程與管理學系', '觀光管理學系', '運動與休閒學系', '電機工程學系', '資訊工程學系', '土木與工程管理學系', '食品科學系', '護理學系', '長期照護學系', '社會工作學系'];
const shortDepartments = { '資訊工程學系': '資工', '電機工程學系': '電機', '企業管理學系': '企管', '觀光管理學系': '觀光', '運動與休閒學系': '運休', '土木與工程管理學系': '土木', '國際暨大陸事務學系': '國際', '應用英語學系': '應英', '華語文學系': '華文', '食品科學系': '食科', '長期照護學系': '長照', '社會工作學系': '社工', '海洋與邊境管理學系': '海邊', '工業工程與管理學系': '工管', '都市計畫與景觀學系': '都景', '建築學系': '建築', '護理學系': '護理' };
const csFaculty = ['吳佳駿', '周祥敏', '李錫捷', '柯志亨', '潘進儒', '王建鈞', '趙于翔', '陳正德', '陳鍾誠', '馮玄明'];
const facultyGivenNames = ['以安', '子寧', '昱翔', '佳蓉', '柏翰', '思妤', '承叡', '宜庭', '品妍', '冠宇', '郁涵', '詠晴', '佑辰', '庭瑜', '宗翰', '婉如', '嘉哲', '家寧', '芷涵', '彥霖', '曉雯', '弘毅', '俐君', '奕辰', '心怡', '瑋庭', '維安', '淑芬', '哲宇', '明軒', '宛蓉', '韋廷', '映彤', '庭安', '柏勳', '思齊', '若彤', '冠廷', '于珊', '立衡', '靜宜', '書瑋', '宥蓁', '旭東', '姿穎', '浩然', '佩珊', '俊豪', '秉諺', '柔安', '明慧', '詠恩', '俞潔', '建宏', '庭萱', '柏鈞', '博文', '淑儀', '孟庭', '偉誠', '子謙', '明哲', '欣怡', '宸宇', '佳玲', '少華', '依晴', '宥均', '永傑', '玟蓉', '志豪', '詩涵', '佳穎', '冠霖', '育珊', '聿廷', '欣瑜', '巧琳', '浩宇', '孟軒', '之晴', '景翔', '欣妤', '雅慧', '紘宇', '穎珊', '育銘', '昱廷', '淑惠', '若寧'];
const facultySurnames = ['林', '陳', '張', '李', '王', '黃', '吳', '蔡', '劉', '許', '鄭', '謝', '楊', '洪', '郭', '蘇', '曾', '沈', '朱', '葉', '何', '羅', '呂', '邱', '周', '徐', '高', '彭', '江', '廖', '賴', '鍾'];
const generalFaculty = ['林知遠', '陳映彤', '王書庭', '李嘉恩', '張語晴', '黃柏鈞', '許欣然', '鄭思齊', '劉品妤', '謝宗翰'];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeCourseText = (value) => String(value ?? '').replace(/[<>]/g, '').slice(0, 120);
const sportFaculty = ['周昱廷', '林怡萱', '陳彥勳', '張育誠', '黃欣怡', '許柏宇', '劉冠廷', '蔡宜庭'];
const chineseFaculty = ['林書妤', '陳婉晴', '王冠文', '李宜臻', '張思涵', '黃家緯', '許庭瑜', '劉詠心', '蔡孟潔', '鄭雅琳'];
const englishFaculty = ['林艾琳', '陳凱文', '王伊婷', '李安琪', '張潔西', '黃美玲', '許莉莎', '劉雅倫', '蔡凱特', '鄭偉倫'];
const facultyNamesByDepartment = new Map();
const usedFacultyNames = new Set([...csFaculty, ...generalFaculty, ...sportFaculty, ...chineseFaculty, ...englishFaculty]);
const departmentRooms = {
  '資訊工程學系': ['I101', 'I102', 'I103', 'E318', 'E319', 'E320', 'E321'],
  '電機工程學系': ['E220', 'E221', 'E222', 'E223'],
  '土木與工程管理學系': ['E119', 'E120', 'E121', 'E122'],
  '食品科學系': ['E413', 'E414', 'E415', 'E416'],
  '護理學系': ['B10', 'B11', 'D106', 'D203', 'D204'],
  '長期照護學系': ['B15', 'D201', 'D202', 'D301'],
  '社會工作學系': ['B12', 'B16', 'D102', 'D103'],
  '建築學系': ['513', '514', '515', '535'],
  '企業管理學系': ['324', '329', '330', '307'],
  '觀光管理學系': ['228', '230', '231', '232'],
  '運動與休閒學系': ['129', '132', '133', 'A104'],
  '國際暨大陸事務學系': ['106', '107', '110', '111'],
  '海洋與邊境管理學系': ['206', '208', '209'],
  '華語文學系': ['404', '406', '407', '409'],
  '應用英語學系': ['427', '429', '430', '450'],
  '都市計畫與景觀學系': ['513', '514', '535'],
  '工業工程與管理學系': ['306', '307', '308']
};
const generalRooms = ['207', '209', '409', '106', '128', 'D202', 'E102', 'E203', '429', 'B317', '701', '702'];
const classrooms = `I101｜I101圖資電腦教室
I102｜I102圖資電腦教室
103｜楊肅斌演講廳
106｜106國際系普通教室
107｜107國際多功能研討室
108｜108兩岸關係研究中心
109｜109國際系圖書室
110｜110國際事務專業教室
111｜111大陸事務專業教室
116｜116會議室
123｜123黃木榮講堂
125｜125進修推廣部教室
127｜127何錦治講堂
128｜128電腦專業教室
129｜129運休系普通教室
130｜130樂齡服務中心
131｜131系圖書館
132｜132運休系普通教室
133｜133運休系普通教室
206｜206海邊系普通教室
207｜207博雅專業教室
208｜208邊境系普通教室
209｜209創意多功能教室
214｜214教師研究室
215｜215專題研討室
219｜219教師研究室
220｜220教師研究室
221｜221林國欽講堂
222-1｜222-1民意調查中心
222-2｜222-2專業教室
223｜223人文社會學院
224｜224多媒體教室
226｜226呂冰霖講堂
227｜227配銷系統教育中心
228｜228旅遊導覽解說教室
229｜229研究生研究室
230｜230餐旅服務室
231｜231觀光系普通教室
232｜232觀光系普通教室
239｜239調酒教室
239-1｜239-1觀光系中庭
240｜240管碩專班教室
306｜306工管系實驗教室
307｜307工管系普通教室
308｜308工管系普通教室
309｜309普通教室
314-1｜314-1專業教室
321｜321方文言講堂
322｜322學術副校長室
323｜323教學中心
324｜324企管系專業教室
329｜329企管系會議研討室
330｜330企業經營模擬教室
346｜教務長室
404｜404華文系討論室
406｜406華文系普通教室
407｜407討論室（華語文學系）
407-1｜407-1華語文中心
408｜408華文系電腦教室
409｜409華文系普通教室
414｜414閩南所研討室
421｜421方水金講堂
422｜422閩南所辦公研討室
423-1｜423-1閩南所研討室
424｜424普通教室
425｜425普通教室
426｜426陳篤漢講堂
427｜427口譯教室
428-2｜428-2教室
429｜429語言測驗教室
430｜430普通教室
436｜436多媒體教材製作室
450｜450網路教室
505｜505教師研究室
507｜507教師研究室
509｜509教師研究室
513｜513設計教室I
514｜514設計繪圖教室
515｜515專業教室
516｜516會議室
528｜528蔡金環講堂
530｜5樓中庭
533｜533方基錠講堂
534-1｜534-1建築系研討室
535｜535設計教室A
536｜536系學會暨研討室
536-2｜536-2系圖書室
5371｜5371普通教室
543｜543研究室
544｜544研究室
550｜550建築節能中心
560｜建築學系中庭
601｜陳開蓉會議廳
605｜605藝文中心（圖資5樓）
701｜操場
702｜網球場
99｜99校外實習
A104｜A104有氧教室（多功能）
B03｜B03設計教室II
B04｜B04設計教室B
B05｜B05設計教室C
B06｜B06設計教室D
B08｜B08
B09｜B09基礎醫學實驗室
B10｜B10護理系示範病房I
B11｜B11護理系示範病房II
B12｜B12社工系專業教室
B14｜B14餐飲教室
B15｜B15長照系專業教室
B16｜B16社工系普通專業教室
B316｜B316學務處活動中心
B317｜B317軍訓室門口
C101｜C101階梯教室（金沙）
C212｜C312教室（金沙校區）
C213｜C213會議室（金沙校區）
C215｜C215教室（金沙校區）
C216｜C216教室（金沙校區）
C217｜C217教室（金沙校區）
C218｜C218教室（金沙校區）
C219｜C219教室（金沙校區）
C220｜金沙校區
D102｜D102社工系普通教室
D103｜D103社工系普通教室
D105｜D105社工系普通教室
D106｜D106護理系普通教室
D201｜D201長照系普通教室
D202｜D202長照系普通教室
D203｜D203護理系普通教室
D204｜D204護理系普通教室
D301｜D301長照系普通教室
D302｜D302長照系普通教室
D304｜D304健護學院演講廳
D314｜D301-1長照系研討室
E101｜E101呂慶安演講廳
E102｜E102教室（理工大樓）
E103｜E103教室（理工大樓）
E104｜E104教室（理工大樓）
E105｜E105教室（理工大樓）
E106｜E106大成營建科技研
E112｜E112會議室
E119｜E119結構力學實驗室
E120｜E120材料實驗室
E121｜E121土壤力學實驗室
E122｜E122空間資訊教室
E123｜E123測量器材室
E201｜E201王振坤講堂
E202｜E202教室（理工大樓）
E203｜E203教室（理工大樓）
E204｜E204教室（理工大樓）
E205｜E205教室（理工大樓）
E220｜E220電子電路實驗室
E221｜E221崁入式系統與機器
E222｜E222基礎通訊實驗室
E223｜E223軟體與模擬實驗室
E304｜E304普通物理實驗室
E305｜E305化學實驗室
E306｜E306研究生教室
E318｜智慧計算實驗室
E319｜E319數位系統應用實驗
E320｜E320多媒體實驗室
E321｜E321電腦網路實驗室
E323｜E323理工會議室
E401｜E401精密實驗室
E402｜E402教室（理工大樓）
E403｜E403教室（理工大樓）
E404｜E404教室（理工大樓）
E405｜E405教室（理工大樓）
E406｜E406教室（理工大樓）
E407｜E407教室（理工大樓）
E408｜E408教室（理工大樓）
E409｜E409實驗室
E413｜E413儀器分析實驗室
E414｜E414化學實驗室
E415｜E415微生物實驗室
E416｜E416食品工程實驗室
E500｜E500會議室（理工大樓）
I103｜I103-1圖資電腦教室
KM28｜KM28外二甲
T1｜T1食品創業工作坊（中山）
km01｜km01食一甲`.split('\n');
const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const departmentSelect = document.getElementById('login-department');
const levelSelect = document.getElementById('login-level');
const gradeSelect = document.getElementById('login-grade');

departmentSelect.innerHTML = departments.map((department) => `<option>${department}</option>`).join('');
departmentSelect.value = '資訊工程學系';

function populateGrades() {
  const level = levelSelect.value;
  const labels = level === 'bachelor' ? ['一年級', '二年級', '三年級', '四年級', '五年級'] : level === 'master' ? ['碩士一年級', '碩士二年級', '碩士三年級', '碩士四年級'] : ['博士一年級', '博士二年級', '博士三年級', '博士四年級', '博士五年級', '博士六年級'];
  gradeSelect.innerHTML = labels.map((label, index) => `<option value="${index + 1}" ${level === 'bachelor' && index === 1 ? 'selected' : ''}>${label}</option>`).join('');
}

populateGrades();
levelSelect.addEventListener('change', populateGrades);

const warningAgree = document.getElementById('warning-agree');
const warningEnter = document.getElementById('warning-enter');
const profileOverlay = document.getElementById('profile-overlay');
const profileForm = document.getElementById('profile-form');
let profileReady = false;
warningAgree.addEventListener('change', () => { warningEnter.disabled = !warningAgree.checked; });
warningEnter.addEventListener('click', () => {
  if (!warningAgree.checked) return;
  document.getElementById('academic-warning').hidden = true;
  profileOverlay.hidden = false;
  document.getElementById('login-name').focus();
});
profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  profileReady = true;
  profileOverlay.hidden = true;
  document.getElementById('login-id').focus();
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!profileReady) { profileOverlay.hidden = false; return; }
  document.getElementById('login-password').value = '';
  document.getElementById('login-code').value = '';
  const studentId = document.getElementById('login-id').value.trim() || 'AI115410001';
  const studentName = document.getElementById('login-name').value.trim() || 'AI 模擬學生';
  const department = departmentSelect.value;
  const gradeText = gradeSelect.options[gradeSelect.selectedIndex].text;
  const program = `${shortDepartments[department] || department}${gradeText.replace('一年級', '一').replace('二年級', '二').replace('三年級', '三').replace('四年級', '四').replace('五年級', '五').replace('六年級', '六')}`;
  document.getElementById('student-program').textContent = program;
  document.getElementById('student-id').textContent = studentId;
  document.getElementById('student-name').textContent = studentName;
  loginScreen.hidden = true;
  appShell.hidden = false;
  const generationContext = { studentId, studentName, department, grade: gradeText, level: levelSelect.value, departments, csFaculty, classrooms };
  loginContext = generationContext;
  selectionTouched = false;
  recordDisplayTouched = false;
  creditLimit = 25;
  reducedCreditsApproved = false;
  clubApplication = '';
  clubOptions = [...demoClubPool].sort(() => Math.random() - 0.5).slice(0, 15);
  departmentCatalogCache.clear();
  facultyNamesByDepartment.clear();
  usedFacultyNames.clear();
  [...csFaculty, ...generalFaculty, ...sportFaculty, ...chineseFaculty, ...englishFaculty].forEach((name) => usedFacultyNames.add(name));
  historicalRecordCache.clear();
  generatedRecord = normalizeRecord(window.NQU_LOCAL.generateStudentRecord(generationContext), department, gradeText);
  initializeSelections();
  reconcileTimetables();
  const overlay = document.getElementById('generation-overlay');
  overlay.hidden = false;
  overlay.style.display = 'grid';
  // 本機資料已可立即使用；AI 請求只在背景替換資料，絕不能卡住登入畫面。
  // 此保護計時器在發起任何請求前建立，即使供應商逾時或程式同步失敗也會關閉遮罩。
  const hideOverlay = () => { overlay.hidden = true; overlay.style.display = 'none'; };
  const overlayFailSafe = window.setTimeout(hideOverlay, 15000);
  Promise.resolve()
    .then(() => window.NQU_AI.generateStudentRecord(generationContext))
    .then((record) => {
      if (!selectionTouched && !recordDisplayTouched && isUsableAiRecord(record, generationContext)) {
        generatedRecord = normalizeRecord(record, department, gradeText);
        initializeSelections();
        reconcileTimetables();
      }
    })
    .catch((error) => {
      console.warn('AI 模擬資料未載入，改用展示資料。', error);
    })
    .finally(() => {
      window.clearTimeout(overlayFailSafe);
      hideOverlay();
    });
});

loginForm.addEventListener('reset', () => { document.getElementById('login-code').value = ''; });

document.querySelectorAll('.tree-menu h2').forEach((heading) => {
  heading.addEventListener('click', () => heading.parentElement.classList.toggle('is-collapsed'));
});

document.querySelectorAll('.branch-button').forEach((button) => {
  button.addEventListener('click', () => {
    const branch = button.parentElement;
    branch.classList.toggle('is-collapsed');
    button.textContent = `${branch.classList.contains('is-collapsed') ? '▸' : '▾'} ${button.textContent.slice(2)}`;
  });
});

const contentPanel = document.getElementById('content-panel');
const homepage = contentPanel.innerHTML;
const sampleCourses = [
  ['0872', '生活科技概論', 'Introduction to Science and Technology Life', '日大學通識', '01', '2.0', '必修', '吳佳駿', 'I102圖資電腦教室', '(一)3-4'],
  ['0149', '資料庫系統管理', 'Database System and Management', '資工二', '01', '3.0', '必修', '馮玄明', 'I101圖資電腦教室', '(一)5-7'],
  ['0150', 'TCP/IP協定', 'TCP/IP Protocol Suite', '資工二', '01', '3.0', '選修', '柯志亨', 'E321電腦網路實驗室', '(三)2-4'],
  ['0152', '現代程式語言', 'Modern Programming Language', '資工二', '01', '3.0', '選修', '李錫捷', 'E320多媒體實驗室', '(二)5-7'],
  ['0153', '現代軟體工程', 'Modern Software Engineering', '資工二', '01', '3.0', '選修', '潘進儒', 'E320多媒體實驗室', '(五)2-4'],
  ['0148', '計算機結構', 'Computer Architecture', '資工二', '01', '3.0', '必修', '陳鍾誠', 'E320多媒體實驗室', '(四)2-4']
];

let generatedRecord = null;
let selectedCourseCodes = new Set();
let loginContext = null;
let selectionTouched = false;
let recordDisplayTouched = false;
let creditLimit = 25;
let reducedCreditsApproved = false;
let clubOptions = [];
let clubApplication = '';
const demoClubPool = ['攝影社', '吉他社', '熱音社', '桌遊社', '羽球社', '籃球社', '排球社', '街舞社', '手作社', '天文社', '動漫研究社', '志工服務社', '電影欣賞社', '登山社', '烘焙社', '茶藝社', '書法社', '戲劇社', '魔術社', '環保社', '資訊研究社', '海洋探索社', '國際交流社', '瑜珈社'];
const departmentCatalogCache = new Map();
const roomDirectory = new Map(classrooms.map((entry) => {
  const [code, label] = entry.split('｜');
  return [code, label];
}));

function facultyFor(department) {
  if (department === '資訊工程學系') return csFaculty;
  if (facultyNamesByDepartment.has(department)) return facultyNamesByDepartment.get(department);
  const names = [];
  const chosenSurnames = new Set();
  const chosenGivenNames = new Set();
  while (names.length < 12) {
    const surname = facultySurnames[Math.floor(Math.random() * facultySurnames.length)];
    const given = facultyGivenNames[Math.floor(Math.random() * facultyGivenNames.length)];
    const name = `${surname}${given}`;
    if (usedFacultyNames.has(name) || chosenSurnames.has(surname) || chosenGivenNames.has(given)) continue;
    names.push(name);
    chosenSurnames.add(surname);
    chosenGivenNames.add(given);
    usedFacultyNames.add(name);
  }
  facultyNamesByDepartment.set(department, names);
  return names;
}

function roomFor(department, index) {
  const codes = department === '通識教育中心' ? generalRooms : departmentRooms[department] || ['E202', 'E203', 'E204'];
  const code = codes[index % codes.length];
  return roomDirectory.get(code) || `${code}普通教室`;
}

function gradeLabel(number) {
  return `${['一', '二', '三', '四', '五', '六'][Math.max(0, Math.min(5, Number(number) - 1))]}年級`;
}

function catalogGrade(program, number) {
  const year = gradeLabel(number);
  if (program?.includes('博士')) return `博士${year}`;
  if (program?.includes('碩士')) return `碩士${year}`;
  return year;
}

function normalizeRecord(record, department, grade, catalog = false, term = '115學年度第1學期') {
  const departmentIndex = Math.max(0, departments.indexOf(department));
  const courses = (record.courses || []).map((course, index) => {
    const general = index >= 30 || course.requiredType === '通識';
    const unit = general ? '通識教育中心' : department;
    const teacherList = general ? generalFaculty : facultyFor(department);
    const room = general ? roomFor('通識教育中心', index) : roomFor(department, index);
    const gradeNumber = ['一', '二', '三', '四', '五', '六'].findIndex((character) => grade.includes(character)) + 1 || 2;
    const termCode = term === '115學年度第1學期' ? '' : `H${term.replace(/\D/g, '')}-`;
    const code = catalog ? `${termCode}D${String(departmentIndex + 1).padStart(2, '0')}G${gradeNumber}-${String(index + 1).padStart(3, '0')}` : course.code;
    return {
      ...course, code, offeringDepartment: unit,
      name: safeCourseText(course.name), englishName: safeCourseText(course.englishName),
      className: general ? '日大學通識' : `${shortDepartments[department] || department}${grade.replace('年級', '').replace('碩士', '碩').replace('博士', '博')}`,
      credits: general ? '2.0' : '3.0',
      hours: general ? '2.0' : '3.0',
      catalogTerm: term,
      requiredType: general ? '通識' : course.requiredType === '必修' ? '必修' : '選修',
      teacher: !general && department === '資訊工程學系' && csFaculty.includes(course.teacher) ? course.teacher : teacherList[index % teacherList.length],
      classroom: room,
      selected: !catalog && Boolean(course.selected),
      remarks: Number(course.enrolled) >= Number(course.capacity) ? '額滿' : ''
    };
  });
  return { ...record, courses };
}

function departmentCatalog(department, grade = loginContext?.grade || '二年級', term = '115學年度第1學期') {
  if (term === '115學年度第1學期' && department === loginContext?.department && grade === loginContext.grade) return generatedRecord?.courses || [];
  const cacheKey = `${term}|${department}|${grade}`;
  if (!departmentCatalogCache.has(cacheKey)) {
    const context = { ...loginContext, studentId: `CATALOG-${term}-${departments.indexOf(department)}-${grade}`, department, grade };
    departmentCatalogCache.set(cacheKey, normalizeRecord(window.NQU_LOCAL.generateStudentRecord(context), department, grade, true, term).courses.slice(0, 30));
    reconcileTimetables();
  }
  return departmentCatalogCache.get(cacheKey);
}

function supplementalCourses() {
  const names = [
    ...Array.from({ length: 16 }, (_, i) => ({ code: `PE${String(i + 1).padStart(3, '0')}`, name: ['體育（一）', '體育（二）', '運動與健康', '球類運動', '體適能訓練', '休閒運動'][i % 6], englishName: 'Physical Education', category: '體育課程', teacher: sportFaculty[i % sportFaculty.length], room: ['701', '702', 'A104', '702', 'A104', '701'][i % 6], credits: '0.0' })),
    ...['大學國文（一）', '大學國文（二）'].flatMap((name, level) => Array.from({ length: 10 }, (_, i) => ({ code: `CH${level + 1}${String(i + 1).padStart(2, '0')}`, name, englishName: `College Chinese ${level + 1}`, category: '大學國文', teacher: chineseFaculty[i], room: ['406', '407', '409', '424', '425'][i % 5], credits: '2.0' }))),
    ...['大學英文（一）', '大學英文（二）'].flatMap((name, level) => Array.from({ length: 10 }, (_, i) => ({ code: `EN${level + 1}${String(i + 1).padStart(2, '0')}`, name, englishName: `College English ${level + 1}`, category: '大學英文', teacher: englishFaculty[i], room: ['427', '429', '430', '450', '424'][i % 5], credits: '2.0' })))
  ];
  const days = ['一', '二', '三', '四', '五'];
  return names.map((item, index) => ({
    code: item.code, name: item.name, englishName: item.englishName,
    className: item.category === '體育課程' ? '日大學體育' : '日大學共同必修',
    offeringDepartment: item.category === '體育課程' ? '體育室' : item.category === '大學國文' ? '華語文學系' : '應用英語學系',
    group: String(index % 10 + 1).padStart(2, '0'), credits: item.credits, hours: '2.0',
    requiredType: '必修', semesterType: '學期', teacher: item.teacher,
    classroom: roomDirectory.get(item.room) || item.room,
    time: `(${days[index % 5]})${index % 2 ? '3-4' : '5-6'}`,
    capacity: item.category === '體育課程' ? '35' : '45', minimum: '10',
    enrolled: index % 9 === 0 ? item.category === '體育課程' ? '35' : '45' : String(20 + index % 15),
    remarks: index % 9 === 0 ? '額滿' : '', selected: false, category: item.category
  }));
}
const sharedCourses = supplementalCourses();

function reconcileTimetables() {
  const days = ['一', '二', '三', '四', '五'];
  const occupied = new Set();
  const selectedOccupied = new Set();
  const courses = [...sharedCourses, ...(generatedRecord?.courses || []), ...Array.from(departmentCatalogCache.values()).flat()];
  courses.forEach((course) => {
    const term = course.catalogTerm || '115學年度第1學期';
    const duration = Math.max(1, Math.min(12, Math.round(Number(course.hours) || 2)));
    const preferred = /^\(([一二三四五])\)(\d+)-(\d+)$/.exec(course.time || '');
    const preferredDay = preferred ? preferred[1] : days[0];
    const preferredStart = preferred ? Number(preferred[2]) : 1;
    const alternatives = [];
    for (let dayOffset = 0; dayOffset < days.length; dayOffset++) {
      const day = days[(days.indexOf(preferredDay) + dayOffset) % days.length];
      for (let startOffset = 0; startOffset <= 12 - duration; startOffset++) {
        const start = ((preferredStart - 1 + startOffset) % (13 - duration)) + 1;
        alternatives.push([day, start]);
      }
    }
    const available = ([day, start]) => Array.from({ length: duration }, (_, i) => start + i).every((period) => {
      const teacherKey = `${term}|teacher|${course.teacher}|${day}|${period}`;
      const roomKey = `${term}|room|${course.classroom}|${day}|${period}`;
      const studentKey = `${term}|student|${day}|${period}`;
      return !occupied.has(teacherKey) && !occupied.has(roomKey) && (!selectedCourseCodes.has(course.code) || !selectedOccupied.has(studentKey));
    });
    const [day, start] = alternatives.find(available) || [preferredDay, Math.min(preferredStart, 13 - duration)];
    course.time = `(${day})${start}-${start + duration - 1}`;
    for (let period = start; period < start + duration; period++) {
      occupied.add(`${term}|teacher|${course.teacher}|${day}|${period}`);
      occupied.add(`${term}|room|${course.classroom}|${day}|${period}`);
      if (selectedCourseCodes.has(course.code)) selectedOccupied.add(`${term}|student|${day}|${period}`);
    }
  });
}

function courseRow(course) {
  return [course.code, course.name, course.englishName, course.className, course.group, course.credits,
    course.hours || course.credits, course.requiredType, course.semesterType || '學期', course.teacher,
    course.classroom, course.time, course.capacity, course.minimum, course.enrolled, course.remarks || '', Boolean(course.selected), course.offeringDepartment || '通識教育中心'];
}

function activeCourses() {
  if (!generatedRecord?.courses?.length) return sampleCourses;
  return generatedRecord.courses.map(courseRow);
}

function selectedCourses() {
  return [...activeCourses(), ...Array.from(departmentCatalogCache.values()).flatMap((courses) => courses.map(courseRow)), ...sharedCourses.map(courseRow)]
    .filter((course) => selectedCourseCodes.has(course[0]));
}

function initializeSelections() {
  selectedCourseCodes = new Set(activeCourses().filter((course) => course[16]).map((course) => course[0]));
}

function selectedCredits() {
  return selectedCourses().reduce((total, course) => total + Number(course[5] || 0), 0);
}

function showActionDialog(title, message, tone = 'info') {
  let dialog = document.getElementById('action-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'action-dialog';
    dialog.setAttribute('aria-labelledby', 'action-dialog-title');
    dialog.innerHTML = '<div class="action-dialog__head"><h2 id="action-dialog-title"></h2></div><p class="action-dialog__message"></p><div class="action-dialog__actions"><button type="button" class="small-button" data-action-close>我知道了</button></div>';
    document.body.appendChild(dialog);
    dialog.querySelector('[data-action-close]').addEventListener('click', () => dialog.close());
  }
  if (dialog.open) dialog.close();
  dialog.className = `action-dialog is-${tone}`;
  dialog.querySelector('#action-dialog-title').textContent = title;
  dialog.querySelector('.action-dialog__message').textContent = message;
  dialog.showModal();
}

function findCourse(code) {
  return [...activeCourses(), ...Array.from(departmentCatalogCache.values()).flatMap((courses) => courses.map(courseRow)), ...sharedCourses.map(courseRow)]
    .find((course) => course[0] === code);
}

function isUsableAiRecord(record, context) {
  if (!record?.courses || record.courses.length < 54) return false;
  if (!Array.isArray(record.grades)) return false;
  const codes = record.courses.map((course) => String(course.code));
  if (new Set(codes).size !== codes.length || codes.some((code) => !code || code === 'undefined')) return false;
  const selected = record.courses.filter((course) => course.selected);
  if (context.department !== '資訊工程學系') {
    const computingTitles = record.courses.slice(0, 30).filter((course) => /資料結構|演算法|程式設計|資料庫|計算機結構|作業系統|軟體工程|電腦網路|雲端運算/.test(String(course.name)));
    if (computingTitles.length > 7) return false;
  }
  const selectedCreditTotal = selected.reduce((total, course) => total + Number(course.credits || 0), 0);
  if (selected.length < 7 || selected.length > 9 || selectedCreditTotal < 16 || selectedCreditTotal > 25) return false;
  if (selected.some((course, index) => selected.slice(index + 1).some((other) => coursesOverlap(courseRow(course), courseRow(other))))) return false;
  return record.courses.every((course) => {
    const capacity = Number(course.capacity);
    const enrolled = Number(course.enrolled);
    const capacityMatch = Number.isFinite(capacity) && Number.isFinite(enrolled) && capacity > 0 && enrolled >= 0 && enrolled <= capacity;
    const timeMatch = /^\(([一二三四五])\)(\d+)-(\d+)$/.test(String(course.time));
    const creditMatch = Number.isFinite(Number(course.credits)) && Number(course.credits) > 0;
    return capacityMatch && timeMatch && creditMatch && safeCourseText(course.name).length > 0;
  });
}

function courseTable(mode = 'result', rows = selectedCourses()) {
  const actionLabel = mode === 'withdraw' ? '退選' : mode === 'add' ? '加選' : '';
  const actionHeader = actionLabel ? `<th>${actionLabel}</th>` : '';
  const actions = (index, row) => actionLabel ? `<td><input type="checkbox" data-course-choice="${row[0]}" aria-label="${actionLabel}第 ${index + 1} 門課" ${actionLabel === '加選' && selectedCourseCodes.has(row[0]) ? 'checked disabled title="已選課"' : ''} ${actionLabel === '加選' && row[15] === '額滿' && !selectedCourseCodes.has(row[0]) ? 'disabled title="課程額滿"' : ''}></td>` : '';
  return `<div class="table-wrap"><table class="course-grid"><thead><tr>${actionHeader}<th>選課代號</th><th>科目</th><th>科目英文名</th><th>班級</th><th>分組</th><th>學分</th><th>小時</th><th>必選修</th><th>開課別</th><th>教師</th><th>教室</th><th>時間</th><th>上限人數</th><th>下限人數</th><th>實收人數</th><th>備註</th></tr></thead><tbody>${rows.map((row, index) => `<tr class="${row[15] === '額滿' ? 'is-full' : ''}">${actions(index, row)}${row.slice(0, 16).map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderAddCourseList(category = '一般課程', filters = {}) {
  const department = filters.department || loginContext.department;
  const grade = filters.grade ? catalogGrade(filters.program, filters.grade) : loginContext.grade;
  const selectionText = category === '一般課程' ? `${filters.program || '日間部學士班'}／${department}／${grade}` : filters.field || '';
  const selectedText = selectionText ? `<p class="selection-summary">目前查詢條件：${selectionText}</p>` : '';
  let rows;
  if (category === '通識課程') rows = activeCourses().filter((course) => course[7] === '通識');
  else if (category === '一般課程') rows = departmentCatalog(department, grade).map(courseRow).filter((course) => course[7] !== '通識');
  else rows = sharedCourses.filter((course) => course.category === category).map(courseRow);
  if (category === '通識課程' && filters.field && filters.field !== '全部') {
    const fields = ['人文藝術', '社會科學', '自然科學'];
    const fieldIndex = fields.indexOf(filters.field);
    rows = rows.filter((_, index) => index % fields.length === fieldIndex);
  }
  const empty = rows.length ? courseTable('add', rows) : '<p class="small-note">此條件目前沒有開設課程。</p>';
  return `<div class="course-page"><div class="breadcrumb">首頁　&gt;　選課作業　&gt;　線上加選作業　&gt;　${category}</div><h1 class="course-title">網路選課－${category}線上加選作業</h1>${selectedText}<div class="submit-row"><span>請選擇欲加選的科目；額滿課程無法勾選。</span><span><button class="small-button" data-add-back>回上一頁</button><button class="small-button" data-commit-add>確定送出</button></span></div><p class="selection-feedback" role="status" aria-live="polite"></p>${empty}<div class="submit-row"><span></span><span><button class="small-button" data-add-back>回上一頁</button><button class="small-button" data-commit-add>確定送出</button></span></div></div>`;
}

function renderResultList() {
  const credits = selectedCredits();
  return `<div class="course-page"><div class="breadcrumb">首頁　&gt;　選課作業　&gt;　選課結果查詢</div><h1 class="course-title">網路選課－選課結果查詢</h1><div class="student-line"><span>班級：${escapeHtml(document.getElementById('student-program').textContent)}　姓名：${escapeHtml(document.getElementById('student-name').textContent)}　學號：${escapeHtml(document.getElementById('student-id').textContent)}</span><span>現在時間：115/09/18</span></div><p class="total-line">總學分數（不含抵免科目及教育學程）：${credits.toFixed(1)}　　學分上限：${creditLimit.toFixed(1)}　　剩餘可選學分數：${Math.max(0, creditLimit - credits).toFixed(1)}</p><p><strong>選課結果：</strong></p>${courseTable()}</div>`;
}

function renderCoursePage(page) {
  const shell = (body) => `<div class="course-page"><div class="breadcrumb">首頁　&gt;　選課作業　&gt;　${page}</div>${body}</div>`;
  if (page === '線上加選作業') return shell(`
    <h1 class="course-title">網路選課－線上加選作業－</h1>
    <p class="course-note">請選擇要加選的課程類別：（欲查詢二技一、二年級之課程者，年級請選擇 3、4）</p>
    <table class="choice-table"><tbody>
      <tr><td>通識課程：</td><td><select aria-label="通識領域"><option>全部</option><option>人文藝術</option><option>社會科學</option><option>自然科學</option></select> <button class="small-button" data-view-add="通識課程">確定</button></td></tr>
      <tr><td>一般課程：</td><td><select aria-label="學制"><option ${loginContext.level === 'bachelor' ? 'selected' : ''}>日間部學士班</option><option ${loginContext.level === 'master' ? 'selected' : ''}>日間部研究所碩士班</option><option ${loginContext.level === 'doctoral' ? 'selected' : ''}>日間部博士班</option><option>推廣教育學分班</option></select> <select aria-label="系所">${departments.map((department) => `<option ${department === loginContext.department ? 'selected' : ''}>${department}</option>`).join('')}</select>　年級：<select aria-label="年級">${Array.from({ length: loginContext.level === 'doctoral' ? 6 : loginContext.level === 'master' ? 4 : 5 }, (_, index) => index + 1).map((number) => `<option ${loginContext.grade.includes(['一', '二', '三', '四', '五', '六'][number - 1]) ? 'selected' : ''}>${number}</option>`).join('')}</select> <button class="small-button" data-view-add="一般課程">確定</button></td></tr>
      <tr><td>體育課程：</td><td><button class="small-button" data-view-add="體育課程">確定</button></td></tr>
      <tr><td>大學國文：</td><td><button class="small-button" data-view-add="大學國文">確定</button></td></tr>
      <tr><td>大學英文：</td><td><button class="small-button" data-view-add="大學英文">確定</button></td></tr>
    </tbody></table>`);
  if (page === '線上退選作業') return shell(`
    <h1 class="course-title">網路選課－線上退選作業－</h1>
    <div class="submit-row"><span>你的選課結果如下，請選擇要退選的科目：</span><button class="small-button" data-commit-withdraw>確定送出</button></div>${courseTable('withdraw')}
    <div class="submit-row"><span></span><button class="small-button" data-commit-withdraw>確定送出</button></div>`);
  if (page === '選課結果查詢') return shell(`<h1 class="course-title">網路選課－選課結果查詢</h1><p>請確認選課資料；如有疑義，請持列印之「選課結果」洽詢承辦單位更正。</p><div class="submit-row"><span></span><button class="small-button" data-view-result>確定</button></div>`);
  if (page === '停修申請') return shell('<div class="closed-page"><strong>非開放時間</strong></div>');
  if (page === '通識選課初選作業') return shell('<div class="closed-page">非志願選課時程，不得加選</div>');
  if (page === '人工加選申請') return shell(renderRulePage('人工加選申請', `
    <h2>申請規則</h2>
    <h3>日間部人工加選申請規則</h3>
    <ol><li><strong>必修換班：</strong>因重修、衝堂等情形，需改修同一學期之其他班別必修課程者。</li><li><strong>跨部選課：</strong>符合延修、轉學生或應屆畢業等特定資格，且符合學分與課程限制者，得依規定申請。</li><li><strong>限修課程：</strong>符合開課單位所訂先修、年級或其他資格，並經授課教師同意者。</li></ol>
    <h3>辦理方式</h3><ol><li>先於系統確認可申請的課程及申請資格。</li><li>列印申請表並依序完成授課教師、系（所）主管等核章。</li><li>於公告截止日前送交課務承辦單位；逾期恕不受理。</li></ol>
    <p class="rule-warning">本展示版僅呈現規則；按下確認不會產生申請或變動任何選課資料。</p>`));
  if (page === '超修學分申請') return shell(renderRulePage('超修學分申請', `
    <h2>展示版申請條件</h2><p>目前已選：<strong>${selectedCredits().toFixed(1)} 學分</strong>；目前學分上限：${creditLimit} 學分。</p>
    <p>已選滿 25 學分即可申請超修；確認後本展示站的選課上限增加 5 學分，最高 30 學分。</p>
    <p class="small-note">此為模擬功能，並非正式校務核准；實際規定請依學校公告。</p>`));
  if (page === '酌減學分申請') return shell(renderRulePage('酌減學分申請', `
    <h2>展示版申請條件</h2><p>目前已選：<strong>${selectedCredits().toFixed(1)} 學分</strong>；目前學分上限：${creditLimit} 學分。</p>
    <p>已選學分須大於 2 學分且低於 16 學分，才能申請；確認後本展示站的學分上限設為 16 學分。</p>
    <p class="small-note">此為模擬功能，並非正式校務核准；實際規定請依學校公告。</p>`));
  if (page === '學分學程資訊') return shell(`<h1 class="course-title">學分學程資訊</h1><section class="program-page"><p>為促進跨領域學習與整合校內資源，本校設有多項學分學程及微學程，學生可依規定申請修習。</p><ul><li>修畢學程規定課程及學分者，得向開設單位申請相關修習證明。</li><li>實際開設課程、申請資格及修習規範，請以各學程當學期公告為準。</li></ul><h2>跨領域學程</h2>${programTable(['智慧高齡服務學程', '企業營運資訊管理學程', '島嶼永續發展學程', '軟體系統整合應用學程'])}<h2>微學程</h2>${programTable(['資訊工程微學程', '釀酒工藝微學程', '華語文教學微學程', '國際事務微學程', '觀光遊憩微學程', '長期照護微學程', '社會工作微學程', '應用英語微學程'])}<h2>跨校學分學程</h2>${programTable(['跨校通識數位學程', '離島創新與永續學程'])}</section>`);
  if (page === '學期成績查詢') return shell(queryForm(page, '請選擇年度及學期：', selectOptions(['115學年度第1學期', '114學年度第2學期', '114學年度第1學期']), 'grades'));
  if (page === '學生期中預警查詢') return shell(noDataPage(page, '目前無學生預警資料'));
  if (page === '歷年成績查詢') return shell(queryForm(page, '請選擇查詢學制：', selectOptions(['全部學期', '日間部學士班']), 'history'));
  if (page === '選課資料查詢') return shell(queryForm(page, '請選擇年度及學期：', selectOptions(['115學年度第1學期', '114學年度第2學期']), 'courses'));
  if (page === '抵免科目查詢') return shell(noDataPage(page, '目前無抵免科目資料'));
  if (page === '課程資料查詢') return shell(queryForm(page, '請選擇開課學年期、開課系所與年級：', `${selectOptions(['115學年度第1學期', '114學年度第2學期'])}${selectOptions([...departments, '全校課程'], 'data-query-department', loginContext.department)}${selectOptions(['全部年級', '一年級', '二年級', '三年級', '四年級', '五年級', '碩士一年級', '碩士二年級', '博士一年級', '博士二年級'], '', loginContext.level === 'bachelor' ? '全部年級' : loginContext.grade)}`, 'courseCatalog'));
  if (page === '課程規劃表') return shell(queryForm(page, '請選擇系所及入學學年度：', `${selectOptions(departments, '', loginContext.department)}${selectOptions(['115學年度入學', '114學年度入學', '113學年度入學'])}`, 'plan'));
  if (page === '我的課表') return shell(scheduleResult('我的課表'));
  if (page === '教師課表查詢') return shell(queryForm(page, '請選擇開課學年期、系所及教師：', `${selectOptions(['115學年度第1學期', '114學年度第2學期'])}${selectOptions(departments, 'data-teacher-department', loginContext.department)}${selectOptions(facultyFor(loginContext.department), 'data-teacher-name')}`, 'teacher'));
  if (page === '教室課表查詢') return shell(queryForm(page, '請選擇開課學年期及教室：', `${selectOptions(['115學年度第1學期', '114學年度第2學期'])}${selectOptions(classrooms)}`, 'classroom'));
  if (page === '班級課表查詢') return shell(queryForm(page, '請選擇開課學年期及班級：', `${selectOptions(['115學年度第1學期', '114學年度第2學期'])}${selectOptions(departments.flatMap((department) => ['一年級', '二年級', '三年級', '四年級', '碩士一年級', '碩士二年級', '博士一年級', '博士二年級'].map((grade) => `${department}${grade}`)), '', `${loginContext.department}${loginContext.grade}`)}`, 'classSchedule'));
  if (page === '畢業應修學分課程審核結果查詢') return shell(`<h1 class="course-title">${page}</h1><section class="query-result">${simpleGrid(['審核項目','應修學分','已修學分','審核狀態'], [['校共同必修','28','22','修習中'],['系專業必修','48','21','修習中'],['系選修','24','12','修習中'],['畢業總學分','128','55','尚未達標']])}<p class="small-note">此為 AI 模擬審核結果，正式畢業資格以學校審核為準。</p></section>`);
  if (page === '教學評量教師回覆查詢作業') return shell(noDataPage(page, '目前無教師回覆資料'));
  if (page === '學生預警科目查詢') return shell(noDataPage(page, '目前無預警科目資料'));
  if (page === '離校審核查詢') return shell(`<h1 class="course-title">離校審核查詢</h1><section class="query-result">${simpleGrid(['審核單位','審核狀態','備註'], [['圖書館','未申請','畢業離校時開放'],['課務組','未申請','畢業離校時開放'],['系辦公室','未申請','畢業離校時開放']])}</section>`);
  if (page === '微學程修習結果查詢') return shell(noDataPage(page, '目前無微學程修習資料'));
  if (page === '跨領域學程修習結果查詢') return shell(noDataPage(page, '目前無跨領域學程修習資料'));
  if (page === '輔系雙主修修習結果查詢') return shell(noDataPage(page, '目前無輔系／雙主修修習資料'));
  if (page === '學生個人缺曠請假明細表') return shell(queryForm(page, '請選擇年度及學期：', selectOptions(['115學年度第1學期', '114學年度第2學期', '114學年度第1學期']), 'attendance'));
  if (page === '學生個人獎懲狀況明細表') return shell(queryForm(page, '請選擇年度及學期：', selectOptions(['115學年度第1學期', '114學年度第2學期', '114學年度第1學期']), 'awards'));
  if (page === '學生弱勢助學金資格查詢') return shell(noDataPage(page, '目前無弱勢助學金資格資料'));
  if (page === '兵役申辦查詢') return shell(noDataPage(page, '目前無兵役申辦資料'));
  if (page === '師生郵件查詢') return shell(`<h1 class="course-title">師生郵件查詢</h1><section class="query-result">${simpleGrid(['類別','電子郵件','說明'], [['學生校務信箱','ai-student@example.edu.tw','展示用帳號'],[`${escapeHtml(loginContext.department)}系辦公室`,'department-office@example.edu.tw','展示用聯絡資訊']])}</section>`);
  if (page === '教學評量登錄作業') return shell(`<h1 class="course-title">教學評量登錄作業</h1><section class="query-result"><p>115學年度第1學期　教學評量課程清單</p>${simpleGrid(['科目名稱','授課教師','填寫狀態','操作'], selectedCourses().slice(0, 4).map((course, i) => [course[1], course[9], i === 0 ? '已完成' : '未開放', '<button class="small-button" data-demo-action>填寫</button>']))}<p class="small-note">展示版不會開啟或儲存問卷。</p></section>`);
  if (page === '問卷調查') return shell(noDataPage(page, '目前無可填寫問卷'));
  if (page === '學生基本資料表') return shell(profilePage());
  if (page === '社員登錄作業' || page === '社團登錄作業') return shell(clubRegistrationPage());
  if (page === '社團資料維護作業') return shell(clubPage('社團資料維護作業', '目前無可維護的社團資料'));
  if (page === '學期預計活動登錄作業') return shell(clubPage('學期預計活動登錄作業', '目前無學期預計活動資料'));
  if (page === '活動申請登錄作業') return shell(clubPage('活動申請登錄作業', '目前無活動申請資料'));
  if (page === '科目學分抵免申請') return shell(renderRulePage(page, `<h2>申請說明</h2><ol><li>請先確認欲抵免科目及原修課程資料。</li><li>備妥成績單、課程大綱等佐證文件，依系所公告期限提出申請。</li><li>實際抵免結果以系所與教務單位審核為準。</li></ol><p class="rule-warning">展示版的確認按鈕不會建立抵免申請。</p>`));
  if (page === '休退學申請作業') return shell(renderRulePage(page, `<h2>申請說明</h2><p>休學或退學應依學校規定完成申請及審核程序，並注意註冊、學雜費與住宿等相關權益。</p><p class="rule-warning">展示版只呈現流程，不會送出休學或退學申請。</p>`));
  if (page === '復學申請作業') return shell(renderRulePage(page, `<h2>申請說明</h2><p>欲復學者應於公告期間內提出申請，並依規定檢附資料與完成審核。</p><p class="rule-warning">展示版只呈現流程，不會送出復學申請。</p>`));
  if (page === '校內宿舍申請') return shell(renderRulePage(page, `<h2>住宿申請說明</h2><ol><li>依宿舍公告時間及資格提出申請。</li><li>申請後請留意抽籤、床位分配與繳費公告。</li></ol><p class="rule-warning">展示版不會送出住宿申請。</p>`));
  if (page === '學生請假作業') return shell(renderRulePage(page, `<h2>請假說明</h2><ol><li>請依假別與校規於規定期限內提出申請。</li><li>須檢附的證明文件，請依各假別規定辦理。</li></ol><p class="rule-warning">展示版不會建立請假紀錄。</p>`));
  if (page === '弱勢助學補助申請作業') return shell(renderRulePage(page, `<h2>補助申請說明</h2><p>申請資格、所需資料與期限以學務單位當學期公告為準。</p><p class="rule-warning">展示版不會送出補助申請。</p>`));
  if (page === '學雜費減免申請作業') return shell(renderRulePage(page, `<h2>減免申請說明</h2><p>請於申請期間備妥證明文件，依規定完成線上登錄與後續審核程序。</p><p class="rule-warning">展示版不會送出學雜費減免申請。</p>`));
  return null;
}

function renderRulePage(page, body) {
  return `<h1 class="course-title">${page}</h1><section class="rules-panel">${body}<div class="rule-action"><button class="small-button" data-rule-confirm data-rule-name="${page}">確定</button></div></section>`;
}

function programTable(programs) {
  return `<table class="program-table"><thead><tr><th>學程名稱</th><th>資訊</th></tr></thead><tbody>${programs.map((program) => `<tr><td>${program}</td><td><button class="small-button" data-program-info="${program}">點擊下載</button></td></tr>`).join('')}</tbody></table>`;
}

function selectOptions(options, attribute = '', selected = options[0]) {
  return `<select ${attribute}>${options.map((option) => `<option ${option === selected ? 'selected' : ''}>${option}</option>`).join('')}</select>`;
}

function queryForm(title, prompt, controls, key) {
  return `<h1 class="course-title">${title}</h1><section class="query-form"><p>${prompt}</p><div class="filter-row">${controls}<button class="small-button" data-show-query="${key}">確定送出</button></div></section>`;
}

function noDataPage(title, message = '目前無資料') {
  return `<h1 class="course-title">${title}</h1><section class="query-result empty-result"><strong>${message}</strong></section>`;
}

const historicalRecordCache = new Map();
function recordForTerm(term) {
  if (term === '115學年度第1學期') return generatedRecord;
  if (!historicalRecordCache.has(term)) {
    const context = { ...loginContext, studentId: `${loginContext.studentId}-${term}`, grade: loginContext.grade };
    historicalRecordCache.set(term, normalizeRecord(window.NQU_LOCAL.generateStudentRecord(context), context.department, context.grade));
  }
  return historicalRecordCache.get(term);
}

function queryResult(key, filters = []) {
  const title = {
    grades: '學期成績查詢', history: '歷年成績查詢', courses: '選課資料查詢', courseCatalog: '課程資料查詢',
    plan: '課程規劃表', teacher: '教師課表查詢', classroom: '教室課表查詢', classSchedule: '班級課表查詢'
  }[key] || '查詢結果';
  if (key === 'grades') {
    const term = filters[0] || '115學年度第1學期';
    const record = recordForTerm(term);
    const scores = new Map(record.grades.map((grade) => [grade.courseCode, grade.score]));
    const rows = record.courses.filter((course) => scores.has(course.code)).map(courseRow);
    return `<h1 class="course-title">${title}</h1><section class="query-result"><div class="print-line">${term}　　列印日期：115/09/18</div><p>班級：${escapeHtml(document.getElementById('student-program').textContent)}　　學號：${escapeHtml(document.getElementById('student-id').textContent)}　　姓名：${escapeHtml(document.getElementById('student-name').textContent)}</p><p class="small-note">[＊] 表示尚未傳送成績。</p>${simpleGrid(['項次','科目名稱','學分數','授課時數','必選修','學期成績'], rows.map((row, i) => [i + 1, row[1], row[5], row[6], `【${row[7]}】`, scores.get(row[0]) || '＊']))}</section>`;
  }
  if (key === 'history') {
    const terms = ['114學年度第1學期', '114學年度第2學期', '115學年度第1學期'];
    const rows = terms.map((term) => {
      const record = recordForTerm(term);
      const numeric = record.grades.map((item) => Number(item.score)).filter(Number.isFinite);
      const credits = record.courses.filter((course) => record.grades.some((grade) => grade.courseCode === course.code)).reduce((total, course) => total + Number(course.credits), 0);
      return [term, credits.toFixed(1), `${numeric.filter((score) => score >= 60).length} 門`, numeric.length ? (numeric.reduce((sum, score) => sum + score, 0) / numeric.length).toFixed(1) : '—', '模擬資料'];
    });
    return `<h1 class="course-title">${title}</h1><section class="query-result">${simpleGrid(['學年期','修習學分','及格科目','學期平均','備註'], rows)}</section>`;
  }
  if (key === 'courses') {
    const term = filters[0] || '115學年度第1學期';
    const rows = term === '115學年度第1學期' ? selectedCourses() : recordForTerm(term).courses.filter((course) => course.selected).map(courseRow);
    return `<h1 class="course-title">${title}</h1><section class="query-result"><p>${term}　選課資料</p>${courseTable('result', rows)}</section>`;
  }
  if (key === 'courseCatalog') {
    const term = filters[0] || '115學年度第1學期';
    const department = filters[1] || loginContext.department;
    const grades = filters[2] && filters[2] !== '全部年級' ? [filters[2]] : ['一年級', '二年級', '三年級', '四年級'];
    const units = department === '全校課程' ? departments : [department];
    const rows = units.flatMap((unit) => grades.flatMap((grade) => departmentCatalog(unit, grade, term).slice(0, 30).map(courseRow)));
    return `<h1 class="course-title">${title}</h1><section class="query-result"><p>${filters.join('／')}　共 ${rows.length} 門課</p>${simpleGrid(['開課代號','科目名稱','英文名稱','年級','學分','開課單位','授課教師'], rows.map((row) => [row[0], row[1], row[2], row[3], row[5], row[17], row[9]]))}</section>`;
  }
  if (key === 'plan') {
    const department = filters[0] || loginContext.department;
    const rows = ['一年級', '二年級', '三年級', '四年級'].flatMap((grade) => departmentCatalog(department, grade).slice(0, 8).map((course) => [grade, course.requiredType, course.name, course.credits, '課程規劃']));
    return `<h1 class="course-title">${title}</h1><section class="query-result"><p>${department}　${filters[1] || '115學年度入學'}　課程規劃表</p>${simpleGrid(['年級','類別','課程名稱','學分','狀態'], rows)}</section>`;
  }
  if (key === 'teacher') {
    const term = filters[0] || '115學年度第1學期';
    const department = filters[1] || loginContext.department;
    const teacher = filters[2] || facultyFor(department)[0];
    return scheduleResult(title, `${term}／${department}／${teacher}`, departmentCatalog(department, loginContext.grade, term).map(courseRow).filter((course) => course[9] === teacher));
  }
  if (key === 'classroom') {
    const term = filters[0] || '115學年度第1學期';
    const room = (filters[1] || '').split('｜')[1] || filters[1];
    const rows = departments.flatMap((department) => departmentCatalog(department, loginContext.grade, term).map(courseRow)).concat(term === '115學年度第1學期' ? sharedCourses.map(courseRow) : []).filter((course) => course[10] === room);
    return scheduleResult(title, filters[1], rows);
  }
  if (key === 'classSchedule') {
    const term = filters[0] || '115學年度第1學期';
    const value = filters[1] || `${loginContext.department}${loginContext.grade}`;
    const department = departments.find((item) => value.startsWith(item)) || loginContext.department;
    const grade = value.slice(department.length) || loginContext.grade;
    return scheduleResult(title, `${term}／${value}`, departmentCatalog(department, grade, term).map(courseRow));
  }
  if (key === 'attendance') return noDataPage('學生個人缺曠請假明細表', '目前無缺曠請假資料');
  if (key === 'awards') return noDataPage('學生個人獎懲狀況明細表', '目前無獎懲資料');
  return noDataPage(title);
}

function simpleGrid(headers, rows) {
  return `<div class="table-wrap"><table class="query-grid"><thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function scheduleResult(title, subject = '', rows = selectedCourses()) {
  const days = ['一', '二', '三', '四', '五'];
  const slots = Array.from({ length: 12 }, (_, index) => index + 1);
  const grid = Object.fromEntries(days.map((day) => [day, Object.fromEntries(slots.map((slot) => [slot, []]))]));
  rows.forEach((course) => {
    const match = /^\(([一二三四五])\)(\d+)-(\d+)$/.exec(course[11]);
    if (!match) return;
    const [, day, startText, endText] = match;
    const start = Number(startText);
    const end = Number(endText);
    slots.filter((slot) => start <= slot && end >= slot).forEach((slot) => {
      grid[day][slot].push(`${course[1]}<br><small>${course[9]}／${course[10]}</small>`);
    });
  });
  const cells = slots.map((slot) => [`第 ${slot} 節`, ...days.map((day) => grid[day][slot].join('<hr>'))]);
  const heading = title === '我的課表' ? `本學期已選 ${selectedCourses().length} 門課，共 ${selectedCredits().toFixed(1)} 學分。` : `查詢條件：${subject}，共 ${rows.length} 門課。`;
  return `<h1 class="course-title">${title}</h1><section class="query-result"><p>${heading}</p>${simpleGrid(['節次／時間', ...days.map((day) => `星期${day}`)], cells)}</section>`;
}

function studentSchedule() {
  return scheduleResult('我的課表');
}

function profilePage() {
  const fields = [['姓名', loginContext.studentName], ['學號', loginContext.studentId], ['系所', loginContext.department], ['年級', loginContext.grade], ['學制', loginContext.level === 'master' ? '碩士班' : loginContext.level === 'doctoral' ? '博士班' : '大學部']];
  return `<h1 class="course-title">學生基本資料表</h1><section class="profile-card"><h2>基本資料</h2><div class="profile-grid">${fields.map(([label, value]) => `<label>${label}<input value="${escapeHtml(value)}" readonly></label>`).join('')}</div><p class="small-note">此頁只顯示登入時填寫的展示身分。</p></section>`;
}

function clubRegistrationPage() {
  const title = '社團登錄作業';
  if (clubApplication) return `<h1 class="course-title">${title}</h1><section class="query-result"><p>申請社團：<strong>${escapeHtml(clubApplication)}</strong></p><div class="rule-status"><strong>審核中</strong><p>此為展示站內的模擬申請，不會送交學校。</p></div></section>`;
  return `<h1 class="course-title">${title}</h1><section class="query-result"><p>請選擇一個社團並確認送出。以下 15 項由本地清單隨機抽取，非正式社團名錄。</p><table class="program-table"><thead><tr><th>選擇</th><th>社團名稱</th></tr></thead><tbody>${clubOptions.map((name) => `<tr><td><input type="radio" name="club-choice" value="${escapeHtml(name)}" aria-label="${escapeHtml(name)}"></td><td>${escapeHtml(name)}</td></tr>`).join('')}</tbody></table><div class="rule-action"><button class="small-button" data-club-submit>確認送出申請</button></div><p class="selection-feedback" role="status"></p></section>`;
}

function clubPage(title, message) {
  return `<h1 class="course-title">${title}</h1><section class="query-result empty-result"><strong>${message}</strong><p>展示版不會進行登錄、維護或送出活動資料。</p></section>`;
}

let currentAddCategory = '一般課程';
let currentAddFilters = {};
function openPage(page) {
  recordDisplayTouched = true;
  const coursePage = renderCoursePage(page);
  contentPanel.innerHTML = coursePage || `<div class="breadcrumb">首頁　&gt;　${page}</div><section class="empty-page"><h1>${page}</h1><p>此功能版型已建立。</p><button id="back-home" class="back-home">回到系統公告</button></section>`;
}

function coursesOverlap(first, second) {
  const matchA = /^\((.)\)(\d+)-(\d+)$/.exec(first[11]);
  const matchB = /^\((.)\)(\d+)-(\d+)$/.exec(second[11]);
  return Boolean(matchA && matchB && matchA[1] === matchB[1] && Number(matchA[2]) <= Number(matchB[3]) && Number(matchB[2]) <= Number(matchA[3]));
}

document.querySelectorAll('.tree-menu [data-page]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tree-menu li').forEach((node) => node.classList.remove('active'));
    button.parentElement.classList.add('active');
    openPage(button.dataset.page);
  });
});

contentPanel.addEventListener('change', (event) => {
  if (event.target.matches('[data-teacher-department]')) {
    const teacherSelect = contentPanel.querySelector('[data-teacher-name]');
    teacherSelect.innerHTML = facultyFor(event.target.value).map((teacher) => `<option>${teacher}</option>`).join('');
  } else if (event.target.matches('[aria-label="學制"]')) {
    const gradeSelect = contentPanel.querySelector('[aria-label="年級"]');
    const count = event.target.value.includes('博士') ? 6 : event.target.value.includes('碩士') ? 4 : 5;
    const previous = Math.min(count, Number(gradeSelect.value) || 1);
    gradeSelect.innerHTML = Array.from({ length: count }, (_, index) => `<option ${index + 1 === previous ? 'selected' : ''}>${index + 1}</option>`).join('');
  }
});

contentPanel.addEventListener('click', (event) => {
  const control = event.target.closest('button');
  if (!control) return;
  if (control.id === 'back-home') {
    contentPanel.innerHTML = homepage;
    document.querySelectorAll('.tree-menu li').forEach((node) => node.classList.remove('active'));
  } else if (control.hasAttribute('data-view-add')) {
    currentAddCategory = control.dataset.viewAdd;
    const row = control.closest('tr');
    currentAddFilters = currentAddCategory === '通識課程'
      ? { field: row.querySelector('select').value }
      : currentAddCategory === '一般課程'
        ? { program: row.querySelector('[aria-label="學制"]').value, department: row.querySelector('[aria-label="系所"]').value, grade: row.querySelector('[aria-label="年級"]').value }
        : {};
    contentPanel.innerHTML = renderAddCourseList(currentAddCategory, currentAddFilters);
  } else if (control.hasAttribute('data-add-back')) {
    openPage('線上加選作業');
  } else if (control.hasAttribute('data-commit-add')) {
    const codes = Array.from(contentPanel.querySelectorAll('[data-course-choice]:checked:not(:disabled)')).map((input) => input.dataset.courseChoice);
    const messages = [];
    codes.forEach((code) => {
      const course = findCourse(code);
      if (!course || selectedCourseCodes.has(code)) return;
      if (course[15] === '額滿') { messages.push(`${course[1]}：額滿`); return; }
      const conflict = selectedCourses().find((selected) => coursesOverlap(selected, course));
      if (conflict) { messages.push(`${course[1]}：與「${conflict[1]}」衝堂`); return; }
      if (selectedCredits() + Number(course[5]) > creditLimit) { messages.push(`${course[1]}：超過 ${creditLimit} 學分上限`); return; }
      selectedCourseCodes.add(code);
      selectionTouched = true;
      messages.push(`${course[1]}：已加選`);
    });
    contentPanel.innerHTML = renderAddCourseList(currentAddCategory, currentAddFilters);
    const feedback = messages.length ? messages.join('；') : '請先勾選可加選的課程。';
    contentPanel.querySelector('.selection-feedback').textContent = feedback;
    const added = messages.filter((message) => message.endsWith('：已加選')).length;
    const failed = messages.length - added;
    showActionDialog(added ? failed ? '部分加選完成' : '加選成功' : '加選未完成', feedback, added ? failed ? 'warning' : 'success' : 'error');
  } else if (control.hasAttribute('data-commit-withdraw')) {
    const codes = Array.from(contentPanel.querySelectorAll('[data-course-choice]:checked')).map((input) => input.dataset.courseChoice);
    if (codes.length) {
      codes.forEach((code) => selectedCourseCodes.delete(code));
      selectionTouched = true;
    }
    const credits = selectedCredits();
    const feedback = codes.length ? `已退選 ${codes.length} 門課，選課結果與課表已同步更新。` : '請先勾選要退選的課程。';
    const warning = codes.length && reducedCreditsApproved && credits < 2
      ? `目前僅剩 ${credits.toFixed(1)} 學分，低於酌減後的 2 學分門檻，可能遭退學。此為模擬提醒，請確認修課規定。`
      : codes.length && !reducedCreditsApproved && credits < 16
        ? `目前僅剩 ${credits.toFixed(1)} 學分，低於 16 學分可能遭退學；可確認是否符合酌減學分申請資格。此為模擬提醒。`
        : '';
    openPage('線上退選作業');
    contentPanel.querySelector('.submit-row').insertAdjacentHTML('afterend', `<p class="selection-feedback" role="status">${feedback}</p>`);
    showActionDialog(warning ? '退選後學分警告' : codes.length ? '退選成功' : '尚未退選', warning ? `${feedback}\n${warning}` : feedback, warning ? 'warning' : codes.length ? 'success' : 'error');
  } else if (control.hasAttribute('data-view-result')) {
    contentPanel.innerHTML = renderResultList();
  } else if (control.hasAttribute('data-club-submit')) {
    const chosen = contentPanel.querySelector('input[name="club-choice"]:checked');
    if (!chosen) { contentPanel.querySelector('.selection-feedback').textContent = '請先選擇一個社團。'; return; }
    clubApplication = chosen.value;
    openPage('社團登錄作業');
  } else if (control.hasAttribute('data-rule-confirm')) {
    const page = control.dataset.ruleName;
    const credits = selectedCredits();
    let headline = '目前尚無可申請資料';
    let detail = '此展示版的確認不會建立正式申請。';
    if (page === '超修學分申請') {
      if (credits >= 25) {
        creditLimit = 30;
        reducedCreditsApproved = false;
        selectionTouched = true;
        headline = '模擬申請已通過';
        detail = '選課上限已由 25 學分提高至 30 學分，可返回線上加選作業繼續選課。';
      } else {
        headline = '不符合超修資格';
        detail = `目前已選 ${credits.toFixed(1)} 學分，須選滿 25 學分才能申請。`;
      }
    } else if (page === '酌減學分申請') {
      if (credits > 2 && credits < 16) {
        creditLimit = 16;
        reducedCreditsApproved = true;
        selectionTouched = true;
        headline = '模擬申請已通過';
        detail = '已選學分高於 2 且低於 16，展示站的學分上限已設為 16 學分。';
      } else {
        headline = '不符合酌減資格';
        detail = credits <= 2
          ? `目前已選 ${credits.toFixed(1)} 學分，須高於 2 學分才能申請。${credits < 2 ? '未滿 2 學分建議退學（開玩笑，僅供展示）。' : ''}`
          : `目前已選 ${credits.toFixed(1)} 學分；請先退選至低於 16 學分再申請。`;
      }
    }
    contentPanel.innerHTML = `<div class="course-page"><div class="breadcrumb">首頁　&gt;　選課作業　&gt;　${page}</div><h1 class="course-title">${page}</h1><div class="rule-status"><strong>${headline}</strong><p>${detail}</p><p class="small-note">僅本站模擬，並未提交正式校務申請。</p><button class="small-button" data-rule-back="${page}">回申請規則</button></div></div>`;
    showActionDialog(headline, detail, headline === '模擬申請已通過' ? 'success' : 'error');
  } else if (control.hasAttribute('data-rule-back')) {
    openPage(control.dataset.ruleBack);
  } else if (control.hasAttribute('data-program-info')) {
    const program = control.dataset.programInfo;
    contentPanel.innerHTML = `<div class="course-page"><h1 class="course-title">${escapeHtml(program)}</h1><section class="query-result"><p>此學程為模擬展示資訊。修習科目與申請條件依開課單位公告為準。</p><button class="small-button" data-program-back>回學分學程資訊</button></section></div>`;
  } else if (control.hasAttribute('data-program-back')) {
    openPage('學分學程資訊');
  } else if (control.hasAttribute('data-show-query')) {
    const form = control.closest('.filter-row');
    const filters = Array.from(form.querySelectorAll('select')).map((select) => select.value);
    const page = contentPanel.querySelector('.course-title')?.textContent || '查詢結果';
    contentPanel.innerHTML = `<div class="course-page"><div class="breadcrumb">首頁　&gt;　查詢　&gt;　${page}</div><button class="small-button" data-query-back="${page}">回查詢條件</button>${queryResult(control.dataset.showQuery, filters)}</div>`;
  } else if (control.hasAttribute('data-query-back')) {
    openPage(control.dataset.queryBack);
  } else if (control.hasAttribute('data-demo-action')) {
    control.insertAdjacentHTML('afterend', '<span class="small-note" role="status">此展示版不會儲存或送出資料。</span>');
  } else if (control.hasAttribute('data-password-clear')) {
    contentPanel.querySelectorAll('input').forEach((input) => { input.value = ''; });
  }
});

document.getElementById('toggle-menu').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('hidden-menu');
});

document.getElementById('change-password').addEventListener('click', () => {
  recordDisplayTouched = true;
  contentPanel.innerHTML = `<div class="course-page password-page"><h1 class="course-title">修改密碼作業</h1><section class="password-panel"><label>新密碼：<input type="password" placeholder="展示版不會保存"></label><label>確認密碼：<input type="password" placeholder="再次輸入新密碼"></label><p>密碼需包含大小寫英文、數字與標點至少三項，長度最多 10 碼。</p><div><button class="small-button" data-demo-action>確定送出</button><button class="small-button" data-password-clear>清除重填</button></div></section></div>`;
});
document.getElementById('logout').addEventListener('click', () => {
  appShell.hidden = true;
  loginScreen.hidden = false;
  document.getElementById('login-password').value = '';
  loginForm.querySelector('#login-id').focus();
});

// 獨立於資料產生流程的最後保護：任何登入載入遮罩最多只顯示 15 秒。
const loadingOverlay = document.getElementById('generation-overlay');
new MutationObserver(() => {
  if (!loadingOverlay.hidden) window.setTimeout(() => { loadingOverlay.hidden = true; loadingOverlay.style.display = 'none'; }, 15000);
}).observe(loadingOverlay, { attributes: true, attributeFilter: ['hidden'] });
