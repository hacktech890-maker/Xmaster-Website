var axios = require("axios");

async function test() {
  var shareUrl = "https://api.xmaster.guru/api/public/share/698e1b28f8d1bf4582ef17a2";

  console.log("=== Testing LIVE deployed share URL ===");
  console.log("URL:", shareUrl);
  console.log("");

  // Test as Telegram bot
  console.log("--- As TelegramBot ---");
  try {
    var res = await axios.get(shareUrl, {
      timeout: 15000,
      maxRedirects: 0,
      validateStatus: function() { return true; },
      headers: {
        "User-Agent": "TelegramBot (like TwitterBot)"
      }
    });

    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers["content-type"]);
    console.log("");

    if (typeof res.data === "string") {
      var html = res.data;
      console.log("=== FULL HTML RESPONSE ===");
      console.log(html);
      console.log("=== END HTML ===");
      console.log("");

      // Parse OG tags
      var ogImage = html.match(/og:image"[^>]+content="([^"]+)"/i);
      var ogTitle = html.match(/og:title"[^>]+content="([^"]+)"/i);
      var ogUrl = html.match(/og:url"[^>]+content="([^"]+)"/i);
      var ogDesc = html.match(/og:description"[^>]+content="([^"]+)"/i);

      console.log("Parsed OG tags:");
      console.log("  og:title:", ogTitle ? ogTitle[1] : "NOT FOUND");
      console.log("  og:image:", ogImage ? ogImage[1] : "NOT FOUND");
      console.log("  og:url:", ogUrl ? ogUrl[1] : "NOT FOUND");
      console.log("  og:description:", ogDesc ? ogDesc[1] : "NOT FOUND");

      // Test image
      if (ogImage) {
        console.log("");
        console.log("Testing og:image URL...");
        try {
          var imgRes = await axios.head(ogImage[1], {
            timeout: 8000,
            validateStatus: function() { return true; },
          });
          console.log("  Image status:", imgRes.status);
          console.log("  Image type:", imgRes.headers["content-type"]);
          console.log("  Image size:", imgRes.headers["content-length"], "bytes");

          if (imgRes.status === 200) {
            var size = parseInt(imgRes.headers["content-length"] || "0");
            if (size < 1000) {
              console.log("  WARNING: Image too small! Telegram needs at least 100KB for good preview.");
            } else {
              console.log("  OK: Image accessible");
            }
          }
        } catch (ie) {
          console.log("  Image ERROR:", ie.message);
        }
      }

      // Check og:url for comma issue
      if (ogUrl && ogUrl[1].indexOf(",") !== -1) {
        console.log("");
        console.log("BUG: og:url contains commas! This breaks everything.");
        console.log("  Value:", ogUrl[1]);
        console.log("  Fix: FRONTEND_URL env var on Render should be just ONE URL");
      }
    } else {
      console.log("Response is not HTML:", typeof res.data);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
    if (err.response) {
      console.log("Status:", err.response.status);
    }
  }

  // Test as normal user
  console.log("\n--- As Normal User ---");
  try {
    var res2 = await axios.get(shareUrl, {
      timeout: 15000,
      maxRedirects: 0,
      validateStatus: function() { return true; },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    console.log("Status:", res2.status);
    if (res2.status === 301 || res2.status === 302) {
      console.log("Redirect to:", res2.headers.location);
    } else if (typeof res2.data === "string") {
      var redirect = res2.data.match(/url=([^"]+)"/i);
      var jsRedir = res2.data.match(/location\.replace\("([^"]+)"\)/i);
      console.log("Meta redirect:", redirect ? redirect[1] : "NONE");
      console.log("JS redirect:", jsRedir ? jsRedir[1] : "NONE");
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }

  console.log("\nDone!");
}

test();