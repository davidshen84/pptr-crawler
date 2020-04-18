import {ElementHandle, Page} from 'puppeteer';
import * as R from 'ramda';
import {SimpleBrowser} from '../browser';
import {IComment} from './types';
import {normalizeTextContent, sanitize_timestring} from './util';

export const selector = 'div.WB_feed div[node-type=comment_list] > div[comment_id]';
export const waitFor = {selector, options: {timeout: 20000}};
const feedSelector = 'div.WB_feed[node-type=feed_list] div[tbinfo]';

export const parseCommentElement = R.curry(async (feedId: string, page: Page, handle: ElementHandle) => {
  return ({
    commentId: await page.evaluate((e: Element) => e.getAttribute('comment_id'), handle),
    feedId,
    text: normalizeTextContent(await handle.$eval('.WB_text', e => e.textContent)),
    timestamp: sanitize_timestring(await handle.$eval('div.WB_from.S_txt2', e => e.textContent)),
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
  }) as IComment;
});

export async function get_comments(browser: SimpleBrowser, postId: string): Promise<IComment[]> {
  const url = `https://weibo.com/${postId}`;
  console.info(`Retrieving ${url}.`);
  const page = await browser.newPage(url, waitFor);

  try {
    if (page === undefined) return Promise.resolve([]);

    const feedHandler = await page.$(feedSelector);
    const commentsHandler = await page.$$(selector);
    const feedId = await page.evaluate((e: Element) => e.getAttribute('mid'), feedHandler) as string;
    const mapper = parseCommentElement(feedId, page);

    // await writeFile('comments.html', await page.content());

    return await Promise.all(commentsHandler.map(mapper));
  } catch (e) {
    console.error(e);

    return [] as IComment[];
  } finally {
    if (!page?.isClosed())
      await page?.close();
  }

}
