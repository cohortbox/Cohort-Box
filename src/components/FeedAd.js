import './FeedAd.css';
import { useEffect } from 'react';

function FeedAd() {
  useEffect(() => {
    // Load the AdSense script if it’s not already loaded
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      try {
        window.adsbygoogle.push({});
      } catch (e) {
        console.log('AdSense push error:', e);
      }
    }
  }, []);

  return (
    <div className="feed-ad-container">
      <p className="feed-ad-label">Sponsored</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-fg+5n+6t-e7+az"
        data-ad-client="ca-pub-xxxxxxxxxxxxxxx"  
        data-ad-slot="1234567890" 
      ></ins>
    </div>
  );
}

export default FeedAd;
