export interface FeedVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  channelHandle?: string;
  channelUrl?: string;
  channelAvatarUrl?: string;
  views: number;
  viewsText: string;
  publishedTimeText: string;
  lengthText: string;
  thumbnailUrl: string;
  url: string;
}

export interface FeedFilterOptions {
  duration: 'all' | 'short' | 'medium' | 'long';
  minViews: number;
  sortBy: 'views' | 'newest' | 'duration' | 'default';
  searchQuery: string;
}
