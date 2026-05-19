const Database = require('better-sqlite3');
const QuestionStore = require('./src/question-store');
const createApp = require('./src/app');

const db = new Database('data.db');
const store = new QuestionStore(db);
const app = createApp(store);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Q&A server listening on http://localhost:${port}`);
});
