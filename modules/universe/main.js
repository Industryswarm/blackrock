/*!
* INode Blackrock Universe Module
*
* Copyright (c) 2020 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	/** Create parent event emitter object from which to inherit ismod object */
	String.prototype.endsWith = function(suffix) {return this.indexOf(suffix, this.length - suffix.length) !== -1;};
	var isnode, ismod;

	/**
	 * (Constructor) Initialises the module
	 * @param {object} isnodeObj - The parent isnode object
	 */
	var init = function(isnodeObj){
		isnode = isnodeObj, ismod = new isnode.ISMod("Universe"), log = isnode.module("logger").log
		return ismod;
	}

	/**
	 * (Internal) Export The Module
	 * @param {object} isnodeObj - The parent isnode object
	 */
	module.exports = init;
}();