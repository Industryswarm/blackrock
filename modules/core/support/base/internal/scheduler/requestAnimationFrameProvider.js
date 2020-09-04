"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAnimationFrameProvider = void 0;
var Subscription_1 = require("../Subscription");
exports.requestAnimationFrameProvider = {
    schedule: function (callback) {
        var request = requestAnimationFrame;
        var cancel = cancelAnimationFrame;
        var delegate = exports.requestAnimationFrameProvider.delegate;
        if (delegate) {
            request = delegate.requestAnimationFrame;
            cancel = delegate.cancelAnimationFrame;
        }
        var handle = request(function (timestamp) {
            cancel = undefined;
            callback(timestamp);
        });
        return new Subscription_1.Subscription(function () { return cancel === null || cancel === void 0 ? void 0 : cancel(handle); });
    },
    delegate: undefined,
};
//# sourceMappingURL=requestAnimationFrameProvider.js.map