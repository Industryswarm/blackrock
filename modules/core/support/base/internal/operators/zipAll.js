"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipAll = void 0;
var zip_1 = require("../observable/zip");
var lift_1 = require("../util/lift");
function zipAll(project) {
    return function (source) { return lift_1.lift(source, new zip_1.ZipOperator(project)); };
}
exports.zipAll = zipAll;
//# sourceMappingURL=zipAll.js.map