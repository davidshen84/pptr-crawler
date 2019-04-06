import express from 'express';
import {buildRouter as weibo_router} from '../crawlers/weibo/router';
import {SimpleBrowser} from '../crawlers/weibo/util';
import Signals = NodeJS.Signals;

(async () => {
  const app = express();
  const browser = new SimpleBrowser();

  app.get('/shutdown', async (req, res) => {
    await browser.close();
    server.close(() => process.exit(0));
    res.status(200).end();
  });

  app.use('/weibo', weibo_router(browser));

  const server = app.listen(8888, () => console.log('Server started!'));

  server.on('close', () => {
    console.log('Server is closing!');
  });

  server.on('error', async e => {
    console.error(e);
    await browser.close();
    server.close();
    process.exit(-1);
  });
})();

(['SIGINT', 'SIGTERM'] as Signals[]).forEach(s => {
  process.on(s, (signals: Signals) => {
    console.log(`Received ${signals}`);
    console.warn(`Next time, try accessing /shutdown to shutdown the service properly!`);
  });
});
