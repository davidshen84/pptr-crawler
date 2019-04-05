import express from 'express';
import * as url from 'url';
import {get_comments} from './comments';
import {get_headline} from './headline';
import {get_user_timeline} from './user_timeline';
import {SimpleBrowser} from './util';

export const router = express.Router();
export const browser = new SimpleBrowser();
const launched = browser.launch();

router.get(/\/timeline\/(.+)/, async (req, res) => {
  await launched;
  const posts = await get_user_timeline(browser, req.params[0]);
  posts.forEach(p => res.write(`${JSON.stringify(p)}\n`));
  return res.status(200).end();
});

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
  .get('/headline/:categoryId([0-9]+)', async (req, res) => {
    await launched;
    const headlines = await get_headline(browser, req.params.categoryId);
    headlines.forEach(h => res.write(`${JSON.stringify(h)}\n`));
    res.status(200).end();
  });

router.get(/\/comments\/(.+)/, async (req, res) => {
  await launched;
  const comments = await get_comments(browser, req.params[0]);
  comments.forEach(c => res.write(`${JSON.stringify(c)}\n`));
  return res.status(200).end();
});
