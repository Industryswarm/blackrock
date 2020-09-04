"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.raceWith = exports.race = void 0;
var isArray_1 = require("../util/isArray");
var race_1 = require("../observable/race");
var lift_1 = require("../util/lift");
function race() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    if (observables.length === 1 && isArray_1.isArray(observables[0])) {
        observables = observables[0];
    }
    return raceWith.apply(void 0, observables);
}
exports.race = race;
function raceWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return function raceWithOperatorFunction(source) {
        if (otherSources.length === 0) {
            return source;
        }
        return lift_1.stankyLift(source, race_1.race.apply(void 0, __spreadArrays([source], otherSources)));
    };
}
exports.raceWith = raceWith;
//# sourceMappingURL=raceWith.js.map