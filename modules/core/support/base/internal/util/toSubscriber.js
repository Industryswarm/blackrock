"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSubscriber = void 0;
var Subscriber_1 = require("../Subscriber");
var Observer_1 = require("../Observer");
var Subscription_1 = require("../Subscription");
function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver) {
        if (isSubscriber(nextOrObserver)) {
            return nextOrObserver;
        }
        if (isObserver(nextOrObserver)) {
            return new FullObserverSubscriber(nextOrObserver);
        }
    }
    if (!nextOrObserver && !error && !complete) {
        return new Subscriber_1.Subscriber(Observer_1.empty);
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
}
exports.toSubscriber = toSubscriber;
function isObserver(value) {
    return value && typeof value.next === 'function' && typeof value.error === 'function' && typeof value.complete === 'function';
}
function isSubscriber(value) {
    return value instanceof Subscriber_1.Subscriber || (isObserver(value) && Subscription_1.isSubscription(value));
}
var FullObserverSubscriber = (function (_super) {
    __extends(FullObserverSubscriber, _super);
    function FullObserverSubscriber(destination) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        return _this;
    }
    return FullObserverSubscriber;
}(Subscriber_1.Subscriber));
//# sourceMappingURL=toSubscriber.js.map