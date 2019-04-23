import {ElementHandle, Page} from 'puppeteer';
import * as R from 'ramda';
import {normalizeTextContent, SimpleBrowser, writeFile} from './util';

const feedSelector = 'div.WB_feed[node-type=feed_list] div[tbinfo]';
export const commentsSelector = 'div.WB_feed div[node-type=comment_list] > div[comment_id]';

export const parseCommentElement = R.curry(async (feedId: string, page: Page, handle: ElementHandle) => {
  return ({
    commentId: await page.evaluate((e: Element) => e.getAttribute('comment_id'), handle),
    feedId,
    text: normalizeTextContent(await handle.$eval('.WB_text', e => e.textContent)),
    user: {
      ...(await handle.$eval('.WB_face img', e => ({
        display_name: e.getAttribute('alt'),
        image_url: e.getAttribute('src'),
      }))),
      ...(await handle.$eval('.WB_text a', e => ({
        id: (e.getAttribute('usercard') || '=').split('=')[1],
        url: e.getAttribute('href'),
      }))),
    },
  });
});

export const waitFor = {selector: commentsSelector, options: {timeout: 50000}};

export async function get_comments(browser: SimpleBrowser, postId: string = '1860563805/Hhm7u5f61') {
  const url = `https://weibo.com/${postId}`;
  const page = await browser.newPage(url, waitFor);
  const feedHandler = await page.$(feedSelector);
  const commentsHandler = await page.$$(commentsSelector);
  const feedId = await page.evaluate((e: Element) => e.getAttribute('mid'), feedHandler) as string;
  const mapper = parseCommentElement(feedId, page);

  // await writeFile('comments.html', await page.content());

  return await Promise.all(commentsHandler.map(mapper))
    .then(async comments => {
      await page.close();
      return comments;
    })
    .catch(async r => {
      await page.close();
      throw r;
    });
}
