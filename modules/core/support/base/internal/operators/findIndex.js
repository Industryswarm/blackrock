"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findIndex = void 0;
var find_1 = require("../operators/find");
var lift_1 = require("../util/lift");
function findIndex(predicate, thisArg) {
    return function (source) { return lift_1.lift(source, new find_1.FindValueOperator(predicate, source, true, thisArg)); };
}
exports.findIndex = findIndex;
//# sourceMappingURL=findIndex.js.map