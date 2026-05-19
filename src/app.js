const express = require('express');
const tokenMiddleware = require('./token-middleware');
const VoteGuard = require('./vote-guard');
const QRService = require('./qr-service');

function createApp(store) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/questions', (req, res) => {
    const token = req.headers['x-anonymous-token'] || null;
    res.json(store.listWithDetails(token));
  });

  app.post('/api/questions', (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required' });
    }
    const question = store.create(content.trim());
    res.status(201).json(question);
  });

  app.post('/api/vote', tokenMiddleware, (req, res) => {
    const questionId = Number(req.body.questionId);
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    const question = store.find(questionId);
    if (!question) {
      return res.status(404).json({ error: 'question not found' });
    }

    const existingVote = store.hasVoted(questionId, req.anonToken);
    const lastVoteTimeStr = store.getLastVoteTime(req.anonToken);
    const lastVoteAt = lastVoteTimeStr ? new Date(lastVoteTimeStr + 'Z').getTime() : null;

    const guard = new VoteGuard();
    const { allowed, reason } = guard.canVote({
      token: req.anonToken,
      questionId,
      existingVote,
      lastVoteAt,
    });

    if (!allowed) {
      const status = reason === 'duplicate' ? 409 : 429;
      return res.status(status).json({ error: reason });
    }

    store.createVote(questionId, req.anonToken);
    res.status(201).json({ success: true });
  });

  app.delete('/api/questions/:id', (req, res) => {
    const id = Number(req.params.id);
    const deleted = store.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'question not found' });
    }
    res.json({ success: true });
  });

  app.get('/questions/list', (req, res) => {
    const token = req.headers['x-anonymous-token'] || null;
    res.render('questions-list', { questions: store.listWithDetails(token) });
  });

  app.get('/presenter/list', (req, res) => {
    res.render('presenter-questions', { questions: store.listWithDetails() });
  });

  app.get('/presenter', async (req, res) => {
    const origin = `${req.protocol}://${req.headers.host}`;
    const qrDataUrl = await QRService.generate(origin);
    res.render('presenter', {
      questions: store.listWithDetails(),
      qrDataUrl,
      origin,
    });
  });

  app.get('/', (req, res) => {
    const token = req.headers['x-anonymous-token'] || null;
    res.render('audience', { questions: store.listWithDetails(token) });
  });

  app.set('view engine', 'ejs');
  app.set('views', require('path').join(__dirname, '..', 'views'));

  return app;
}

module.exports = createApp;
