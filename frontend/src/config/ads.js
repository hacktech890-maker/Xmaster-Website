// src/config/ads.js
// CENTRALIZED ad code configuration
// Previously duplicated across WatchPage.jsx and HomePage.jsx
// Edit ad codes HERE ONLY — one source of truth

export const AD_NETWORK = {
  PROPELLER: 'propeller',
  EFFECTIVE_GATE: 'effective_gate',
};

// Propeller Ads — Banner codes
export const PROPELLER_ADS = {
  // 300x250 — Medium Rectangle
  rectangle_300x250: `
    <script type="text/javascript">
      atOptions = {
        'key': '3becc73a4b8f3769c56b5c3d85a2cfe7',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/3becc73a4b8f3769c56b5c3d85a2cfe7/invoke.js"></script>
  `,
  // 728x90 — Leaderboard
  leaderboard_728x90: `
    <script type="text/javascript">
      atOptions = {
        'key': '8615981a7f8a3e2b1c4d5e6f7a8b9c0d',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/8615981a7f8a3e2b1c4d5e6f7a8b9c0d/invoke.js"></script>
  `,
  // 320x50 — Mobile Banner
  mobile_320x50: `
    <script type="text/javascript">
      atOptions = {
        'key': '161b6ad2e3f4g5h6i7j8k9l0m1n2o3p',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/161b6ad2e3f4g5h6i7j8k9l0m1n2o3p/invoke.js"></script>
  `,
};

// EffectiveGateCPM ads
export const EFFECTIVE_GATE_ADS = {
  // Native banner
  native_banner: `
    <script async="async" data-cfasync="false"
      src="//effectivegatecpm.com/native-banner.js">
    </script>
  `,
  // Social bar (sticky bottom)
  social_bar: `
    <script type="text/javascript"
      src="//effectivegatecpm.com/social-bar.js"
      async>
    </script>
  `,
  // Popunder (fire once per session)
  popunder: `
    <script type="text/javascript"
      src="//effectivegatecpm.com/popunder.js"
      async>
    </script>
  `,
};

// Ad placement configuration
// Maps placement names to ad codes and device targeting
export const AD_PLACEMENTS = {
  // Watch page ads
  watch_sidebar: {
    desktop: PROPELLER_ADS.rectangle_300x250,
    mobile: null,
    width: 300,
    height: 250,
  },
  watch_bottom: {
    desktop: PROPELLER_ADS.leaderboard_728x90,
    mobile: PROPELLER_ADS.mobile_320x50,
    desktopWidth: 728,
    desktopHeight: 90,
    mobileWidth: 320,
    mobileHeight: 50,
  },
  watch_native: {
    desktop: EFFECTIVE_GATE_ADS.native_banner,
    mobile: EFFECTIVE_GATE_ADS.native_banner,
  },
  // Home page ads
  home_mid: {
    desktop: PROPELLER_ADS.rectangle_300x250,
    mobile: PROPELLER_ADS.mobile_320x50,
  },
  // Global (injected once per page)
  global_social_bar: {
    all: EFFECTIVE_GATE_ADS.social_bar,
  },
  global_popunder: {
    all: EFFECTIVE_GATE_ADS.popunder,
  },
};

// Delay settings (ms) — prioritize video load over ads
export const AD_LOAD_DELAY = {
  global_ads: 2500,    // 2.5s delay for social bar + popunder
  sidebar_ad: 1500,    // 1.5s delay for sidebar banners
  bottom_ad:  3000,    // 3s delay for bottom banner
  native_ad:  2000,    // 2s delay for native
};