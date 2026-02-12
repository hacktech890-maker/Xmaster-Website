var path = require("path");
var fs = require("fs");
var axios = require("axios");

// Load env
var envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  var content = fs.readFileSync(envPath, "utf8");
  var lines = content.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line && !line.startsWith("#")) {
      var eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        var key = line.substring(0, eqIndex).trim();
        var val = line.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

async function test() {
  var videoId = "698e1b28f8d1bf4582ef17a2";
  var shareUrl = "https://api.xmaster.guru/api/public/share/" + videoId;

  console.log("Testing share URL:", shareUrl);
  console.log("");

  // Test 1: As Telegram bot
  console.log("=== TEST 1: As TelegramBot ===");
  try {
    var res1 = await axios.get(shareUrl, {
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function() { return true; },
      headers: {
        "User-Agent": "TelegramBot (like TwitterBot)"
      }
    });
    console.log("Status:", res1.status);
    console.log("Content-Type:", res1.headers["content-type"]);
    console.log("");

    if (typeof res1.data === "string") {
      var html = res1.data;

      // Check for og:image
      var ogImage = html.match(/og:image"\s+content="([^"]+)"/i);
      if (ogImage) {
        console.log("og:image FOUND:", ogImage[1]);

        // Test if the image URL works
        try {
          var imgRes = await axios.head(ogImage[1], {
            timeout: 8000,
            validateStatus: function() { return true; },
          });
          console.log("Image status:", imgRes.status, imgRes.status === 200 ? "OK" : "BROKEN");
          console.log("Image type:", imgRes.headers["content-type"]);
          console.log("Image size:", imgRes.headers["content-length"] || "unknown");
        } catch (imgErr) {
          console.log("Image ERROR:", imgErr.message);
        }
      } else {
        console.log("og:image NOT FOUND!");
      }

      // Check for og:title
      var ogTitle = html.match(/og:title"\s+content="([^"]+)"/i);
      console.log("og:title:", ogTitle ? ogTitle[1] : "NOT FOUND");

      // Check for og:url
      var ogUrl = html.match(/og:url"\s+content="([^"]+)"/i);
      console.log("og:url:", ogUrl ? ogUrl[1] : "NOT FOUND");

      // Check for redirect
      var refresh = html.match(/refresh"\s+content="[^"]*url=([^"]+)"/i);
      console.log("Redirect URL:", refresh ? refresh[1] : "NONE");

      // Check for JS redirect
      var jsRedirect = html.match(/location\.replace\("([^"]+)"\)/i);
      console.log("JS Redirect:", jsRedirect ? jsRedirect[1] : "NONE");

      console.log("");
      console.log("Full HTML length:", html.length, "chars");
      console.log("First 500 chars:");
      console.log(html.substring(0, 500));
    }
  } catch (err) {
    console.log("ERROR:", err.message);
    if (err.response) {
      console.log("Response status:", err.response.status);
      console.log("Response headers:", JSON.stringify(err.response.headers));
    }
  }

  // Test 2: As normal browser
  console.log("\n=== TEST 2: As Normal Browser ===");
  try {
    var res2 = await axios.get(shareUrl, {
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function() { return true; },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    console.log("Status:", res2.status);

    if (res2.status === 301 || res2.status === 302) {
      console.log("Redirects to:", res2.headers.location);
    } else {
      var refresh2 = res2.data.match(/refresh"\s+content="[^"]*url=([^"]+)"/i);
      console.log("Redirect URL:", refresh2 ? refresh2[1] : "NONE");

      var jsRedir2 = res2.data.match(/location\.replace\("([^"]+)"\)/i);
      console.log("JS Redirect:", jsRedir2 ? jsRedir2[1] : "NONE");
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }

  // Test 3: Direct thumbnail URL
  console.log("\n=== TEST 3: Cloudinary Thumbnail ===");
  var cloudThumb = "https://res.cloudinary.com/dzjw6z7fy/image/upload/w_1280,h_720,c_fill/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg";
  try {
    var res3 = await axios.head(cloudThumb, {
      timeout: 8000,
      validateStatus: function() { return true; },
    });
    console.log("URL:", cloudThumb);
    console.log("Status:", res3.status);
    console.log("Type:", res3.headers["content-type"]);
    console.log("Size:", res3.headers["content-length"], "bytes");
  } catch (err) {
    console.log("ERROR:", err.message);
  }

  // Test 4: Thumbnail without transforms
  console.log("\n=== TEST 4: Cloudinary WITHOUT transforms ===");
  var cloudThumb2 = "https://res.cloudinary.com/dzjw6z7fy/image/upload/v1770920740/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg";
  try {
    var res4 = await axios.head(cloudThumb2, {
      timeout: 8000,
      validateStatus: function() { return true; },
    });
    console.log("URL:", cloudThumb2);
    console.log("Status:", res4.status);
    console.log("Type:", res4.headers["content-type"]);
    console.log("Size:", res4.headers["content-length"], "bytes");
  } catch (err) {
    console.log("ERROR:", err.message);
  }

  console.log("\n=== TEST 5: Video page URL ===");
  var pageUrl = "https://xmaster.guru/watch/698e1b28f8d1bf4582ef17a2";
  try {
    var res5 = await axios.get(pageUrl, {
      timeout: 10000,
      validateStatus: function() { return true; },
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    console.log("URL:", pageUrl);
    console.log("Status:", res5.status);
  } catch (err) {
    console.log("ERROR:", err.message);
  }

  console.log("\nDone! Share ALL output.");
}

test();