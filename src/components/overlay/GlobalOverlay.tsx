import React, { useEffect, useState } from 'react';
import { modalStore, ModalType } from '../../utils/modalStore';
import { WatchVideoDetails, ToastNotification } from '../../types/niq';
import { TagsModal } from '../watch/TagsModal';
import { MetadataModal } from '../watch/MetadataModal';
import { ThumbnailModal } from '../watch/ThumbnailModal';
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

      {/* 4. Global Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => modalStore.dismissToast(id)}
      />
    </>
  );
};

export default GlobalOverlay;
