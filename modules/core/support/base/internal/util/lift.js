"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stankyLift = exports.lift = void 0;
function lift(source, operator) {
    if (hasLift(source)) {
        return source.lift(operator);
    }
    throw new TypeError('Unable to lift unknown Observable type');
}
exports.lift = lift;
function stankyLift(source, liftedSource, operator) {
    if (hasLift(source)) {
        return source.lift.call(liftedSource, operator);
    }
    throw new TypeError('Unable to lift unknown Observable type');
}
exports.stankyLift = stankyLift;
function hasLift(source) {
    return source && typeof source.lift === 'function';
}
//# sourceMappingURL=lift.js.map