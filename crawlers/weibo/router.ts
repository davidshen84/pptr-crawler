import {NextFunction, Request, Response, Router} from 'express';
import * as url from 'url';
import {get_comments} from './comments';
import {get_headline} from './headline';
import {get_user_timeline} from './user_timeline';
import {SimpleBrowser} from './util';

function return_empty_array(res: Response, next: NextFunction) {
  res.status(200)
    .contentType('application/json')
    .send([])
    .end();
  return next();
}

export function buildRouter(browser: SimpleBrowser) {
  const router = Router();

  const reduceObjectArray = (arr: object[]) => arr
    .map(h => JSON.stringify(h))
    .reduce((p, v) => `${p}\n${v}`, '')
    .trim();

  router.get(/\/timeline\/(.+)/, async (req, res, next) =>
    await get_user_timeline(browser, req.params[0])
      .then(posts =>
        res.status(200).contentType('application/json')
          // .send(reduceObjectArray(posts))
          .send(posts)
          .end())
      .catch(reason => next(reason)));

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
    .get('/headline/:categoryId', async (req, res, next) =>
      await get_headline(browser, req.params.categoryId)
        .then(headlines =>
          res
            .status(200)
            .contentType('application/json')
            // .send(reduceObjectArray(headlines))
            .send(headlines)
            .end())
        .catch(reason => next(reason)));

  router.get(/\/comments\/(.+)/, async (req, res, next) =>
    await get_comments(browser, req.params[0])
      .then(comments =>
        res
          .status(200)
          .contentType('application/json')
          // .send(reduceObjectArray(comments))
          .send(comments)
          .end())
      .catch(reason => {
        console.error(reason);
        return_empty_array(res, next);
      }));

  router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (Boolean(err))
      console.error(err);
    res.status(500).end();
  });

  return router;
}
