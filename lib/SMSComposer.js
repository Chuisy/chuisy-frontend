/**
 * SMS Composer plugin for cordova
 * window.plugins.SMSComposer
 */

(function(cordova) {
    function SMSComposer() {
        this.resultCallback = null;
    }

    SMSComposer.ComposeResultType = {
        Cancelled: 0,
        Sent: 1,
        Failed: 2,
        NotSent: 3
    };

    SMSComposer.prototype.showSMSComposer = function(toRecipients, body, callback) {
        var args = {};
        
        if (toRecipients) {
            args.toRecipients = toRecipients;
        }
        
        if (body) {
            args.body = body;
        }

        if (callback) {
            this.resultCallback = callback;
        }
        
        cordova.exec("SMSComposer.showSMSComposer", args);
    };

    SMSComposer.prototype._didFinishWithResult = function(res) {
        if (this.resultCallback) {
            this.resultCallback(res);
        }
    };

    cordova.addConstructor(function() {
        if(!window.plugins) {
            window.plugins = {};
        }
        window.plugins.smsComposer = new SMSComposer();
    });
})(window.cordova || window.Cordova);
