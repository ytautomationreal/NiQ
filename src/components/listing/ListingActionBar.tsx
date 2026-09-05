import React from 'react';
import { ListMusic, Download } from 'lucide-react';
import { modalStore } from '../../utils/modalStore';

export const ListingActionBar: React.FC = () => {
  return (
    <div className="yt-native-btn-group my-2" role="toolbar" aria-label="NiQ Listing Tools">
      <button
        onClick={() => modalStore.open('listing')}
        className="yt-native-btn"
        title="Listing Tools & Batch Metadata Exporter"
      >
        <ListMusic size={16} strokeWidth={2} />
        <span>Listing Tools (Export & Analysis)</span>
      </button>
    </div>
  );
};
