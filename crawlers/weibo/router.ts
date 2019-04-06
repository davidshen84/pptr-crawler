import express from 'express';
import * as url from 'url';
import {get_comments} from './comments';
import {get_headline} from './headline';
import {get_user_timeline} from './user_timeline';
import {SimpleBrowser} from './util';

export function buildRouter(browser: SimpleBrowser) {
  const router = express.Router();

  router.get(/\/timeline\/(.+)/, async (req, res) =>
    await get_user_timeline(browser, req.params[0])
      .then(posts => {
        posts.forEach(p => res.write(`${JSON.stringify(p)}\n`));
        res.status(200).end();
      })
      .catch(r => res.status(500).send(r).end()));

  router
    .get('/headline', (req, res) => {
      const urlFormatBase = {
        host: req.get('host'),
        protocol: req.protocol,
      };

      return res.status(200)
        .json({
          BreakingNews: url.format({
            ...urlFormatBase,
            pathname: `${req.originalUrl}/1760`,
          }),
          Fashion: url.format({
            ...urlFormatBase,
            pathname: `${req.originalUrl}/12`,

          }),
          Movie: url.format({
            ...urlFormatBase,
            pathname: `${req.originalUrl}/10018`,
          }),
        });
    })
    .get('/headline/:categoryId([0-9]+)', async (req, res) =>
      await get_headline(browser, req.params.categoryId).then(headlines => {
        headlines.forEach(h => res.write(`${JSON.stringify(h)}\n`));
        res.status(200).end();
      })
        .catch(r => res.status(500).send(r).end()));

  router.get(/\/comments\/(.+)/, async (req, res) =>
    await get_comments(browser, req.params[0])
      .then(comments => {
        comments.forEach(c => res.write(`${JSON.stringify(c)}\n`));
        return res.status(200).end();
      })
      .catch(r => res.status(500).send(r).end()));

  return router;
}
