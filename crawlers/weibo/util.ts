import fs from 'fs';
import {Browser, ElementHandle, launch, Page, Request, Response} from 'puppeteer';
import {promisify} from 'util';
import {IWaitForOptions} from './types';

export const writeFile = promisify(fs.writeFile);

/** Try to guess and convert a date time display string to a {Date}.
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

/** Remove empty spaces from a string.
 */
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

/**
 * todo: delete this method
 * @param page
 * @param response
 */
async function debug_page(page: Page, response: Response | null) {
  const ts = Date.now();
  await page.screenshot({path: `debug-${ts}.png`});
  if (response)
    console.debug({
      status: response.status(),
      statusText: response.statusText(),
    });
  return writeFile(`debug-${ts}.html`, await page.content());
}

export class SimpleBrowser {

  private readonly promiseBrowser: Promise<Browser>;
  private readonly hostnameRegEx = /.*:\/\/([a-z0-9.]+).*/i;
  private resourceWhitelist = ['document', 'script', 'xhr', 'fetch'];
  private hostnameWhitelist = ['sina', 'weibo'];

  constructor(private enableJS = true) {
    this.promiseBrowser = launch({
      args: [
        '--no-sandbox',
        '--incognito',
        // '--proxy-server=socks5://127.0.0.1:1080',
      ],
      headless: true,
      ignoreHTTPSErrors: true,
    })
      .then(browser =>
        browser.on('disconnected', () =>
          console.log('Puppeteer disconnected from the browser process.')))
    /*
          .then(async browser => {
            console.log((await browser.userAgent()));
            return browser;
          });
    */
    ;
  }

  public async newPage(url: string, waitFor?: IWaitForOptions): Promise<Page | undefined> {
    const browser = await this.promiseBrowser;
    const page = await browser.newPage();

    await page.setJavaScriptEnabled(this.enableJS);
    await page.on('request', r => {
      // tslint:disable-next-line:curly
      if (this.notInResourceWhitelist(r)) {
        // console.debug(`Not in resource whitelist: ${r.resourceType()}`);
        return r.abort();
      }

      const hostnameMatches = this.hostnameRegEx.exec(r.url()) as RegExpMatchArray;
      const hostname = hostnameMatches ? hostnameMatches[1] : null;
      // tslint:disable-next-line:curly
      if (hostname && this.notInHostnameWhitelist(hostname)) {
        // console.debug(`Not in hostname whitelist: ${hostname}`);
        return r.abort();
      }

      return r.continue();
    })
      .setRequestInterception(true)
    ;

    const response = await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (!Boolean(response) || response?.status() !== 200) {
      console.error(`Failed to load the page: ${url}`);
      console.error(response?.statusText());

      return undefined;
    }
    if (waitFor)
      await page.waitForSelector(waitFor.selector, waitFor.options)
        .catch(async reason => {
          console.warn({
            message: reason.message,
            name: reason.name,
          });
          await debug_page(page, response);
          await page.close();
          throw new Error(reason.message);
        });

    return page;
  }

  public async close() {
    const browser = await this.promiseBrowser;
    await browser.close();
  }

  private notInHostnameWhitelist(hostname: string) {
    return !this.hostnameWhitelist
      .map(d => hostname.indexOf(d) > -1)
      .reduce((p, v) => p || v, false);
  }

  private notInResourceWhitelist(request: Request) {
    return !this.resourceWhitelist.includes(request.resourceType());
  }

}

export function removeQueryString(url: string) {
  return url.split('?')[0];
}
