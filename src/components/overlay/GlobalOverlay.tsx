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
import { ToastContainer } from '../common/Toast';

export const GlobalOverlay: React.FC = () => {
  const [state, setState] = useState(modalStore.getState());

  useEffect(() => {
    return modalStore.subscribe(() => {
      setState(modalStore.getState());
    });
  }, []);

  const { activeModal, videoDetails, toasts } = state;

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

      {/* 11. Global Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => modalStore.dismissToast(id)}
      />
    </>
  );
};

export default GlobalOverlay;
