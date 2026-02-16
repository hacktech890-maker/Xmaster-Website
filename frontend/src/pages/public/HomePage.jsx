import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiClock, FiStar, FiChevronRight, FiLoader } from 'react-icons/fi';
import { publicAPI } from '../../services/api';
import { VideoGridSkeleton } from '../../components/video/VideoGrid';
import VideoCard from '../../components/video/VideoCard';
import CommentForm from '../../components/comments/CommentForm';
import CommentsList from '../../components/comments/CommentsList';

// ==================== AD DEBUGGER (REMOVE AFTER FIXING) ====================
const AdDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Capture console errors and warnings
    const originalError = console.error;
    const originalWarn = console.warn;
    const capturedLogs = [];

    console.error = (...args) => {
      capturedLogs.push({ type: 'error', msg: args.map(a => String(a)).join(' '), time: new Date().toLocaleTimeString() });
      setLogs([...capturedLogs].slice(-30));
      originalError.apply(console, args);
    };
    console.warn = (...args) => {
      capturedLogs.push({ type: 'warn', msg: args.map(a => String(a)).join(' '), time: new Date().toLocaleTimeString() });
      setLogs([...capturedLogs].slice(-30));
      originalWarn.apply(console, args);
    };

    // Catch script/resource load failures
    const handleError = (event) => {
      if (event.target?.tagName === 'SCRIPT' || event.target?.tagName === 'IFRAME') {
        capturedLogs.push({
          type: 'error',
          msg: `${event.target.tagName} FAILED: ${event.target.src || 'unknown'}`,
          time: new Date().toLocaleTimeString()
        });
        setLogs([...capturedLogs].slice(-30));
      }
    };
    window.addEventListener('error', handleError, true);

    // Gather debug info after 4 seconds
    const timer = setTimeout(() => {
      const adSlots = document.querySelectorAll('.ad-slot');
      let withContent = 0;
      let empty = 0;
      adSlots.forEach(slot => {
        const content = slot.querySelector('.ad-content');
        if (content && (content.children.length > 0 || content.innerHTML.trim().length > 10)) {
          withContent++;
        } else {
          empty++;
        }
      });

      // Ad blocker test
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '&nbsp;';
      testDiv.className = 'adsbox pub_300x250';
      testDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:300px;height:250px;';
      document.body.appendChild(testDiv);

      const adBlockerDetected = testDiv.offsetHeight === 0;
      if (document.body.contains(testDiv)) document.body.removeChild(testDiv);

      // Container divs check
      const containers = document.querySelectorAll('div[id^="container-"]');
      const containerDetails = [];
      containers.forEach(c => {
        const style = window.getComputedStyle(c);
        containerDetails.push({
          id: c.id,
          children: c.children.length,
          size: `${c.offsetWidth}x${c.offsetHeight}`,
          display: style.display,
          visibility: style.visibility,
        });
      });

      setDebugInfo({
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        dpr: window.devicePixelRatio,
        isHTTPS: window.location.protocol === 'https:',
        adBlocker: adBlockerDetected,
        adScriptsHPF: document.querySelectorAll('script[src*="highperformanceformat"]').length,
        adScriptsEG: document.querySelectorAll('script[src*="effectivegatecpm"]').length,
        totalIframes: document.querySelectorAll('iframe').length,
        adSlots: adSlots.length,
        adSlotsWithContent: withContent,
        adSlotsEmpty: empty,
        containerDivs: containerDetails,
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl"
      >
        🐛 Debug Ads
      </button>

      {showDebug && (
        <div className="fixed inset-2 bg-black text-green-400 rounded-2xl p-4 overflow-auto z-[10000] font-mono text-[11px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-yellow-400 font-bold text-sm">📊 Ad Debug Panel</h3>
            <button onClick={() => setShowDebug(false)} className="bg-red-600 text-white px-3 py-1 rounded text-xs">✕ Close</button>
          </div>

          {Object.keys(debugInfo).length === 0 ? (
            <p className="text-yellow-300">⏳ Gathering info... wait 4 seconds</p>
          ) : (
            <div className="space-y-3">
              {/* Device */}
              <div className="border-b border-gray-700 pb-2">
                <p className="text-yellow-300 font-bold">📱 Device</p>
                <p>Screen: {debugInfo.screen}</p>
                <p>Viewport: {debugInfo.viewport}</p>
                <p>DPR: {debugInfo.dpr}</p>
                <p className="text-[9px] text-gray-500 break-all">UA: {debugInfo.userAgent}</p>
              </div>

              {/* Critical Checks */}
              <div className="border-b border-gray-700 pb-2">
                <p className="text-yellow-300 font-bold">🔍 Critical Checks</p>
                <p>HTTPS: {debugInfo.isHTTPS ? '✅ Yes' : '❌ No - ads may be blocked'}</p>
                <p>Ad Blocker: {debugInfo.adBlocker ?
                  <span className="text-red-400 font-bold">⚠️ DETECTED - THIS IS WHY ADS FAIL</span> :
                  <span className="text-green-400">✅ Not detected</span>
                }</p>
              </div>

              {/* Scripts */}
              <div className="border-b border-gray-700 pb-2">
                <p className="text-yellow-300 font-bold">📜 Ad Scripts in DOM</p>
                <p>HighPerformanceFormat scripts: {debugInfo.adScriptsHPF}
                  {debugInfo.adScriptsHPF === 0 && <span className="text-red-400"> ← PROBLEM: Scripts not injected</span>}
                </p>
                <p>EffectiveGateCPM scripts: {debugInfo.adScriptsEG}
                  {debugInfo.adScriptsEG === 0 && <span className="text-red-400"> ← PROBLEM: Scripts not injected</span>}
                </p>
                <p>Iframes (ads render as iframes): {debugInfo.totalIframes}
                  {debugInfo.totalIframes === 0 && <span className="text-red-400"> ← PROBLEM: No ads rendered</span>}
                </p>
              </div>

              {/* Ad Slots */}
              <div className="border-b border-gray-700 pb-2">
                <p className="text-yellow-300 font-bold">📦 Ad Slots</p>
                <p>Total: {debugInfo.adSlots}</p>
                <p className="text-green-400">With content: {debugInfo.adSlotsWithContent}</p>
                <p className={debugInfo.adSlotsEmpty > 0 ? "text-red-400" : "text-green-400"}>
                  Empty: {debugInfo.adSlotsEmpty}
                  {debugInfo.adSlotsEmpty > 0 && ' ← These ads failed to load'}
                </p>
              </div>

              {/* Containers */}
              <div className="border-b border-gray-700 pb-2">
                <p className="text-yellow-300 font-bold">🏗️ Ad Container Divs</p>
                {debugInfo.containerDivs?.length === 0 && <p className="text-red-400">None found ← Native ads not created</p>}
                {debugInfo.containerDivs?.map((c, i) => (
                  <div key={i} className="ml-2 text-[10px] mb-1">
                    <p className="text-cyan-400">{c.id}</p>
                    <p>Size: {c.size} | Display: {c.display} | Visible: {c.visibility} | Children: {c.children}</p>
                    {c.size === '0x0' && <p className="text-red-400">← Zero size! Ad not rendering</p>}
                  </div>
                ))}
              </div>

              {/* Console Logs */}
              {logs.length > 0 && (
                <div className="border-b border-gray-700 pb-2">
                  <p className="text-yellow-300 font-bold">❌ Errors/Warnings ({logs.length})</p>
                  {logs.map((log, i) => (
                    <p key={i} className={`text-[9px] break-all ${log.type === 'error' ? 'text-red-400' : 'text-yellow-500'}`}>
                      {log.time} [{log.type}] {log.msg.substring(0, 300)}
                    </p>
                  ))}
                </div>
              )}

              {/* Diagnosis */}
              <div className="bg-gray-900 p-3 rounded-lg">
                <p className="text-yellow-300 font-bold mb-2">🩺 Auto Diagnosis</p>
                {debugInfo.adBlocker && <p className="text-red-400">• Ad blocker is blocking ads. Disable it and refresh.</p>}
                {!debugInfo.isHTTPS && <p className="text-red-400">• Site not on HTTPS. Mixed content blocks ads on mobile.</p>}
                {debugInfo.adScriptsHPF === 0 && !debugInfo.adBlocker && <p className="text-red-400">• Ad scripts not injected into DOM. Script injection is failing.</p>}
                {debugInfo.adScriptsHPF > 0 && debugInfo.totalIframes === 0 && <p className="text-red-400">• Scripts loaded but no iframes created. Ad network not serving ads to this device/region.</p>}
                {debugInfo.adSlotsEmpty > 0 && debugInfo.totalIframes > 0 && <p className="text-yellow-400">• Some ads loaded, some didn't. Timing/race condition issue.</p>}
                {!debugInfo.adBlocker && debugInfo.isHTTPS && debugInfo.adScriptsHPF > 0 && debugInfo.totalIframes > 0 && <p className="text-green-400">• Everything looks fine! Ads should be visible.</p>}
              </div>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={() => {
              const allData = JSON.stringify({ debugInfo, logs }, null, 2);
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(allData).then(() => alert('Copied!'));
              } else {
                const ta = document.createElement('textarea');
                ta.value = allData;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                alert('Copied!');
              }
            }}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs w-full font-bold"
          >
            📋 Copy All Debug Info
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== AD INJECTOR ====================
const AdSlot = ({ adCode, label = "Sponsored", className = "", minHeight = "50px" }) => {
  const containerRef = useRef(null);
  const uniqueId = useRef(`ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!adCode || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";
    mountedRef.current = true;

    const loadAd = () => {
      if (!mountedRef.current || !container) return;

      try {
        let processedCode = adCode;

        // Replace container IDs with unique ones
        const containerMatches = [...processedCode.matchAll(/id="(container-[a-f0-9]+)"/g)];
        for (const match of containerMatches) {
          const originalId = match[1];
          const newId = `${originalId}-${uniqueId.current}`;
          processedCode = processedCode.split(originalId).join(newId);
        }

        // Separate HTML and scripts
        const nonScript = processedCode.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

        if (nonScript) {
          const div = document.createElement("div");
          div.className = "ad-inner-content";
          div.innerHTML = nonScript;
          container.appendChild(div);
        }

        // Extract scripts
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = processedCode;
        const scripts = tempDiv.querySelectorAll("script");

        // Load scripts one by one in order
        const loadNext = (index) => {
          if (index >= scripts.length || !mountedRef.current) return;

          const orig = scripts[index];
          const s = document.createElement("script");

          Array.from(orig.attributes).forEach((a) => {
            if (a.name !== 'src') s.setAttribute(a.name, a.value);
          });

          if (orig.src) {
            s.src = orig.src;
            s.async = true;
            s.onload = () => {
              console.log(`✅ Ad script loaded: ${orig.src.substring(0, 60)}...`);
              loadNext(index + 1);
            };
            s.onerror = () => {
              console.error(`❌ Ad script FAILED: ${orig.src.substring(0, 60)}...`);
              loadNext(index + 1);
            };
          } else if (orig.textContent) {
            s.textContent = orig.textContent;
          }

          container.appendChild(s);

          if (!orig.src) loadNext(index + 1);
        };

        loadNext(0);
      } catch (err) {
        console.error("Ad injection error:", err);
      }
    };

    // Delay slightly for mobile DOM readiness
    const timer = setTimeout(loadAd, 200);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (container) container.innerHTML = "";
    };
  }, [adCode]);

  if (!adCode) return null;

  return (
    <div className={`ad-slot ${className}`}>
      {label && (
        <span className="text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1 block text-center">
          {label}
        </span>
      )}
      <div
        ref={containerRef}
        className="ad-content flex justify-center items-center"
        style={{ minHeight, overflow: 'visible' }}
      />
    </div>
  );
};

// ==================== AD CODES ====================
const ADS = {
  mobile320x50: `<script>
    atOptions = {
      'key' : '161b6adedd44fd65d7197bdc372ef90f',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/161b6adedd44fd65d7197bdc372ef90f/invoke.js"></script>`,

  footer728x90: `<script>
    atOptions = {
      'key' : '8615981141c313bf4581c3cf1de1fb8f',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/8615981141c313bf4581c3cf1de1fb8f/invoke.js"></script>`,

  footer300x250: `<script>
    atOptions = {
      'key' : '3becc7318ca2e6c794f587d8f3f05d0b',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/3becc7318ca2e6c794f587d8f3f05d0b/invoke.js"></script>`,

  sidebar160x300: `<script>
    atOptions = {
      'key' : 'deffd68605ce0b0c91d11c13a0fffd06',
      'format' : 'iframe',
      'height' : 300,
      'width' : 160,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/deffd68605ce0b0c91d11c13a0fffd06/invoke.js"></script>`,

  nativeBanner: `<script async="async" data-cfasync="false" src="https://pl28704186.effectivegatecpm.com/3ebdaa444c50232518b3752efc451cab/invoke.js"></script>
  <div id="container-3ebdaa444c50232518b3752efc451cab"></div>`,
};

// ==================== GLOBAL ADS LOADER ====================
const GlobalAdsLoader = () => {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const scripts = [];

    const addScript = (src, delay) => {
      setTimeout(() => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => console.log(`✅ Global ad loaded: ${src.substring(0, 50)}...`);
        s.onerror = () => console.error(`❌ Global ad FAILED: ${src.substring(0, 50)}...`);
        document.body.appendChild(s);
        scripts.push(s);
      }, delay);
    };

    addScript("https://pl28704151.effectivegatecpm.com/35/ee/21/35ee2192f0b1aa5ca35c1f3af9387b00.js", 0);
    addScript("https://pl28704173.effectivegatecpm.com/52/ef/a1/52efa111bceee1130b219af1074a5f95.js", 500);
    addScript("https://www.effectivegatecpm.com/sbfz9bs1c?key=4b48edda8bb87faa2b8f8b8708c46b0b", 1000);

    return () => {
      scripts.forEach(s => {
        try { if (document.body.contains(s)) document.body.removeChild(s); } catch (e) { }
      });
      loaded.current = false;
    };
  }, []);
  return null;
};

// ==================== IN-FEED AD COMPONENT ====================
const InFeedAd = React.memo(({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="col-span-2 py-3">
        <div className="bg-gray-100/50 dark:bg-dark-200/50 rounded-xl p-3 flex justify-center">
          <AdSlot adCode={ADS.nativeBanner} label="Sponsored" minHeight="100px" />
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-full py-4">
      <div className="w-full bg-gray-100/30 dark:bg-dark-200/30 rounded-xl p-4">
        <AdSlot adCode={ADS.nativeBanner} label="Sponsored" minHeight="100px" />
      </div>
    </div>
  );
});

// ==================== SEO KEYWORDS ====================
const SEO_CATEGORIES = [
  "Amateur", "Anal", "Asian", "BBW", "Big Ass", "Big Tits", "Blonde", "Blowjob",
  "Brunette", "Cosplay", "Creampie", "Cumshot", "Desi", "Ebony", "Gangbang",
  "Hardcore", "HD Videos", "Hentai", "Homemade", "Indian", "Interracial",
  "Japanese", "Latina", "Lesbian", "MILF", "POV", "Redhead", "Solo",
  "Teen", "Threesome", "Webcam", "MMS Videos", "Couple", "College",
];

// ==================== MAIN HOMEPAGE ====================
const HomePage = () => {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);
  const failCountRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  // ==================== FETCH INITIAL DATA ====================
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await publicAPI.getHomeData();
        if (response.data && response.data.success) {
          const data = response.data.data;
          setFeaturedVideos(data.featuredVideos || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Home data error:', err);
      }

      try {
        const res = await publicAPI.getVideos({ page: 1, limit: 40, sort: 'newest' });
        const d = res.data;

        if (d && d.videos && d.videos.length > 0) {
          setAllVideos(d.videos);
          pageRef.current = 1;

          const total = d.pagination?.total || 0;
          const pages = d.pagination?.pages || 1;
          setTotalVideos(total);

          if (pages <= 1) {
            setHasMore(false);
            hasMoreRef.current = false;
          }
        } else {
          setHasMore(false);
          hasMoreRef.current = false;
        }
      } catch (err) {
        console.error('Videos error:', err);
        setHasMore(false);
        hasMoreRef.current = false;
      }

      setLoading(false);
    };

    fetchHomeData();
  }, []);

  // ==================== LOAD MORE VIDEOS ====================
  const loadMoreVideos = useCallback(async () => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;

    try {
      const res = await publicAPI.getVideos({ page: nextPage, limit: 40, sort: 'newest' });
      const d = res.data;

      if (d && d.videos && d.videos.length > 0) {
        failCountRef.current = 0;

        setAllVideos(prev => {
          const ids = new Set(prev.map(v => v._id));
          const unique = d.videos.filter(v => !ids.has(v._id));
          return [...prev, ...unique];
        });

        pageRef.current = nextPage;

        if (d.pagination) {
          setTotalVideos(d.pagination.total || 0);
          if (nextPage >= d.pagination.pages) {
            setHasMore(false);
            hasMoreRef.current = false;
          }
        }
      } else {
        setHasMore(false);
        hasMoreRef.current = false;
      }
    } catch (error) {
      console.error('Load more error:', error.message);
      failCountRef.current += 1;
      pageRef.current = nextPage;

      if (failCountRef.current >= 3) {
        setHasMore(false);
        hasMoreRef.current = false;
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // ==================== INTERSECTION OBSERVER ====================
  useEffect(() => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          loadMoreVideos();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    observerRef.current = observer;
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [loading, loadMoreVideos]);

  // ==================== SCROLL FALLBACK ====================
  useEffect(() => {
    if (loading) return;

    let ticking = false;
    const onScroll = () => {
      if (loadingMoreRef.current || !hasMoreRef.current) return;
      const { scrollY } = window;
      const { scrollHeight, clientHeight } = document.documentElement;
      if (scrollY + clientHeight >= scrollHeight - 600) {
        loadMoreVideos();
      }
    };

    const throttled = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => { onScroll(); ticking = false; });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttled, { passive: true });
    return () => window.removeEventListener('scroll', throttled);
  }, [loading, loadMoreVideos]);

  // ==================== RENDER VIDEOS WITH ADS ====================
  const renderVideosWithAds = () => {
    if (allVideos.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-gray-600 dark:text-gray-400">No videos found</p>
        </div>
      );
    }

    const videosPerAdBreak = isMobile ? 8 : 20;
    const items = [];
    let adCounter = 0;

    for (let i = 0; i < allVideos.length; i++) {
      items.push(<VideoCard key={allVideos[i]._id} video={allVideos[i]} />);

      if ((i + 1) % videosPerAdBreak === 0 && i < allVideos.length - 1) {
        items.push(<InFeedAd key={`infeed-ad-${adCounter}-${i}`} isMobile={isMobile} />);
        adCounter++;
      }
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {items}
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <>
      <Helmet>
        <title>Xmaster - Free porn Videos | Watch HD porn Online | porn Streaming Site</title>
        <meta name="description" content="Watch free HD porn videos on Xmaster. Stream thousands of porn clips in HD & 4K. Browse leaked mms videos, viral mms videos, porn, mms, hardcore, anal categories. Best free porn tube site. Alternative to pornhub, xhamster, Xvideos. Updated daily with new porn content. MMS videos, desi mms, indian mms, amateur porn, homemade porn and more." />
        <meta name="keywords" content="porn,free porn videos,HD porn,4K porn,porn streaming,watch porn online,porn tube,porn site,pornhub alternative,xhamster alternative,xvideos alternative,desi mms,indian mms,mms videos,leaked mms,amateur porn,homemade porn,milf,teen,anal,blowjob,creampie,big ass,big tits,latina,asian,ebony,lesbian,threesome,webcam,hentai,JAV,POV,hardcore,xmaster,xmaster.guru" />
        <link rel="canonical" href="https://xmaster.guru" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Xmaster - Free porn Videos | HD porn Streaming" />
        <meta property="og:description" content="Watch free HD porn videos online. Thousands of porn clips updated daily. Best porn tube alternative." />
        <meta property="og:url" content="https://xmaster.guru" />
        <meta property="og:image" content="https://xmaster.guru/logo.jpg" />
        <meta property="og:site_name" content="Xmaster" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Xmaster - Free porn Videos | HD Streaming" />
        <meta name="twitter:description" content="Watch free HD porn videos online. Updated daily." />
        <meta name="twitter:image" content="https://xmaster.guru/logo.jpg" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-dark-400">
        <GlobalAdsLoader />

        {/* === DEBUGGER - REMOVE AFTER FIXING === */}
        <AdDebugger />

        {/* === TOP AD === */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {isMobile ? (
            <div className="flex justify-center">
              <AdSlot adCode={ADS.mobile320x50} label="Sponsored" minHeight="60px" className="flex justify-center" />
            </div>
          ) : (
            <AdSlot adCode={ADS.footer728x90} label="Sponsored" className="flex justify-center" minHeight="100px" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <h1 className="sr-only">
                Xmaster - Free porn Videos | Watch HD porn Online | Best porn Tube Site
              </h1>

              {featuredVideos.length > 0 && (
                <section className="mb-10">
                  <SectionHeader icon={FiStar} title="Featured Videos" iconColor="text-yellow-500" />
                  {loading ? (
                    <VideoGridSkeleton count={6} columns={3} />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {featuredVideos.slice(0, 6).map((video) => (
                        <VideoCard key={video._id} video={video} />
                      ))}
                    </div>
                  )}

                  {/* Mobile ad after featured */}
                  {isMobile && (
                    <div className="mt-4 flex justify-center">
                      <AdSlot adCode={ADS.footer300x250} label="Sponsored" minHeight="260px" />
                    </div>
                  )}
                </section>
              )}

              <section className="mb-10">
                <SectionHeader
                  icon={FiClock}
                  title={`Latest Videos${totalVideos > 0 ? ` (${totalVideos})` : ''}`}
                  link="/search?sort=newest"
                  linkText="View All"
                  iconColor="text-blue-500"
                />

                {loading ? (
                  <VideoGridSkeleton count={12} columns={4} />
                ) : (
                  <>
                    {renderVideosWithAds()}

                    <div
                      ref={loadMoreRef}
                      className="py-6 flex justify-center"
                      style={{ minHeight: '60px' }}
                    >
                      {loadingMore && (
                        <div className="flex items-center gap-3 text-gray-400">
                          <FiLoader className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Loading more videos...</span>
                        </div>
                      )}
                      {!hasMore && allVideos.length > 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          You've reached the end • {allVideos.length} videos loaded
                        </p>
                      )}
                    </div>
                  </>
                )}
              </section>

              {categories.length > 0 && (
                <section id="categories" className="mb-10">
                  <SectionHeader title="Browse Categories" iconColor="text-purple-500" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {categories.map((category) => (
                      <CategoryCard key={category._id} category={category} />
                    ))}
                  </div>
                </section>
              )}

              {/* Mobile ad before SEO */}
              {isMobile && (
                <div className="mb-6 flex justify-center">
                  <AdSlot adCode={ADS.mobile320x50} label="Sponsored" minHeight="60px" />
                </div>
              )}

              <section className="mb-10 bg-white dark:bg-dark-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Popular Porn Categories on Xmaster
                </h2>
                <div className="flex flex-wrap gap-2 mb-6">
                  {SEO_CATEGORIES.map((cat, i) => (
                    <Link
                      key={i}
                      to={`/search?q=${encodeURIComponent(cat)}`}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-primary-600 hover:text-white transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-3 leading-relaxed">
                  <p>
                    <strong>Xmaster</strong> is your ultimate destination for free porn videos online.
                    We offer a massive collection of HD and 4K Porn content across hundreds of categories
                    including mms videos, porn videos, latest mms viral videos porn, latest porn, and many more.
                  </p>
                  <p>
                    Looking for an alternative to pornhub, xhamster, or xvideos? Xmaster provides
                    the same premium experience with faster streaming, better video quality, and a
                    cleaner interface.
                  </p>
                  <p>
                    Whether you enjoy anal, hardcore, sex videos, latest porn, MMS videos, desi content, or
                    any other category, Xmaster has thousands of free porn videos ready to stream.
                    No signup required.
                  </p>
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                  Why Choose Xmaster?
                </h3>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2 list-disc list-inside">
                  <li>Free HD & 4K porn video streaming</li>
                  <li>Thousands of porn videos updated daily</li>
                  <li>Hundreds of porn categories to explore</li>
                  <li>Fast loading and smooth playback</li>
                  <li>Works on all devices - mobile, desktop, tablet</li>
                  <li>No registration required</li>
                  <li>Best alternative to pornhub, xhamster, xvideos</li>
                </ul>
              </section>

              <section className="mb-10">
                <SectionHeader title="💬 Comments" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div><CommentForm /></div>
                  <div><CommentsList /></div>
                </div>
              </section>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0 hidden lg:block">
              <div className="sticky top-20 space-y-6">
                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link to="/trending" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                      <span className="text-red-500">🔥</span>
                      <span className="text-gray-700 dark:text-gray-300">Trending Videos</span>
                    </Link>
                    <Link to="/search?sort=newest" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors">
                      <FiClock className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">Latest Uploads</span>
                    </Link>
                  </div>
                </div>

                <div className="flex justify-center">
                  <AdSlot adCode={ADS.sidebar160x300} label="Sponsored" minHeight="310px" />
                </div>

                <div className="card p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Popular Searches</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {["HD Porn", "Amateur", "MILF", "Teen", "Desi", "MMS", "Anal", "POV", "Lesbian", "Homemade", "Indian", "Webcam"].map((tag, i) => (
                      <Link
                        key={i}
                        to={`/search?q=${encodeURIComponent(tag)}`}
                        className="px-2 py-1 bg-dark-100 text-gray-400 text-[10px] rounded hover:bg-primary-600 hover:text-white transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer Ad */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="py-6 border-t border-gray-200 dark:border-dark-100">
            {isMobile ? (
              <div className="flex justify-center">
                <AdSlot adCode={ADS.footer300x250} label="Sponsored" minHeight="260px" />
              </div>
            ) : (
              <AdSlot adCode={ADS.footer728x90} label="Sponsored" className="flex justify-center" minHeight="100px" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ==================== SECTION HEADER ====================
const SectionHeader = ({ icon: Icon, title, link, linkText, iconColor = 'text-primary-500' }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
      {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />}
      {title}
    </h2>
    {link && (
      <Link to={link} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
        {linkText}
        <FiChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

// ==================== CATEGORY CARD ====================
const CategoryCard = ({ category }) => (
  <Link
    to={`/category/${category.slug}`}
    className="group card p-4 text-center hover:shadow-lg transition-all"
    style={{ borderTop: `3px solid ${category.color || '#ef4444'}` }}
  >
    <div className="text-3xl mb-2">{category.icon || '📁'}</div>
    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors text-sm sm:text-base">
      {category.name}
    </h3>
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
      {category.videoCount || 0} videos
    </p>
  </Link>
);

export default HomePage;