const express = require('express');
const path = require('path');
const { TaskService } = require('./taskService');

function createApp(taskService = new TaskService()) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.get('/api/tasks', (_req, res) => res.json(taskService.getAll()));
  app.post('/api/tasks', (req, res, next) => { try { res.status(201).json(taskService.create(req.body)); } catch (error) { next(error); } });
  app.patch('/api/tasks/:id', (req, res, next) => { try { res.json(taskService.update(req.params.id, req.body)); } catch (error) { next(error); } });
  app.delete('/api/tasks/:id', (req, res, next) => { try { taskService.remove(req.params.id); res.status(204).end(); } catch (error) { next(error); } });
  app.use('/api', (_req, res) => res.status(404).json({ error: '找不到此 API' }));
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message || '伺服器發生錯誤' }));
  return app;
}
module.exports = { createApp };
