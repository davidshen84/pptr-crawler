import {Browser, launch, Page, Request, Response} from 'puppeteer';
import {IWaitForOptions} from './weibo/types';
import {writeFile} from './weibo/util';

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

    if (waitFor) try {
      await page.waitForSelector(waitFor.selector, waitFor.options);
      return page;
    } catch (e) {
      await debug_page(page, response);
      await page.close();
      throw new Error(e);
    }

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
