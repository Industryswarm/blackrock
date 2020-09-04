"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalize = void 0;
var lift_1 = require("../util/lift");
function finalize(callback) {
    return function (source) { return lift_1.lift(source, new FinallyOperator(callback)); };
}
exports.finalize = finalize;
var FinallyOperator = (function () {
    function FinallyOperator(callback) {
        this.callback = callback;
    }
    FinallyOperator.prototype.call = function (subscriber, source) {
        var subscription = source.subscribe(subscriber);
        subscription.add(this.callback);
        return subscription;
    };
    return FinallyOperator;
}());
//# sourceMappingURL=finalize.js.map