import {expect} from 'chai';
import {ElementHandle} from 'puppeteer';
import {extractHeadline, headlineSelector, waitFor} from './weibo/headline';
import {SimpleBrowser} from './weibo/util';

describe('headline functions', () => {
  const browser = new SimpleBrowser();

  it('should extract headline metadata', async () => {
    const url = `file:///${process.cwd()}/test/data/headline.html`;
    const page = await browser.newPage(url, waitFor);
    const elementHandle = await page.$(headlineSelector) as ElementHandle;
    const result = await extractHeadline(page, elementHandle);

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
