// src/config/ads.js
// CENTRALIZED ad code configuration
// Edit ad codes HERE ONLY — one source of truth
// Last updated: real production codes applied

// ============================================================
// BANNER ADS — highperformanceformat.com (Propeller Ads)
// ============================================================

export const PROPELLER_ADS = {

  // 468x60 — Standard Banner (desktop)
  banner_468x60: `
    <script type="text/javascript">
      atOptions = {
        'key' : 'e50c996a8b1f38f50988e7c6e6ebc19a',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/e50c996a8b1f38f50988e7c6e6ebc19a/invoke.js"></script>
  `,

  // 728x90 — Leaderboard (desktop)
  leaderboard_728x90: `
    <script type="text/javascript">
      atOptions = {
        'key' : '8615981141c313bf4581c3cf1de1fb8f',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/8615981141c313bf4581c3cf1de1fb8f/invoke.js"></script>
  `,

  // 300x250 — Medium Rectangle
  rectangle_300x250: `
    <script type="text/javascript">
      atOptions = {
        'key' : '3becc7318ca2e6c794f587d8f3f05d0b',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/3becc7318ca2e6c794f587d8f3f05d0b/invoke.js"></script>
  `,

  // 160x600 — Wide Skyscraper Sidebar
  sidebar_160x600: `
    <script type="text/javascript">
      atOptions = {
        'key' : '5341bbc09b5293c807f871518481b16d',
        'format' : 'iframe',
        'height' : 600,
        'width' : 160,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/5341bbc09b5293c807f871518481b16d/invoke.js"></script>
  `,

  // 160x300 — Half Page Sidebar
  sidebar_160x300: `
    <script type="text/javascript">
      atOptions = {
        'key' : 'deffd68605ce0b0c91d11c13a0fffd06',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/deffd68605ce0b0c91d11c13a0fffd06/invoke.js"></script>
  `,

  // 320x50 — Mobile Banner
  mobile_320x50: `
    <script type="text/javascript">
      atOptions = {
        'key' : '161b6adedd44fd65d7197bdc372ef90f',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="//www.highperformanceformat.com/161b6adedd44fd65d7197bdc372ef90f/invoke.js"></script>
  `,
};

// ============================================================
// NATIVE / CONTAINER ADS — profitablecpmratenetwork.com
// ============================================================

export const NATIVE_ADS = {

  // Native container ad (renders in a div with specific ID)
  native_container: `
    <script async="async" data-cfasync="false" src="//pl28704186.profitablecpmratenetwork.com/3ebdaa444c50232518b3752efc451cab/invoke.js"></script>
    <div id="container-3ebdaa444c50232518b3752efc451cab"></div>
  `,
};

// ============================================================
// POPUNDER SCRIPTS — profitablecpmratenetwork.com
// Injected once per page via GlobalAdsLoader
// ============================================================

export const POPUNDER_SCRIPTS = [
  'https://pl28704151.profitablecpmratenetwork.com/35/ee/21/35ee2192f0b1aa5ca35c1f3af9387b00.js',
  'https://pl28704173.profitablecpmratenetwork.com/52/ef/a1/52efa111bceee1130b219af1074a5f95.js',
];

// ============================================================
// AD PLACEMENTS
// Maps placement keys → ad codes + device targeting
// ============================================================

export const AD_PLACEMENTS = {

  // ── Watch page ───────────────────────────────────────────
  watch_sidebar: {
    desktop: PROPELLER_ADS.rectangle_300x250,
    mobile:  null,
    width:   300,
    height:  250,
  },

  watch_bottom: {
    desktop:       PROPELLER_ADS.leaderboard_728x90,
    mobile:        PROPELLER_ADS.mobile_320x50,
    desktopWidth:  728,
    desktopHeight: 90,
    mobileWidth:   320,
    mobileHeight:  50,
  },

  watch_native: {
    desktop: NATIVE_ADS.native_container,
    mobile:  NATIVE_ADS.native_container,
  },

  // ── Home page ─────────────────────────────────────────────
  home_mid: {
    desktop: PROPELLER_ADS.leaderboard_728x90,
    mobile:  PROPELLER_ADS.mobile_320x50,
  },

  home_grid_insert: {
    desktop: PROPELLER_ADS.banner_468x60,
    mobile:  PROPELLER_ADS.mobile_320x50,
  },

  // ── Sidebar (desktop) ─────────────────────────────────────
  sidebar_tall: {
    desktop: PROPELLER_ADS.sidebar_160x600,
    mobile:  null,
  },

  sidebar_half: {
    desktop: PROPELLER_ADS.sidebar_160x300,
    mobile:  null,
  },

  // ── Category / Search pages ───────────────────────────────
  category_top: {
    desktop: PROPELLER_ADS.leaderboard_728x90,
    mobile:  PROPELLER_ADS.mobile_320x50,
  },
};

// ============================================================
// DELAY SETTINGS (ms) — prioritize content load over ads
// ============================================================

export const AD_LOAD_DELAY = {
  global_ads:        3000,  // popunders — fired after content renders
  watch_bottom:      2500,  // bottom banner on watch page
  watch_native:      3500,  // native container
  watch_sidebar:     1500,  // sidebar rectangle
  home_mid:          3000,  // home page leaderboard
  home_grid_insert:  2000,  // in-grid ads
  category_top:      2000,  // category page top banner
  sidebar_tall:      1500,
  sidebar_half:      1500,
  default:           1500,
};