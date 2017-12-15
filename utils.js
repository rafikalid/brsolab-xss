'use strict';

module.exports.escapeHTML	= function(str){
	return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};