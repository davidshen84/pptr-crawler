import {expect} from 'chai';
import {ElementHandle} from 'puppeteer';
import {feedListSelector, parseUserTimelineElement, waitFor} from './user_timeline';
import {SimpleBrowser} from './util';

describe('get user timeline', () => {
  const browser = new SimpleBrowser();

  it('works', async () => {
    const url = `file:///${process.cwd()}/test/data/user_timeline.html`;
    const page = await browser.newPage(url, waitFor);
    const elementHandle = await page.$(feedListSelector) as ElementHandle;
    const result = await parseUserTimelineElement(page, elementHandle);

    expect(result).to.be.ok;
    expect(result.id).to.eq('4348437758136041');
    expect(result.comment_count).to.eq(229649);
    expect(result.device).to.eq('web client');
    expect(result.forward).to.be.ok;
    expect(result.forward.is_forward).to.be.false;
    expect(result.forward_count).to.eq(649965);
    expect(result.image_url).to.have.length(3);
    expect(result.like_count).to.eq(360690);
    expect(result.text).to.contain('祝福收到');
    expect(result.timestamp.toISOString()).to.eq(new Date('2019-03-10T15:30:14.000Z').toISOString());
    expect(result.url).to.contain('1304194202/Hkk5py8yt');
    expect(result.user).to.be.ok;

    const user = result.user;
    expect(user.id).to.eq('1304194202');
    expect(user.url).to.contain('shishi310');
    expect(user.display_name).to.contain('刘诗诗');
    expect(user.verified).to.be.true;
  }).timeout(50000);

  after(async () => await browser.close());

});
