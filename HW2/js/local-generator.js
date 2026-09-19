/* 本機備援生成器：不依賴網路，也遵守與 Gemini 相同的資料規則。 */
window.NQU_LOCAL = {
  generateStudentRecord(context) {
    let seed = Array.from(`${context.studentId}${context.department}${context.grade}`).reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 233280, 7) || 1;
    const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const choose = (items) => items[Math.floor(random() * items.length)];
    const departmentShort = { '資訊工程學系': '資工', '電機工程學系': '電機', '土木與工程管理學系': '土木', '食品科學系': '食科', '護理學系': '護理', '長期照護學系': '長照', '社會工作學系': '社工', '建築學系': '建築', '企業管理學系': '企管', '觀光管理學系': '觀光', '運動與休閒學系': '運休', '國際暨大陸事務學系': '國際', '海洋與邊境管理學系': '海邊', '華語文學系': '華文', '應用英語學系': '應英', '都市計畫與景觀學系': '都景', '工業工程與管理學系': '工管' };
    const departmentCourses = {
      '資訊工程學系': ['資料結構', '演算法設計', '資料庫系統管理', '計算機結構', '網路程式設計', '作業系統', '軟體工程', '人工智慧導論'],
      '電機工程學系': ['電路學', '電子學', '訊號與系統', '嵌入式系統', '通訊原理', '控制系統'],
      '土木與工程管理學系': ['工程力學', '結構分析', '土壤力學', '工程測量', '營建管理'],
      '食品科學系': ['食品化學', '食品微生物學', '食品工程', '食品分析', '發酵技術'],
      '護理學系': ['基本護理學', '生理學', '藥理學', '成人護理學', '臨床護理實務'],
      '長期照護學系': ['長期照護導論', '高齡健康照護', '照護服務管理', '失能評估'],
      '社會工作學系': ['社會工作概論', '人類行為與社會環境', '社會福利政策', '個案工作'],
      '建築學系': ['建築設計', '建築構造', '建築歷史', '環境控制', '都市設計'],
      '企業管理學系': ['管理學', '行銷管理', '財務管理', '組織行為', '商業資料分析'],
      '觀光管理學系': ['觀光學概論', '旅運管理', '餐旅服務', '觀光資源規劃'],
      '運動與休閒學系': ['運動生理學', '休閒遊憩概論', '運動管理', '健康促進'],
      '國際暨大陸事務學系': ['國際關係', '兩岸關係', '外交政策', '全球治理'],
      '海洋與邊境管理學系': ['海洋政策', '邊境管理', '海事安全', '國境執法'],
      '華語文學系': ['華語文教學', '現代漢語', '語言學概論', '華人文化'],
      '應用英語學系': ['英文寫作', '口語訓練', '翻譯實務', '英美文學'],
      '都市計畫與景觀學系': ['都市計畫概論', '景觀設計', '地理資訊系統', '環境規劃'],
      '工業工程與管理學系': ['作業研究', '生產管理', '品質管理', '人因工程']
    };
    const departmentEnglish = {
      '資訊工程學系': 'Computer Science', '電機工程學系': 'Electrical Engineering',
      '土木與工程管理學系': 'Civil Engineering', '食品科學系': 'Food Science',
      '護理學系': 'Nursing', '長期照護學系': 'Long-Term Care', '社會工作學系': 'Social Work',
      '建築學系': 'Architecture', '企業管理學系': 'Business Administration',
      '觀光管理學系': 'Tourism Management', '運動與休閒學系': 'Sports and Leisure',
      '國際暨大陸事務學系': 'International Affairs', '海洋與邊境管理學系': 'Marine and Border Management',
      '華語文學系': 'Chinese Language', '應用英語學系': 'Applied English',
      '都市計畫與景觀學系': 'Urban Planning and Landscape', '工業工程與管理學系': 'Industrial Engineering'
    };
    const englishTitles = {
      '資料結構': 'Data Structures', '演算法設計': 'Algorithm Design', '資料庫系統管理': 'Database Systems', '計算機結構': 'Computer Architecture', '網路程式設計': 'Network Programming', '作業系統': 'Operating Systems', '軟體工程': 'Software Engineering', '人工智慧導論': 'Introduction to Artificial Intelligence',
      '電路學': 'Circuit Theory', '電子學': 'Electronics', '訊號與系統': 'Signals and Systems', '嵌入式系統': 'Embedded Systems', '通訊原理': 'Principles of Communication', '控制系統': 'Control Systems',
      '工程力學': 'Engineering Mechanics', '結構分析': 'Structural Analysis', '土壤力學': 'Soil Mechanics', '工程測量': 'Engineering Surveying', '營建管理': 'Construction Management',
      '食品化學': 'Food Chemistry', '食品微生物學': 'Food Microbiology', '食品工程': 'Food Engineering', '食品分析': 'Food Analysis', '發酵技術': 'Fermentation Technology',
      '基本護理學': 'Fundamentals of Nursing', '生理學': 'Physiology', '藥理學': 'Pharmacology', '成人護理學': 'Adult Nursing', '臨床護理實務': 'Clinical Nursing Practice',
      '長期照護導論': 'Introduction to Long-Term Care', '高齡健康照護': 'Geriatric Health Care', '照護服務管理': 'Care Service Management', '失能評估': 'Disability Assessment',
      '社會工作概論': 'Introduction to Social Work', '人類行為與社會環境': 'Human Behavior and the Social Environment', '社會福利政策': 'Social Welfare Policy', '個案工作': 'Social Casework',
      '建築設計': 'Architectural Design', '建築構造': 'Building Construction', '建築歷史': 'History of Architecture', '環境控制': 'Environmental Control', '都市設計': 'Urban Design',
      '管理學': 'Principles of Management', '行銷管理': 'Marketing Management', '財務管理': 'Financial Management', '組織行為': 'Organizational Behavior', '商業資料分析': 'Business Data Analysis',
      '觀光學概論': 'Introduction to Tourism', '旅運管理': 'Travel Management', '餐旅服務': 'Hospitality Service', '觀光資源規劃': 'Tourism Resource Planning',
      '運動生理學': 'Exercise Physiology', '休閒遊憩概論': 'Introduction to Leisure and Recreation', '運動管理': 'Sports Management', '健康促進': 'Health Promotion',
      '國際關係': 'International Relations', '兩岸關係': 'Cross-Strait Relations', '外交政策': 'Foreign Policy', '全球治理': 'Global Governance',
      '海洋政策': 'Marine Policy', '邊境管理': 'Border Management', '海事安全': 'Maritime Safety', '國境執法': 'Border Law Enforcement',
      '華語文教學': 'Teaching Chinese as a Second Language', '現代漢語': 'Modern Chinese', '語言學概論': 'Introduction to Linguistics', '華人文化': 'Chinese Culture',
      '英文寫作': 'English Composition', '口語訓練': 'Oral Communication', '翻譯實務': 'Translation Practice', '英美文學': 'British and American Literature',
      '都市計畫概論': 'Introduction to Urban Planning', '景觀設計': 'Landscape Design', '地理資訊系統': 'Geographic Information Systems', '環境規劃': 'Environmental Planning',
      '作業研究': 'Operations Research', '生產管理': 'Production Management', '品質管理': 'Quality Management', '人因工程': 'Human Factors Engineering',
      '世界文化史': 'World Cultural History', '世界音樂與舞蹈': 'World Music and Dance', '世界音樂賞析': 'World Music Appreciation', '中國大陸流行文化': 'Popular Culture in Mainland China',
      '中國文學：鑑賞與製作': 'Chinese Literature: Appreciation and Creative Writing', '人工智慧輔助設計思考': 'AI-Assisted Design Thinking', '人體生理的奧秘': 'Mysteries of Human Physiology',
      '休閒與游泳實務理論': 'Recreation and Swimming', '健康生活面面觀': 'Aspects of Healthy Life', '傳染病學概論': 'Introduction to Infectious Diseases',
      '全民國防教育軍事訓練課程': 'National Defense Education', '島嶼永續發展': 'Sustainable Island Development', '數位人文導論': 'Introduction to Digital Humanities',
      '公民社會與法治': 'Civil Society and Rule of Law', '科學與生活': 'Science in Everyday Life', '電影與視覺文化': 'Film and Visual Culture',
      '生命教育與倫理': 'Life Education and Ethics', '台灣社會與文化': 'Taiwanese Society and Culture', '藝術欣賞': 'Art Appreciation',
      '媒體識讀': 'Media Literacy', '環境永續': 'Environmental Sustainability', '運動與健康': 'Exercise and Health',
      '心理學與生活': 'Psychology in Everyday Life', '科技倫理': 'Technology Ethics'
    };
    const courseVariants = [
      ['實務', 'Practice in'], ['專題', 'Special Topics in'], ['案例分析', 'Case Studies in'],
      ['技術應用', 'Applications of'], ['進階研究', 'Advanced Studies in'], ['跨域應用', 'Interdisciplinary Applications of'],
      ['專案實作', 'Projects in'], ['產業趨勢', 'Industry Trends in']
    ];
    const courseTitle = (base, index, department) => {
      const englishBase = englishTitles[base] || departmentEnglish[department] || 'Interdisciplinary Studies';
      const baseCount = (departmentCourses[department] || []).length;
      const graduate = context.grade.startsWith('碩士') || context.grade.startsWith('博士');
      const doctoral = context.grade.startsWith('博士');
      const stem = base.replace(/(學概論|概論|導論)$/, '').replace(/學$/, '');
      if (index < baseCount) return graduate
        ? { chinese: `${stem}${doctoral ? '研究專題' : '進階專題'}`, english: `${doctoral ? 'Research Seminar in' : 'Advanced Topics in'} ${englishBase}` }
        : { chinese: base, english: englishBase };
      const [chineseSuffix, englishPrefix] = courseVariants[(Math.floor(index / baseCount) - 1) % courseVariants.length];
      return { chinese: `${stem}${chineseSuffix}${doctoral ? '研究' : ''}`, english: `${englishPrefix} ${englishBase}` };
    };
    const roomTokens = { '資訊工程學系': ['I101', 'I102', 'I103', 'E318', 'E319', 'E320', 'E321'], '電機工程學系': ['E220', 'E221', 'E222', 'E223'], '土木與工程管理學系': ['E119', 'E120', 'E121', 'E122', 'E123'], '食品科學系': ['E304', 'E305', 'E413', 'E414', 'E415', 'E416', 'T1'], '護理學系': ['B10', 'B11', 'D106', 'D203', 'D204'], '長期照護學系': ['B15', 'D201', 'D202', 'D301', 'D302', 'D314'], '社會工作學系': ['B12', 'B16', 'D102', 'D103', 'D105'], '建築學系': ['513', '514', '515', '535', '550'], '企業管理學系': ['306', '307', '308', '324', '330'], '觀光管理學系': ['228', '230', '231', '232', '239'], '運動與休閒學系': ['129', '130', '132', '133', '701', '702'], '國際暨大陸事務學系': ['106', '107', '108', '109', '110', '111'], '海洋與邊境管理學系': ['206', '208', '209'], '華語文學系': ['404', '406', '407', '408', '409', '427', '429'], '應用英語學系': ['427', '429', '430', '450'], '都市計畫與景觀學系': ['513', '514', '535'], '工業工程與管理學系': ['306', '307', '308'] };
    const rooms = context.classrooms.map((entry) => { const [code, name] = entry.split('｜'); return { code, name }; });
    const roomFor = (department) => { const allowed = roomTokens[department] || []; const candidates = rooms.filter((room) => allowed.some((token) => room.code.includes(token) || room.name.includes(token))); return choose(candidates.length ? candidates : rooms.filter((room) => /普通教室|教室（理工大樓）/.test(room.name))); };
    const teacherFor = (department) => department === '資訊工程學系' ? choose(context.csFaculty) : `${choose(['林', '陳', '王', '李', '張', '黃', '劉'])}${choose(['思妤', '冠宇', '雅雯', '承翰', '怡君', '子維'])}`;
    const twoPeriodSlots = ['一', '二', '三', '四', '五'].flatMap((day) => [1, 3, 5, 7, 9, 11].map((start) => `(${day})${start}-${start + 1}`));
    const threePeriodSlots = ['一', '二', '三', '四', '五'].flatMap((day) => [1, 4, 7, 10].map((start) => `(${day})${start}-${start + 2}`));
    const selectedSlots = ['(一)1-3', '(二)4-6', '(三)7-9', '(四)1-3', '(五)4-6', '(二)10-12', '(四)7-9'];
    const makeCourse = (name, englishName, index, category, field) => {
      const room = roomFor(field);
      const capacity = category === '通識' ? choose([40, 45, 50, 55]) : choose([35, 40, 45]);
      const full = index % 6 === 0;
      const enrolled = full ? capacity : Math.max(12, capacity - 1 - Math.floor(random() * 14));
      const classroom = room.name.startsWith(room.code) ? room.name : `${room.code}${room.name}`;
      const general = category === '通識';
      const slots = general ? twoPeriodSlots : threePeriodSlots;
      return { code: `${field === context.department ? '1' : '8'}${String(100 + index).padStart(3, '0')}`, name, englishName, className: general ? '日大學通識' : `${departmentShort[field] || '跨域'}${context.grade.replace(/[^一二三四五六]/g, '') || '二'}`, group: String((index % 2) + 1).padStart(2, '0'), credits: general ? '2.0' : '3.0', requiredType: general ? '通識' : index % 3 === 0 ? '選修' : '必修', teacher: teacherFor(field), classroom, time: !general && index < 7 ? selectedSlots[index] : slots[(index * 7 + 3) % slots.length], hours: general ? '2.0' : '3.0', semesterType: '學期', capacity: String(capacity), minimum: '10', enrolled: String(enrolled), remarks: full ? '額滿' : '' };
    };
    const degreeNames = departmentCourses[context.department] || ['專業基礎', '領域實務', '專題研究', '跨域應用'];
    const majorCourses = Array.from({ length: 30 }, (_, index) => { const title = courseTitle(degreeNames[index % degreeNames.length], index, context.department); return { ...makeCourse(title.chinese, title.english, index, '專業', context.department), selected: index < 7 }; });
    const generalNames = ['世界文化史', '世界音樂與舞蹈', '世界音樂賞析', '中國大陸流行文化', '中國文學：鑑賞與製作', '人工智慧輔助設計思考', '人體生理的奧秘', '休閒與游泳實務理論', '健康生活面面觀', '傳染病學概論', '全民國防教育軍事訓練課程', '島嶼永續發展', '數位人文導論', '公民社會與法治', '科學與生活', '電影與視覺文化', '生命教育與倫理', '台灣社會與文化', '藝術欣賞', '媒體識讀', '環境永續', '運動與健康', '心理學與生活', '科技倫理'];
    const generalCourses = generalNames.map((name, index) => ({ ...makeCourse(name, englishTitles[name], index + 30, '通識', choose(context.departments)), selected: false }));
    const courses = [...majorCourses, ...generalCourses];
    return { student: { displayName: context.studentName, studentId: context.studentId, department: context.department, programLabel: `${departmentShort[context.department] || context.department}${context.grade}`, academicYear: '115', semester: '第1學期' }, courses, grades: courses.slice(0, 22).map((course, index) => ({ courseCode: course.code, score: index % 7 === 0 ? '尚未公告' : String(65 + Math.floor(random() * 31)) })), announcements: ['本頁資料由展示引擎產生，非正式校務紀錄。'], safeEmptyPages: ['學生請假作業', '校內宿舍申請', '兵役申辦查詢'] };
  }
};
