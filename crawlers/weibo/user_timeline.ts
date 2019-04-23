import {ElementHandle, Page} from 'puppeteer';
import * as R from 'ramda';
import {extractUserId, normalizeTextContent, SimpleBrowser, writeFile} from './util';

export const feedListSelector = 'div.WB_feed[node-type="feed_list"] div[action-type="feed_list_item"]';
export const waitFor = {selector: feedListSelector, options: {timeout: 20000}};

export const parseUserTimelineElement = R.curry(async (page: Page, h: ElementHandle) => ({
  comment_count: parseInt(await h.$eval('.WB_handle li:nth-child(3) em:nth-child(2)', e => e.textContent) || '0'),
  device: await h.$eval('div.WB_from', e => {
    const anchors = e.querySelectorAll('a');
    return anchors.length > 1 ? anchors[1].textContent : 'web client';
  }),
  forward: {
    id: await page.evaluate((e: Element) =>
      e.getAttribute('isforward') === '1' ? e.getAttribute('omid') : undefined, h),
    is_forward: await page.evaluate((e: Element) => e.getAttribute('isforward') === '1', h),
  },
  forward_count: parseInt(await h.$eval('.WB_handle li:nth-child(2) em:nth-child(2)', e => e.textContent) || '0'),
  id: await page.evaluate((e: Element) => e.getAttribute('mid'), h),
  image_url: await h.$$eval('.media_box img', es => es.map(e => (e as HTMLImageElement).src)),
  like_count: parseInt(await h.$eval('.WB_handle li:nth-child(4) em:nth-child(2)', e => e.textContent) || '0'),
  text: normalizeTextContent(await h.$eval('div.WB_text', e => e.textContent)),
  timestamp: new Date(parseInt(await h.$eval('div.WB_from a', e => e.getAttribute('date')) || '0')),
  url: await h.$eval('div.WB_from a', e => (e as HTMLAnchorElement).href.split('?')[0]),
  user: {
    display_name: await h.$eval('div.WB_info a', e => (e as HTMLAnchorElement).textContent),
    id: await extractUserId(page, h),
    url: (await h.$eval('div.WB_info a', e => (e as HTMLAnchorElement).href)).split('?')[0],
    verified: (await h.$('div.WB_info a > i.icon_approve_gold')) != null,
  },
}));

export async function get_user_timeline(browser: SimpleBrowser, userId: string) {
  const url = `https://weibo.com/${userId}`;
  const page = await browser.newPage(url, waitFor);
  const feedsHandlers = await page.$$(feedListSelector);
  const mapper = parseUserTimelineElement(page);

  // await page.screenshot({path: 'screen.png', fullPage: true});
  // await writeFile('user_timeline.html.data', await page.content());

  return await Promise.all(feedsHandlers.map(mapper))
    .then(async posts => {
      await page.close();
      return posts;
    })
    .catch(async r => {
      await page.close();
      throw r;
    });
}
