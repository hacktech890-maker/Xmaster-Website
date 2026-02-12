var axios = require("axios");

async function test() {
  var urls = [
    "https://res.cloudinary.com/dzjw6z7fy/image/upload/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg",
    "https://res.cloudinary.com/dzjw6z7fy/image/upload/v1770920740/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg",
    "https://res.cloudinary.com/dzjw6z7fy/image/upload/w_1280,h_720,c_fill,q_90/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg",
    "https://res.cloudinary.com/dzjw6z7fy/image/upload/w_800,h_450,c_fill,q_80/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg",
    "https://res.cloudinary.com/dzjw6z7fy/image/upload/w_640,h_360,c_fill,q_80/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg",
    "https://res.cloudinary.com/dzjw6z7fy/image/upload/w_1280,h_720,c_fill,q_80,f_jpg/xmaster-thumbnails/ybov610olc9aradq2uhv.jpg",
  ];

  console.log("Testing Cloudinary image URLs:\n");

  for (var i = 0; i < urls.length; i++) {
    try {
      var res = await axios.get(urls[i], {
        responseType: "arraybuffer",
        timeout: 10000,
        validateStatus: function() { return true; },
      });

      var sizeKB = (res.data.byteLength / 1024).toFixed(1);
      console.log((i + 1) + ". Status: " + res.status + " | Size: " + sizeKB + "KB | Type: " + (res.headers["content-type"] || "?"));
      console.log("   URL: " + urls[i]);
      console.log("");
    } catch (err) {
      console.log((i + 1) + ". ERROR: " + err.message);
      console.log("   URL: " + urls[i]);
      console.log("");
    }
  }

  console.log("Done!");
}

test();