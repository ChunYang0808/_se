const { createApp } = require('./app');
const port = Number(process.env.PORT) || 3000;
const server = createApp().listen(port, () => console.log(`CampusFlow 已啟動：http://localhost:${port}`));
function shutdown() { server.close(() => process.exit(0)); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
