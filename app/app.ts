import express from 'express';
import {browser, router as weibo_router} from '../crawlers/weibo/router';
import Signals = NodeJS.Signals;

const app = express();

app.use('/weibo', weibo_router);

const server = app.listen(8888, () => console.log('started'));

(['SIGINT', 'SIGTERM'] as Signals[]).forEach(s => {
  process.on(s, (signals: Signals) => {
    console.log(`Received ${signals}`);

    server.close(() => {
      browser.close().then(() => {
        process.exit(0);
      });
    });
  });
})
;
