const VALID_PRIORITIES = ['low', 'medium', 'high'];

class TaskService {
  constructor(initialTasks = []) {
    this.tasks = initialTasks.map((task) => ({ ...task }));
    this.nextId = this.tasks.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0) + 1;
  }
  getAll() { return this.tasks.map((task) => ({ ...task })); }
  create(input = {}) {
    const course = String(input.course || '').trim();
    const title = String(input.title || '').trim();
    const dueDate = String(input.dueDate || '').trim();
    const priority = String(input.priority || 'medium').toLowerCase();
    if (!course) throw this.validationError('課程名稱不能空白');
    if (!title) throw this.validationError('任務名稱不能空白');
    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(`${dueDate}T00:00:00`))) throw this.validationError('請提供有效的截止日期');
    if (!VALID_PRIORITIES.includes(priority)) throw this.validationError('優先程度無效');
    const task = { id: String(this.nextId++), course, title, dueDate, priority, completed: false, createdAt: new Date().toISOString() };
    this.tasks.push(task); return { ...task };
  }
  update(id, input = {}) {
    const task = this.tasks.find((item) => item.id === String(id));
    if (!task) throw this.notFoundError();
    if (typeof input.completed !== 'boolean') throw this.validationError('completed 必須是布林值');
    task.completed = input.completed; return { ...task };
  }
  remove(id) {
    const index = this.tasks.findIndex((item) => item.id === String(id));
    if (index === -1) throw this.notFoundError();
    return { ...this.tasks.splice(index, 1)[0] };
  }
  validationError(message) { return Object.assign(new Error(message), { status: 400 }); }
  notFoundError() { return Object.assign(new Error('找不到指定的任務'), { status: 404 }); }
}
module.exports = { TaskService, VALID_PRIORITIES };
