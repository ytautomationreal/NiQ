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

export interface CaptionTrack {
  languageCode: string;
  name: string;
  baseUrl: string;
}

export interface WatchVideoDetails {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  views: number;
  lengthSeconds: number;
  publishDate: string;
  category: string;
  tags: string[];
  description: string;
  isLive: boolean;
  captionsAvailable: boolean;
  captionsList: CaptionTrack[];
  storyboards: string;
  adPlacements: any[];
  currentTime: number;
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

export interface ToastNotification {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}
