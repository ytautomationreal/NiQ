export interface SuggestedVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  channelUrl: string;
  channelAvatarUrl: string;
  views: number;
  viewsText: string;
  publishedTimeText: string;
  lengthText: string;
  thumbnailUrl: string;
  url: string;
}

export interface SuggestedState {
  videos: SuggestedVideoItem[];
  isModalOpen: boolean;
}
