/*
 * 此檔不含 API 金鑰，可安全隨 GitHub Pages 一起發布。
 * Cloudflare Worker 會讀取以下提示詞與資料契約，並將 GEMINI_API_KEY 留在 Worker 的 Secret。
 */
// Cloudflare Worker 部署完成後，填入公開 Worker URL；此處不應填 API 金鑰。
// 例如：window.NQU_AI_PROXY_URL = 'https://nqu-mock-ai.<帳號>.workers.dev';
window.NQU_AI_PROXY_URL = 'https://floral-mountain-6779.tshes102054.workers.dev';

window.NQU_AI_CONFIG = {
  model: 'gemini-2.5-flash',
  proxyPath: '/api/student-record',
  systemInstruction: `你是「國立金門大學校務行政資訊系統」的模擬資料引擎。

你的唯一任務是為前端展示站生成一致、逼真、但完全虛構的學生校務資料。這不是正式校務系統，不能使用、推測、重現或要求任何真實個資、真實成績、真實選課、真實帳號密碼或真實申請結果。

硬性規則：
1. 一律使用繁體中文；所有姓名、學號、教師、課程、成績與申請紀錄必須是虛構展示資料。
2. 只可使用輸入提供的系所、學制、年級與學生識別字串作為情境。學號僅作前端顯示，絕不可聲稱已驗證。
3. 系所與已知教室清單必須優先採用。資訊工程學系的教師只從輸入的資工教師名單選擇；其他系所的教師必須產生虛構中文姓名，不得把資工教師分配到其他系所。所有授課關係均為模擬，不能當作真實教學資訊。
4. 生成一份內部一致的學期資料：至少 30 門專業課，並額外生成至少 24 門通識課；專業課通常 3 學分、3 節課，通識 2 學分、2 節課，體育如有出現則為 0 學分、2 節課；7–9 門課標示 selected=true，代表本學期已選，彼此時間不得衝堂，合計 16–25 學分。教師及教室同一節次不得同時安排兩門課；成績範圍 55–100 或「尚未公告」；必修、選修與年級要合理。
5. 每門課都要提供上限、下限與實收人數。實收人數等於上限時，remarks 必須為「額滿」；否則 remarks 必須為空字串。
6. 專業課教室須與系所空間合理對應（例如資工優先使用 I101、I102、I103、E318、E319、E320、E321）；課程代號必須互不重複，課名與英文名稱要自然且彼此對應，不能靠「（2）」「（3）」機械複製同一科目。
7. 不得生成付款、醫療、紀律、兵役、住宿、請假或任何高敏感個資的具體事實；這些頁面僅可回傳空陣列或「目前無資料」狀態。
8. 不得生成真實校規、截止日、電話、外部網址或需要使用者採取行動的指示。公告只可為一般性的展示通知。
9. 僅輸出符合所給 JSON Schema 的 JSON，不要 Markdown、說明文字或額外欄位。`,
  responseSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['student', 'courses', 'grades', 'announcements', 'safeEmptyPages'],
    properties: {
      student: {
        type: 'object', additionalProperties: false,
        required: ['displayName', 'studentId', 'department', 'programLabel', 'academicYear', 'semester'],
        properties: {
          displayName: { type: 'string', description: '虛構展示姓名，保留使用者輸入的名字也可。' },
          studentId: { type: 'string', description: '前端顯示用學號。' },
          department: { type: 'string' },
          programLabel: { type: 'string', description: '例如：資工二、資工碩一、資工博二。' },
          academicYear: { type: 'string', description: '例如 115' },
          semester: { type: 'string', description: '例如 第1學期' }
        }
      },
      courses: {
        type: 'array', minItems: 54, maxItems: 64,
        items: {
          type: 'object', additionalProperties: false,
          required: ['code', 'name', 'englishName', 'className', 'group', 'credits', 'requiredType', 'teacher', 'classroom', 'time', 'hours', 'semesterType', 'capacity', 'minimum', 'enrolled', 'remarks', 'selected'],
          properties: {
            code: { type: 'string' }, name: { type: 'string' }, englishName: { type: 'string' },
            className: { type: 'string' }, group: { type: 'string' }, credits: { type: 'string' },
            requiredType: { type: 'string', enum: ['必修', '選修', '通識'] }, teacher: { type: 'string' },
            classroom: { type: 'string' }, time: { type: 'string' }, hours: { type: 'string' }, semesterType: { type: 'string' },
            capacity: { type: 'string' }, minimum: { type: 'string' }, enrolled: { type: 'string' }, remarks: { type: 'string' }, selected: { type: 'boolean' }
          }
        }
      },
      grades: {
        type: 'array', maxItems: 64,
        items: { type: 'object', additionalProperties: false, required: ['courseCode', 'score'], properties: { courseCode: { type: 'string' }, score: { type: 'string' } } }
      },
      announcements: { type: 'array', maxItems: 3, items: { type: 'string' } },
      safeEmptyPages: { type: 'array', items: { type: 'string' }, description: '須維持「目前無資料」的敏感頁面名稱。' }
    }
  },
  buildPrompt(context) {
    return `請為下列登入情境生成一份展示用資料。\n${JSON.stringify(context)}\n已知系所：${context.departments.join('、')}\n已知資工教師：${context.csFaculty.join('、')}\n可用教室範例：${context.classrooms.slice(0, 20).join('、')}`;
  }
};
