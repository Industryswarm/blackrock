"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineAll = void 0;
var combineLatest_1 = require("../observable/combineLatest");
var lift_1 = require("../util/lift");
function combineAll(project) {
    return function (source) { return lift_1.lift(source, new combineLatest_1.CombineLatestOperator(project)); };
}
exports.combineAll = combineAll;
//# sourceMappingURL=combineAll.js.map