import fs from 'fs';
import {ElementHandle, Page} from 'puppeteer';
import {promisify} from 'util';

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

export function removeQueryString(url: string) {
  return url.split('?')[0];
}
