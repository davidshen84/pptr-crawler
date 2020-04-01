import {WaitForSelectorOptions} from 'puppeteer';

export interface IUser {
  id: string;
  url: string;
  display_name: string;
  image_url: string;
  verified: boolean;
}

export interface IPost {
  id: string;
  title: string;
  url: string;
  timestamp: Date | string;
  image_url: string[];
  user: IUser;
  text: string;
  device: string;
  like_count: number;
  comment_count: number;
  forward_count: number;
  forward: {
    is_forward: boolean;
    id: string;
  };
}

export interface IComment {
  feedId: string;
  commentId: string;
  text: string;
  user: IUser;
}

export interface IWaitForOptions {
  selector: string;
  options: WaitForSelectorOptions;
}
