"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeout = void 0;
var async_1 = require("../scheduler/async");
var TimeoutError_1 = require("../util/TimeoutError");
var timeoutWith_1 = require("./timeoutWith");
var throwError_1 = require("../observable/throwError");
var defer_1 = require("../observable/defer");
function timeoutErrFactory() { return throwError_1.throwError(new TimeoutError_1.TimeoutError()); }
function timeout(due, scheduler) {
    if (scheduler === void 0) { scheduler = async_1.async; }
    return timeoutWith_1.timeoutWith(due, defer_1.defer(timeoutErrFactory), scheduler);
}
exports.timeout = timeout;
//# sourceMappingURL=timeout.js.map