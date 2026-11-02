import express from 'express';
import { generateVideo, getVideoGeneratorStatus } from '../services/videoGenerationService.mjs';

const router = express.Router();

router.get('/status', async (_req, res) => {
  try { res.json(await getVideoGeneratorStatus()); }
  catch (error) { res.status(error.status || 503).json({ available: false, error: error.message }); }
});

router.post('/generate', async (req, res) => {
  try {
    const video = await generateVideo(req.body || {});
    res.setHeader('Content-Type', video.mime);
    res.setHeader('Content-Length', video.buffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="jarves-video${video.mime === 'video/webm' ? '.webm' : '.mp4'}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(video.buffer);
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message });
  }
});

export default router;
