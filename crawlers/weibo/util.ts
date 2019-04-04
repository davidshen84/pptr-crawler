import fs from 'fs';
import {ElementHandle, Page} from 'puppeteer';
import {promisify} from 'util';
import {IPost} from './types';

export const writeFile = promisify(fs.writeFile);
export const whitelist = ['document', 'script', 'xhr', 'fetch'];

/**
 * Try to guess and convert a date time display string to a {Date}.
 *
 * @param {string} timestring The display date time string.
 * @return {Date} The converted {Date} object, or the '<no date>' literal.
 */
export function sanitize_timestring(timestring: string | null) {
  let date: Date | string = '<no date>';
  if (!timestring)
    return date;

  timestring = timestring || '';
  const localTime = new Date();

  const p1 = /今天 (\d{2}):(\d{2})/u;
  const m1 = p1.exec(timestring);

  if (m1)
    date = new Date(localTime.getFullYear(), localTime.getMonth(), localTime.getDate(),
      parseInt(m1[1]), parseInt(m1[2]));
  else {
    const p2 = /(\d{1,2})月(\d{1,2})日 (\d{2}):(\d{2})/u;
    const m2 = p2.exec(timestring);
    if (m2)
      date = new Date(localTime.getFullYear(), parseInt(m2[1]) - 1, parseInt(m2[2]), parseInt(m2[3]), parseInt(m2[4]));
  }

  return date;
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
