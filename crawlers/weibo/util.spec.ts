import {expect} from 'chai';
import {sanitize_timestring} from './util';

describe('util functions', () => {

  it('should parse 2018-3-4 19:30', () => {
    const ts: Date = sanitize_timestring('2018-3-4 19:30') as Date;
    expect(ts.toJSON()).to.be.eq(new Date(Date.parse('2018-3-4 19:30')).toJSON());
  });

  it('should parse 36 minutes ago', () => {
    const ts = sanitize_timestring('36分钟前') as Date;
    const now = new Date();
    now.setMinutes(now.getMinutes() - 36);
    expect(ts.getMinutes()).to.be.eq(now.getMinutes());
  });
});
