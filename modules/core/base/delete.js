/**
 * Delete Proxy Method
 *
 * @ignore
 * @param {object} obj - Object to Delete
 *
 * @description
 * This function deletes objects.
 *
 * @example
 * const quickDelete = require('quickdelete');
 */
module.exports = function QuickDelete(obj) {
    // noinspection JSAnnotator
    delete obj;
};