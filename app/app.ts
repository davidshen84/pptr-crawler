import express from 'express';
import {router as weibo_router} from '../crawlers/weibo/router';
import Signals = NodeJS.Signals;

const app = express();

app.use('/weibo', weibo_router);

const server = app.listen(8888, () => console.log('started'));

(['SIGINT', 'SIGTERM'] as Signals[]).forEach(s => {
  process.on(s, () => {
    server.close(() => console.log('closed'));
  });
});
