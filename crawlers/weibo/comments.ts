import {normalizeTextContent, SimpleBrowser} from './util';

const feedSelector = 'div.WB_feed[node-type=feed_list] div[tbinfo]';
const commentsSelector = 'div.WB_feed div[node-type=comment_list] > div[comment_id]';

export async function get_comments(browser: SimpleBrowser, postId: string = '1860563805/Hhm7u5f61') {
  const url = `https://weibo.com/${postId}`;
  const page = await browser.newPage(url, {selector: commentsSelector, options: {timeout: 50000}});
  const feedHandler = await page.$(feedSelector);
  const commentsHandler = await page.$$(commentsSelector);
  const feedId = await page.evaluate((e: Element) => e.getAttribute('mid'), feedHandler);

  return await Promise.all(
    await commentsHandler.map(async h => ({
      commentId: await page.evaluate((e: Element) => e.getAttribute('comment_id'), h),
      feedId,
      text: normalizeTextContent(await h.$eval('.WB_text', e => e.textContent)),
      user: {
        ...(await h.$eval('.WB_face img', e => ({
          display_name: e.getAttribute('alt'),
          image_url: e.getAttribute('src'),
        }))),
        ...(await h.$eval('.WB_text a', e => ({
          id: (e.getAttribute('usercard') || '=').split('=')[1],
          url: e.getAttribute('href'),
        }))),
      },
    })))
    .then(async comments => {
      await page.close();
      return comments;
    })
    .catch(async r => {
      await page.close();
      throw r;
    });
}
