import { defineUnlistedScript } from 'wxt/sandbox';
import { NiqBridgeMessage } from '../src/types/niq';

export default defineUnlistedScript(() => {
  console.log('[NiQ Injected] Main World bridge loaded.');

  function postToIsolated(type: NiqBridgeMessage['type'], payload: any) {
    window.postMessage(
      {
        source: 'NIQ_MAIN_WORLD',
        type,
        payload,
      } as NiqBridgeMessage,
      '*'
    );
  }

  function getMoviePlayer(): any {
    return (document.getElementById('movie_player') as any) || null;
  }

  function extractAndBroadcast() {
    try {
      const player = getMoviePlayer();
      const playerResponse =
        (window as any).ytInitialPlayerResponse ||
        (player?.getPlayerResponse ? player.getPlayerResponse() : null);
      const pageData = (window as any).ytInitialData || null;

      const videoDetails = playerResponse?.videoDetails || {};
      const microformat = playerResponse?.microformat?.playerMicroformatRenderer || {};
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const storyboards = playerResponse?.storyboards?.playerStoryboardSpecRenderer?.spec || '';
      const adPlacements = playerResponse?.adPlacements || [];

      // Extract current video ID from URL or details
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v') || videoDetails.videoId || '';

      if (videoId) {
        const payload = {
          videoId,
          title: videoDetails.title || document.title.replace(' - YouTube', '').trim(),
          channelTitle: videoDetails.author || microformat.ownerChannelName || '',
          channelId: videoDetails.channelId || microformat.externalChannelId || '',
          views: parseInt(videoDetails.viewCount || '0', 10),
          lengthSeconds: parseInt(videoDetails.lengthSeconds || '0', 10),
          publishDate: microformat.publishDate || microformat.uploadDate || '',
          category: microformat.category || '',
          tags: Array.isArray(videoDetails.keywords) ? videoDetails.keywords : [],
          description: videoDetails.shortDescription || '',
          isLive: Boolean(videoDetails.isLiveContent),
          captionsAvailable: captions.length > 0,
          captionsList: captions.map((c: any) => ({
            languageCode: c.languageCode,
            name: c.name?.simpleText || c.name?.runs?.[0]?.text || c.languageCode,
            baseUrl: c.baseUrl,
            isTranslatable: Boolean(c.isTranslatable),
          })),
          storyboards,
          adPlacements,
          currentTime: player?.getCurrentTime ? Math.floor(player.getCurrentTime()) : 0,
        };

        postToIsolated('NIQ_PLAYER_RESPONSE', payload);
      }

      if (pageData) {
        postToIsolated('NIQ_PAGE_DATA_UPDATE', {
          header: pageData.header,
          metadata: pageData.metadata,
        });
      }
    } catch (err) {
      console.warn('[NiQ Injected] Extraction warning:', err);
    }
  }

  // Watch for player navigation and DOM lifecycle updates
  // --- InnerTube Comment Extraction Engine ---
  let isCrawlerActive = false;
  let shouldStopCrawler = false;

  function parseLikeCount(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = val.toString().trim().replace(/,/g, '');
    if (str.endsWith('K') || str.endsWith('k')) return Math.round(parseFloat(str) * 1000);
    if (str.endsWith('M') || str.endsWith('m')) return Math.round(parseFloat(str) * 1000000);
    return parseInt(str, 10) || 0;
  }

  function getInnertubeKey(): string {
    return (
      (window as any).ytcfg?.get?.('INNERTUBE_API_KEY') ||
      (window as any).ytcfg?.data_?.INNERTUBE_API_KEY ||
      ''
    );
  }

  function getInnertubeContext(): any {
    return (
      (window as any).ytcfg?.get?.('INNERTUBE_CONTEXT') ||
      (window as any).ytcfg?.data_?.INNERTUBE_CONTEXT || {
        client: {
          clientName: 'WEB',
          clientVersion: (window as any).ytcfg?.get?.('INNERTUBE_CLIENT_VERSION') || '2.20240901.00.00',
        },
      }
    );
  }

  function parseSingleComment(renderer: any, isReply = false, parentId?: string): any {
    if (!renderer) return null;
    const commentId = renderer.commentId || '';
    const authorName =
      renderer.authorText?.simpleText ||
      renderer.authorText?.runs?.[0]?.text ||
      'Anonymous';
    const authorEndpoint = renderer.authorEndpoint?.browseEndpoint;
    const handle = authorEndpoint?.canonicalBaseUrl || '';
    const browseId = authorEndpoint?.browseId || '';
    const authorChannelUrl = handle
      ? `https://www.youtube.com${handle}`
      : browseId
      ? `https://www.youtube.com/channel/${browseId}`
      : '';
    const authorAvatarUrl = renderer.authorThumbnail?.thumbnails?.[0]?.url || '';
    const text = renderer.contentText?.runs
      ? renderer.contentText.runs.map((r: any) => r.text || '').join('')
      : renderer.contentText?.simpleText || '';
    const publishedTimeText =
      renderer.publishedTimeText?.runs?.[0]?.text ||
      renderer.publishedTimeText?.simpleText ||
      '';
    const likeCount = parseLikeCount(
      renderer.voteCount?.simpleText || renderer.voteCount?.runs?.[0]?.text || renderer.likeCount
    );
    const replyCount = typeof renderer.replyCount === 'number' ? renderer.replyCount : 0;

    return {
      id: commentId,
      authorName,
      authorHandle: handle,
      authorChannelUrl,
      authorAvatarUrl,
      text,
      publishedTimeText,
      likeCount,
      replyCount,
      isReply,
      parentId,
    };
  }

  function findInitialCommentsToken(ytData: any): string | null {
    try {
      const contents = ytData?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
      if (Array.isArray(contents)) {
        for (const c of contents) {
          const section = c.itemSectionRenderer;
          if (
            section &&
            (section.sectionIdentifier === 'comment-item-section' ||
              section.targetId === 'comments-section')
          ) {
            for (const item of section.contents || []) {
              const token =
                item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
              if (token) return token;
            }
          }
        }
      }
    } catch (e) {}
    return null;
  }

  async function fetchInnertubeNext(token: string, apiKey: string, context: any) {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${apiKey}&prettyPrint=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        continuation: token,
      }),
    });
    if (!response.ok) {
      throw new Error(`InnerTube request failed: ${response.status}`);
    }
    return await response.json();
  }

  async function fetchWatchNextForToken(videoId: string, apiKey: string, context: any) {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/next?key=${apiKey}&prettyPrint=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        videoId,
      }),
    });
    if (!response.ok) {
      throw new Error(`InnerTube watch next failed: ${response.status}`);
    }
    return await response.json();
  }

  async function runCommentCrawler(options: {
    videoId: string;
    maxComments: number;
    includeReplies: boolean;
  }) {
    if (isCrawlerActive) {
      console.warn('[NiQ Injected] Crawler already active.');
      return;
    }

    isCrawlerActive = true;
    shouldStopCrawler = false;

    const { videoId, maxComments = 200, includeReplies = true } = options;
    const apiKey = getInnertubeKey();
    const context = getInnertubeContext();

    if (!apiKey) {
      postToIsolated('NIQ_FETCH_COMMENTS_ERROR', { error: 'YouTube InnerTube API key not found.' });
      isCrawlerActive = false;
      return;
    }

    let token = findInitialCommentsToken((window as any).ytInitialData);

    if (!token && videoId) {
      try {
        const nextData = await fetchWatchNextForToken(videoId, apiKey, context);
        token = findInitialCommentsToken(nextData);
      } catch (err: any) {
        console.warn('[NiQ Injected] Failed to fetch initial comments token:', err);
      }
    }

    if (!token) {
      postToIsolated('NIQ_FETCH_COMMENTS_ERROR', {
        error: 'Comments are disabled or no comments found on this video.',
      });
      isCrawlerActive = false;
      return;
    }

    let totalCollected = 0;
    const limit = maxComments > 0 ? maxComments : Infinity;

    try {
      while (token && !shouldStopCrawler && totalCollected < limit) {
        const data = await fetchInnertubeNext(token, apiKey, context);
        const endpoints = data.onResponseReceivedEndpoints || [];
        let continuationItems: any[] = [];

        for (const ep of endpoints) {
          if (ep.reloadContinuationItemsCommand?.continuationItems) {
            continuationItems = ep.reloadContinuationItemsCommand.continuationItems;
            break;
          }
          if (ep.appendContinuationItemsAction?.continuationItems) {
            continuationItems = ep.appendContinuationItemsAction.continuationItems;
            break;
          }
        }

        if (continuationItems.length === 0) {
          break;
        }

        const batch: any[] = [];
        let nextToken: string | null = null;
        const replyTokensToFetch: { token: string; parentId: string }[] = [];

        for (const item of continuationItems) {
          if (item.commentThreadRenderer) {
            const commentObj = parseSingleComment(
              item.commentThreadRenderer.comment?.commentRenderer,
              false
            );
            if (commentObj) {
              batch.push(commentObj);
              totalCollected++;

              if (includeReplies && commentObj.replyCount > 0) {
                const replies = item.commentThreadRenderer.replies?.commentRepliesRenderer;
                const rContinuation = replies?.contents?.find((c: any) => c.continuationItemRenderer)
                  ?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
                if (rContinuation) {
                  replyTokensToFetch.push({
                    token: rContinuation,
                    parentId: commentObj.id,
                  });
                }
              }
            }
          } else if (item.continuationItemRenderer) {
            nextToken =
              item.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token || null;
          }

          if (totalCollected >= limit) break;
        }

        if (batch.length > 0) {
          postToIsolated('NIQ_FETCH_COMMENTS_PROGRESS', {
            comments: batch,
            totalCollected,
            isDone: false,
          });
        }

        if (includeReplies && replyTokensToFetch.length > 0 && !shouldStopCrawler && totalCollected < limit) {
          for (const rep of replyTokensToFetch) {
            if (shouldStopCrawler || totalCollected >= limit) break;
            try {
              let rToken: string | null = rep.token;
              while (rToken && !shouldStopCrawler && totalCollected < limit) {
                const rData = await fetchInnertubeNext(rToken, apiKey, context);
                const rEndpoints = rData.onResponseReceivedEndpoints || [];
                let rItems: any[] = [];
                for (const ep of rEndpoints) {
                  if (ep.appendContinuationItemsAction?.continuationItems) {
                    rItems = ep.appendContinuationItemsAction.continuationItems;
                    break;
                  }
                }
                const replyBatch: any[] = [];
                rToken = null;
                for (const rItem of rItems) {
                  if (rItem.commentRenderer) {
                    const rObj = parseSingleComment(rItem.commentRenderer, true, rep.parentId);
                    if (rObj) {
                      replyBatch.push(rObj);
                      totalCollected++;
                    }
                  } else if (rItem.continuationItemRenderer) {
                    rToken =
                      rItem.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token ||
                      null;
                  }
                  if (totalCollected >= limit) break;
                }
                if (replyBatch.length > 0) {
                  postToIsolated('NIQ_FETCH_COMMENTS_PROGRESS', {
                    comments: replyBatch,
                    totalCollected,
                    isDone: false,
                  });
                }
                await new Promise((r) => setTimeout(r, 120));
              }
            } catch (err) {
              console.warn('[NiQ Injected] Reply fetch warning:', err);
            }
          }
        }

        token = nextToken;
        await new Promise((r) => setTimeout(r, 150));
      }

      postToIsolated('NIQ_FETCH_COMMENTS_COMPLETE', {
        totalCollected,
      });
    } catch (err: any) {
      console.error('[NiQ Injected] Comment crawler error:', err);
      postToIsolated('NIQ_FETCH_COMMENTS_ERROR', {
        error: err?.message || 'Failed to crawl comments.',
      });
    } finally {
      isCrawlerActive = false;
    }
  }

  // Watch for player navigation and DOM lifecycle updates
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(extractAndBroadcast, 400);
    setTimeout(extractAndBroadcast, 1200);
  });

  window.addEventListener('yt-page-data-updated', () => {
    setTimeout(extractAndBroadcast, 300);
  });

  // Listen for commands from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'NIQ_ISOLATED_WORLD') {
      return;
    }

    const message: NiqBridgeMessage = event.data;
    const player = getMoviePlayer();

    if (message.type === 'NIQ_REQUEST_PLAYER_STATE') {
      extractAndBroadcast();
    } else if (message.type === 'NIQ_PLAYER_SEEK') {
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(message.payload.seconds, true);
      }
    } else if (message.type === 'NIQ_PLAYER_PAUSE') {
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (video && !video.paused) {
        video.pause();
      }
    } else if (message.type === 'NIQ_PLAYER_PLAY') {
      if (player && typeof player.playVideo === 'function') {
        player.playVideo();
      }
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    } else if (message.type === 'NIQ_FETCH_COMMENTS_START') {
      runCommentCrawler(message.payload);
    } else if (message.type === 'NIQ_FETCH_COMMENTS_STOP') {
      shouldStopCrawler = true;
    }
  });

  // Polling fallback during initial page boot
  let attempts = 0;
  const initInterval = setInterval(() => {
    attempts++;
    extractAndBroadcast();
    if (attempts > 5 || (window as any).ytInitialPlayerResponse) {
      clearInterval(initInterval);
    }
  }, 600);
});
