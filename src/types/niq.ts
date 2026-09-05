export interface NiqSettings {
  outlierDetector: boolean;
  hideShorts: boolean;
  commentTools: boolean;
  quickActionBar: boolean;
  hoverMetadata: boolean;
  transcriptTools: boolean;
  adMarkers: boolean;
  thumbnailDownloader: boolean;
  sceneExtractor: boolean;
  cropRecorder: boolean;
}

export const DEFAULT_SETTINGS: NiqSettings = {
  outlierDetector: true,
  hideShorts: false,
  commentTools: true,
  quickActionBar: true,
  hoverMetadata: true,
  transcriptTools: true,
  adMarkers: true,
  thumbnailDownloader: true,
  sceneExtractor: true,
  cropRecorder: true,
};

export interface VideoMetadata {
  id: string;
  url: string;
  title: string;
  channelTitle: string;
  channelId: string;
  channelHandle?: string;
  views: number;
  publishDate: string;
  exactUploadDate?: string;
  durationSeconds: number;
  durationFormatted: string;
  category?: string;
  tags: string[];
  description: string;
  isLive: boolean;
  thumbnails: {
    maxres?: string;
    hq?: string;
    mq?: string;
    default?: string;
  };
  captionsAvailable: boolean;
  adPlacements?: number[];
  storyboardUrl?: string;
}

export interface ChannelMetadata {
  id: string;
  title: string;
  handle: string;
  subscribers: string;
  subscribersCount?: number;
  videosCount: string;
  description: string;
  joinedDate?: string;
  tags: string[];
  bannerUrl?: string;
  avatarUrl?: string;
  medianViews?: number;
}

export type NiqBridgeMessageType =
  | 'NIQ_PAGE_DATA_UPDATE'
  | 'NIQ_PLAYER_RESPONSE'
  | 'NIQ_REQUEST_PLAYER_STATE'
  | 'NIQ_PLAYER_SEEK'
  | 'NIQ_AD_OFFSETS';

export interface NiqBridgeMessage<T = any> {
  source: 'NIQ_MAIN_WORLD' | 'NIQ_ISOLATED_WORLD';
  type: NiqBridgeMessageType;
  payload: T;
}
