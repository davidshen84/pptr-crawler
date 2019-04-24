import {ElementHandle, Page} from 'puppeteer';
import * as R from 'ramda';
import {normalizeTextContent, removeQueryString, sanitize_timestring, SimpleBrowser, writeFile} from './util';

export const selector = '#plc_main .UG_contents .UG_list_a,.UG_list_b';
export const waitFor = {selector, options: {timeout: 10000}};

export const parseHeadlineElement = R.curry(async (page: Page, handle: ElementHandle) => {
  const counts: number[] = await handle.$$eval('.subinfo_box .subinfo_rgt', elements =>
    elements.map(e => (e.querySelector('em:nth-child(2)') || {textContent: '0'}).textContent)
      .map(s => parseInt(s || '0')),
  );

  return {
    comment_count: counts[1],
    forward_count: counts[2],
    id: await page.evaluate((e: Element) => e.getAttribute('mid'), handle),
    image_url: await handle.$$eval('div.pic img', es => es.map(e => (e as HTMLImageElement).src)),
    like_count: counts[0],
    timestamp: sanitize_timestring(await handle.$eval('div.subinfo_box > span.subinfo.S_txt2', e => e.textContent)),
    title: normalizeTextContent(await handle.$eval('h3.list_title_s', e => e.textContent)),
    url: await page.evaluate((e: Element) => e.getAttribute('href') || '', handle).then(removeQueryString),
    user: {
      display_name: await handle.$eval('div.subinfo_box a:nth-child(2)', e => e.textContent),
      image_url: await handle.$eval('div.subinfo_box a img', e => (e as HTMLImageElement).src),
      url: await handle.$eval('div.subinfo_box a', e => (e as HTMLAnchorElement).href).then(removeQueryString),
    },
  };
});

export async function get_headline(browser: SimpleBrowser, category: string, loop: number = 0) {
  const url = `https://weibo.com/?category=${category}`;
  const page = await browser.newPage(url, waitFor);

  while (loop-- > 0) {
    await page.$eval('.W_loading', element => {
      element.scrollIntoView();
    });

    await page.waitForResponse(res => {
      return !!/https:\/\/weibo\.com\/a\/aj\/transform\/loadingmoreunlogin\?.*/i.exec(res.url());
    });
    await page.waitFor(15000);
  }

  const headlineHandles = await page.$$(selector);
  const mapper = parseHeadlineElement(page);
  // await writeFile('headline.html.data', await page.content());
  // await page.screenshot({path: 'screen.png', fullPage: true});

  return await Promise.all(headlineHandles.map(mapper))
    .then(async result => {
      await page.close();
      return result;
    }, async r => {
      await page.close();
      throw r;
    });
}
