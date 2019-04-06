import express from 'express';
import {AddressInfo} from 'net';
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
  app.use((req, res, next) =>{
    console.info(`${req.method} ${req.url} at ${new Date()}.`);
    next();
  });

  app.use('/weibo', weibo_router(browser));

  const server = app.listen(process.env.port || 8080, (err: any) => {
    if (err)
      return console.error(err);
    const port = (server.address() as AddressInfo).port;
    console.info(`Server is listening on port ${port}!`);
  });

  server.on('close', () => {
    console.log('Server is closing!');
  });

  server.on('error', async e => {
    console.error(e);
    await browser.close();
    server.close();
    process.exit(-1);
  });

  module.exports = app;
})();

(['SIGINT', 'SIGTERM'] as Signals[]).forEach(s => {
  process.on(s, (signals: Signals) => {
    console.log(`Received ${signals}`);
    console.warn(`Next time, try accessing /shutdown to shutdown the service properly!`);
  });
});
