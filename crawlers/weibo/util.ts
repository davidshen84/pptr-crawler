import fs from 'fs';
import {Browser, ElementHandle, launch, Page, WaitForSelectorOptions} from 'puppeteer';
import {promisify} from 'util';
import {IPost} from './types';

export const writeFile = promisify(fs.writeFile);

/**
 * Try to guess and convert a date time display string to a {Date}.
 *
 * @param {string} timestring The display date time string.
 * @return {Date} The converted {Date} object, or the '<no date>' literal.
 */
export function sanitize_timestring(timestring: string | null) {
  if (!timestring)
    return '';

  if (!isNaN(Date.parse(timestring)))
    return new Date(Date.parse(timestring));

  const localTime = new Date();

  const regexToday = /今天 (\d{2}):(\d{2})/u;
  const matchToday = regexToday.exec(timestring);

  if (matchToday)
    return new Date(localTime.getFullYear(), localTime.getMonth(), localTime.getDate(),
      parseInt(matchToday[1]), parseInt(matchToday[2]));

  const regexThisYear = /(\d{1,2})月(\d{1,2})日 (\d{2}):(\d{2})/u;
  const matchThisYear = regexThisYear.exec(timestring);
  if (matchThisYear) {
    const now = new Date();
    return new Date(now.getFullYear(), parseInt(matchThisYear[1]) - 1, parseInt(matchThisYear[2]),
      parseInt(matchThisYear[3]), parseInt(matchThisYear[4]));
  }

  const regexMinutesAgo = /\d{1,2}分钟前/u;
  const matchMinutesAgo = regexMinutesAgo.exec(timestring);
  if (matchMinutesAgo) {
    const minutesDiff = parseInt(matchMinutesAgo[0]);
    const now = new Date();
    now.setMinutes(now.getMinutes() - minutesDiff);
    return now;
  }

  return timestring;
}

export async function writePosts(posts: IPost[], path: string = 'posts.txt') {
  const data = posts.map(v => JSON.stringify(v))
    .reverse()
    .reduce((a, v) => `${v}\n${a}`, '')
    .trim();
  return await writeFile(path, data, {flag: 'w'});
}

export function normalizeTextContent(s: string | null) {
  return (s || '').replace(/[ \n\t]+/g, ' ');
}

export async function extractUserId(page: Page, h: ElementHandle): Promise<string> {
  const tbinfo = await page.evaluate((e: Element) => e.getAttribute('tbinfo'), h);
  if (tbinfo === null)
    return '';

  const matches = /ouid=(\d+).*/i.exec(tbinfo);
  if (matches && matches.length > 1)
    return matches[1];

  return '';
}

export class SimpleBrowser {

  private readonly promiseBrowser: Promise<Browser>;

  constructor() {
    this.promiseBrowser = launch({
      args: [
        '--no-sandbox',
        '--incognito',
        '--proxy-server=socks5://127.0.0.1:1080',
      ],
      headless: false,
      ignoreHTTPSErrors: true,
    })
      .then(browser =>
        browser.on('disconnected', () =>
          console.log('Puppeteer disconnected from the browser process.')));
  }

  public async newPage(url: string, waitFor?: { selector: string, options: WaitForSelectorOptions }) {
    const whitelist = ['document', 'script', 'xhr', 'fetch'];
    const browser = await this.promiseBrowser;
    const page = await browser.newPage();

    await page.on('request', r => !whitelist.includes(r.resourceType()) ? r.abort() : r.continue())
      .setRequestInterception(true);
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    if (waitFor)
      await page.waitForSelector(waitFor.selector, waitFor.options);

    return page;
  }

  public async close() {
    const browser = await this.promiseBrowser;
    await browser.close();
  }
}

export function removeQueryString(url: string) {
  return url.split('?')[0];
}
