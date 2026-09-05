export interface ChannelDetails {
  channelId: string;
  title: string;
  handle: string;
  subscriberCountText: string;
  videoCountText: string;
  viewCountText?: string;
  joinedDateText?: string;
  country?: string;
  description: string;
  keywords: string[];
  avatarUrl: string;
  bannerUrl: string;
  socialLinks: { title: string; url: string }[];
  isVerified: boolean;
}

export interface ChannelVideoItem {
  videoId: string;
  title: string;
  views: number;
  viewCountText: string;
  publishedTimeText: string;
  lengthText: string;
  thumbnailUrl: string;
  url: string;
  viralRatio: number;
  isOutlier: boolean;
}

export interface ChannelOutlierStats {
  totalVideos: number;
  medianViews: number;
  averageViews: number;
  outlierCount: number;
  maxViralRatio: number;
}
