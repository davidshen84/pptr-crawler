import {expect} from 'chai';
import {ElementHandle, Page} from 'puppeteer';
import {commentsSelector, parseCommentElement, waitFor as waitForComments} from './comments';
import {headlineSelector, parseHeadlineElement, waitFor as waitForHeadline} from './headline';
import {feedListSelector, parseUserTimelineElement, waitFor as waitForTimeline} from './user_timeline';
import {SimpleBrowser} from './util';

describe('HTML element parser', () => {
  const browser = new SimpleBrowser();

  async function getResult<T>(filename: string, waitFor: any, selector: string,
                              parser: (page: Page, handle: ElementHandle) => Promise<T>) {
    const url = `file:///${process.cwd()}/test/data/${filename}`;
    const page = await browser.newPage(url, waitFor);
    const elementHandle = await page.$(selector) as ElementHandle;

    return await parser(page, elementHandle);
  }

  it('should parse user timeline', async () => {
    const result = await getResult('user_timeline.html', waitForTimeline, feedListSelector, parseUserTimelineElement);

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
    const result = await getResult('headline.html', waitForHeadline, headlineSelector, parseHeadlineElement);

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

  it('should parse comment', async () => {
    const result = await getResult('comments.html', waitForComments, commentsSelector, parseCommentElement('feed id'));
    expect(result).to.be.ok;
    expect(result.commentId).to.eq('4363127539648056');
    expect(result.user).to.be.ok;
    expect(result.feedId).to.eq('feed id');
    expect(result.text).to.contain('耿墨池是你的粉丝');

    const user = result.user;
    expect(user.display_name).to.eq('佟大为');
    expect(user.url).to.contain('tongdawei');
    expect(user.id).to.eq('1195210033');
    expect(user.image_url).to.eq('//tva4.sinaimg.cn/crop.0.0.640.640.50/473d7531jw8ex239o77eaj20hs0hsab8.jpg');
  });

  after(async () => await browser.close());

});
