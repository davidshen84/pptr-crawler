import {expect} from 'chai';
import {ElementHandle} from 'puppeteer';
import {headlineSelector, parseHeadlineElement, waitFor as waitForHeadline} from './headline';
import {feedListSelector, parseUserTimelineElement, waitFor as waitForTimeline} from './user_timeline';
import {SimpleBrowser} from './util';

describe('HTML element parser.', () => {
  const browser = new SimpleBrowser();

  it('should parse user timeline.', async () => {
    const url = `file:///${process.cwd()}/test/data/user_timeline.html`;
    const page = await browser.newPage(url, waitForTimeline);
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

  it('should parse headline metadata', async () => {
    const url = `file:///${process.cwd()}/test/data/headline.html`;
    const page = await browser.newPage(url, waitForHeadline);
    const elementHandle = await page.$(headlineSelector) as ElementHandle;
    const result = await parseHeadlineElement(page, elementHandle);

    expect(result).to.be.ok;
    expect(result.comment_count).to.be.eq(0);
    expect(result.forward_count).to.be.eq(0);
    expect(result.id).to.be.eq('4362880381890803');
    expect(result.image_url).to.be.an('array').and.to.have.length(1);
    expect(result.like_count).to.be.eq(0);
    expect((result.timestamp as Date).toTimeString()).eq(new Date('2019-04-19T12:00:00.000Z').toTimeString());
    expect(result.title).to.be.contain('#吃吃喝喝在北美#【李鸿章杂碎、左宗棠鸡、芝士云吞：美国人眼中那些好吃到不行的“中国菜”】');
    expect(result.url).to.be.eq('//weibo.com/5734938853/HqnNY7VSP');
    expect(result.user).to.be.an('object');

    const user = result.user;
    expect(user.display_name).to.be.eq('吃吃喝喝玩遍北美');
    expect(user.image_url).to.be
      .eq('https://tva3.sinaimg.cn/crop.81.0.340.340.50/006g7dzLjw8exfadzpq8dj30dw09gq55.jpg');
    expect(user.url).to.be.eq('file:///wanbianbeimei');
  }).timeout(50000);

  after(async () => await browser.close());

});
