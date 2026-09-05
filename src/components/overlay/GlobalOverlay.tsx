import React, { useEffect, useState } from 'react';
import { modalStore, ModalType } from '../../utils/modalStore';
import { WatchVideoDetails, ToastNotification } from '../../types/niq';
import { TagsModal } from '../watch/TagsModal';
import { MetadataModal } from '../watch/MetadataModal';
import { ThumbnailModal } from '../watch/ThumbnailModal';
import { TranscriptModal } from '../watch/TranscriptModal';
import { CommentsModal } from '../watch/CommentsModal';
import { FrameExtractorModal } from '../watch/FrameExtractorModal';
import { SceneRecorderModal } from '../watch/SceneRecorderModal';
import { CropRecorderModal } from '../watch/CropRecorderModal';
import { StoryboardModal } from '../watch/StoryboardModal';
import { AdMarkersOverlay } from '../watch/AdMarkersOverlay';
import { ChannelIntelModal } from '../channel/ChannelIntelModal';
import { ChannelOutliersModal } from '../channel/ChannelOutliersModal';
import { ChannelThumbnailsModal } from '../channel/ChannelThumbnailsModal';
import { FeedOverviewModal } from '../feed/FeedOverviewModal';
import { ListingToolsModal } from '../listing/ListingToolsModal';
import { SuggestedVideosModal } from '../watch/SuggestedVideosModal';
import { channelStore } from '../../utils/channelStore';
import { feedStore } from '../../utils/feedStore';
import { suggestedStore } from '../../utils/suggestedStore';
import { ToastContainer } from '../common/Toast';

export const GlobalOverlay: React.FC = () => {
  const [state, setState] = useState(modalStore.getState());
  const [channelState, setChannelState] = useState(channelStore.getState());
  const [feedState, setFeedState] = useState(feedStore.getState());
  const [suggestedState, setSuggestedState] = useState(suggestedStore.getState());

  useEffect(() => {
    const unsubModal = modalStore.subscribe(() => {
      setState(modalStore.getState());
    });
    const unsubChannel = channelStore.subscribe(() => {
      setChannelState(channelStore.getState());
    });
    const unsubFeed = feedStore.subscribe(() => {
      setFeedState(feedStore.getState());
    });
    const unsubSuggested = suggestedStore.subscribe(() => {
      setSuggestedState(suggestedStore.getState());
    });
    return () => {
      unsubModal();
      unsubChannel();
      unsubFeed();
      unsubSuggested();
    };
  }, []);

  const { activeModal, videoDetails, toasts } = state;
  const {
    activeModal: activeChannelModal,
    channelDetails,
    videos: channelVideos,
    outlierStats,
  } = channelState;

  return (
    <>
      {/* 1. Tags Modal */}
      {videoDetails && (
        <TagsModal
          isOpen={activeModal === 'tags'}
          onClose={() => modalStore.close()}
          tags={videoDetails.tags}
          videoTitle={videoDetails.title}
          onNotify={(msg) => modalStore.notify(msg)}
        />
      )}

      {/* 2. Metadata Modal */}
      {videoDetails && (
        <MetadataModal
          isOpen={activeModal === 'metadata'}
          onClose={() => modalStore.close()}
          details={videoDetails}
          onNotify={(msg) => modalStore.notify(msg)}
        />
      )}

      {/* 3. Thumbnail Modal */}
      {videoDetails && (
        <ThumbnailModal
          isOpen={activeModal === 'thumbnails'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          onNotify={(msg) => modalStore.notify(msg)}
        />
      )}

      {/* 4. Transcript Studio Modal */}
      {videoDetails && (
        <TranscriptModal
          isOpen={activeModal === 'transcript'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          captionsList={videoDetails.captionsList || []}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 5. Comments Extractor Modal */}
      {videoDetails && (
        <CommentsModal
          isOpen={activeModal === 'comments'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 6. Scene Frame Extractor Modal */}
      {videoDetails && (
        <FrameExtractorModal
          isOpen={activeModal === 'frames'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          videoLength={videoDetails.lengthSeconds}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 7. Video Scene Recorder Modal */}
      {videoDetails && (
        <SceneRecorderModal
          isOpen={activeModal === 'recorder'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 8. Crop Recorder Modal */}
      {videoDetails && (
        <CropRecorderModal
          isOpen={activeModal === 'crop'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 9. Storyboard Filmstrip Modal */}
      {videoDetails && (
        <StoryboardModal
          isOpen={activeModal === 'storyboard'}
          onClose={() => modalStore.close()}
          videoId={videoDetails.videoId}
          videoTitle={videoDetails.title}
          storyboardsSpec={videoDetails.storyboards}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 10. Ad Placement Markers on Scrubber */}
      {videoDetails && (
        <AdMarkersOverlay
          adPlacements={videoDetails.adPlacements}
          videoLength={videoDetails.lengthSeconds}
        />
      )}

      {/* 11. Channel Intel Modal */}
      {channelDetails && (
        <ChannelIntelModal
          isOpen={activeChannelModal === 'channel-intel'}
          onClose={() => channelStore.close()}
          details={channelDetails}
          onNotify={(msg, type) => modalStore.notify(msg, type)}
        />
      )}

      {/* 12. Channel Outliers Modal */}
      <ChannelOutliersModal
        isOpen={activeChannelModal === 'channel-outliers'}
        onClose={() => channelStore.close()}
        channelTitle={channelDetails?.title || 'Channel'}
        videos={channelVideos}
        stats={outlierStats}
        onNotify={(msg, type) => modalStore.notify(msg, type)}
      />

      {/* 13. Channel Thumbnails Modal */}
      <ChannelThumbnailsModal
        isOpen={activeChannelModal === 'channel-thumbnails'}
        onClose={() => channelStore.close()}
        channelTitle={channelDetails?.title || 'Channel'}
        videos={channelVideos}
        onNotify={(msg, type) => modalStore.notify(msg, type)}
      />

      {/* 14. Feed Overview Modal */}
      <FeedOverviewModal
        isOpen={feedState.isModalOpen}
        onClose={() => feedStore.closeModal()}
        videos={feedState.videos}
        onNotify={(msg, type) => modalStore.notify(msg, type)}
      />

      {/* 15. Listing Page Tools Modal */}
      <ListingToolsModal
        isOpen={activeModal === 'listing'}
        onClose={() => modalStore.close()}
        onNotify={(msg, type) => modalStore.notify(msg, type)}
      />

      {/* 16. Suggested Videos Modal */}
      <SuggestedVideosModal
        isOpen={suggestedState.isModalOpen}
        onClose={() => suggestedStore.closeModal()}
        videos={suggestedState.videos}
        onNotify={(msg, type) => modalStore.notify(msg, type)}
      />

      {/* 17. Global Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => modalStore.dismissToast(id)}
      />
    </>
  );
};

export default GlobalOverlay;
