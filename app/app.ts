import express from 'express';
import {AddressInfo} from 'net';
import {SimpleBrowser} from '../crawlers/browser';
import {buildRouter as weibo_router} from '../crawlers/weibo/router';
import Signals = NodeJS.Signals;

(async () => {
  const app = express();
  const browser = new SimpleBrowser();

  app.use((req, res, next) => {
    console.info(`${req.method} ${req.url} at ${new Date()}.`);
    next();
  });

  app.get('/shutdown', async (req, res) => {
    await browser.close();
    server.close(() => process.exit(0));
    res.status(200).end();
  });

  app.use('/weibo', weibo_router(browser));

  const server = app.listen(Number(process.env.PORT) || 8888, (err: any) => {
    if (err)
      return console.error(err);
    const port = (server.address() as AddressInfo).port;
    console.info(`Server is listening on port ${port}!`);
  })
    .on('close', () => {
      console.log('Server is closing!');
    })
    .on('error', async e => {
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
