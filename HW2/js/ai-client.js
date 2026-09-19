/* Cloudflare Worker 部署後，設定 window.NQU_AI_PROXY_URL 即可覆寫預設路徑。 */
window.NQU_AI = {
  async generateStudentRecord(context) {
    const config = window.NQU_AI_CONFIG;
    const endpoint = window.NQU_AI_PROXY_URL || config.proxyPath;
    // file:// 預覽沒有可驗證的網站 Origin，改用本機展示資料，避免 Worker 的 CORS 保護造成等待。
    if (!window.NQU_AI_PROXY_URL || window.location.protocol === 'file:') return null;
    // 姓名與登入帳號只留在瀏覽器顯示；AI 僅收到生成課程所需的非識別情境。
    const safeContext = {
      department: context.department,
      grade: context.grade,
      level: context.level,
      departments: context.departments,
      csFaculty: context.csFaculty,
      classrooms: context.classrooms
    };
    const controller = new AbortController();
    // Gemini 需生成 54 門課程的命名資料；保留緩衝避免偶發延遲時過早回退至本機展示資料。
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, context: safeContext, schema: config.responseSchema }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('AI 資料服務暫時無法使用');
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('AI 資料服務逾時，已改用本機展示資料');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }
};

