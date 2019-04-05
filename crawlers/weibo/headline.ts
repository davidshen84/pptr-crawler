import {IPost, IUser} from './types';
import {normalizeTextContent, sanitize_timestring, SimpleBrowser} from './util';

export async function get_headline(browser: SimpleBrowser, category: string, loop: number = 0) {
  const url = `https://weibo.com/?category=${category}`;
  const page = await browser.newPage(url, {selector: '.W_loading', options: {timeout: 10000}});

  while (loop-- > 0) {
    await page.$eval('.W_loading', element => {
      element.scrollIntoView();
    });

    await page.waitForResponse(res => {
      return !!/https:\/\/weibo\.com\/a\/aj\/transform\/loadingmoreunlogin\?.*/i.exec(res.url());
    });
    await page.waitFor(15000);
  }

  const headlineHandles = await page.$$('#plc_main .UG_contents .UG_list_b');
  const headlines = await Promise.all(
    headlineHandles.map(async h => {
      const counts: number[] = await h.$$eval('.subinfo_box .subinfo_rgt', elements =>
        elements.map(e => (e.querySelector('em:nth-child(2)') || {textContent: '0'}).textContent)
          .map(s => parseInt(s || '0')),
      );

      return {
        comment_count: counts[1],
        forward_count: counts[2],
        id: await page.evaluate((e: Element) => e.getAttribute('mid'), h),
        image_url: await h.$$eval('img', es => es.map(e => (e as HTMLImageElement).src)),
        like_count: counts[0],
        timestamp: sanitize_timestring(await h.$eval('div.subinfo_box > span.subinfo.S_txt2', e => e.textContent)),
        title: normalizeTextContent(await h.$eval('h3.list_title_b', e => e.textContent)),
        url: await page.evaluate((e: Element) => e.getAttribute('href'), h),
        user: {
          display_name: await h.$eval('div.list_des > div.subinfo_box a:nth-child(2)', e => e.textContent),
          image_url: await h.$eval('div.list_des > div.subinfo_box a img', e => (e as HTMLImageElement).src),
          url: await h.$eval('div.list_des > div.subinfo_box a', e => (e as HTMLAnchorElement).href),
        } as IUser,
      } as IPost;
    }));

  // await writePosts(headlines, 'headline.txt');
  // await page.screenshot({path: 'screen.png', fullPage: true});
  // await writeFile('headline.html', await page.content());
  await page.close();
  return headlines;
}
