/*
    The MIT License (MIT)
    Copyright (c) 2013 Vlad Stirbu
    
    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function (window, document) {

  var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks

  var hasCheckedInstall,
      isAppInstalled;

  function shareDataUrl(dataUrl, caption, callback) {
    var imageData = dataUrl.replace(/data:image\/(png|jpeg);base64,/, "");

    cordovaRef.exec(function () {
      callback && callback(null, true);
    },

    function () {
      callback && callback("error");
    }, "Instagram", "share", [imageData, caption]);
  }

  window.Instagram = {
    // calls to see if the device has the Instagram app
    isInstalled: function (callback) {
      cordovaRef.exec(function () {
        hasCheckedInstall = true;
        isAppInstalled = true;
        callback && callback(null, true);
      },

      function () {
        hasCheckedInstall = true;
        isAppInstalled = false;
        callback && callback(null, false);
      }, "Instagram", "isInstalled", []);
    },
    share: function (data, caption, callback) {
      // sanity check 
      if (hasCheckedInstall && !isAppInstalled) {
        console.log("oops, Instagram is not installed ... ");
        return callback && callback("oops, Instagram is not installed ... ");
      }

      var canvas = document.getElementById(data),
          magic = "data:image";
      
      if (canvas) {
        shareDataUrl(canvas.toDataURL(), caption, callback);
      }
      else if (data.slice(0, magic.length) == magic) {
        shareDataUrl(data, caption, callback);
      }
    }
  };

})(window, document);
