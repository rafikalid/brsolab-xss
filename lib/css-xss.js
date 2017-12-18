'use strict';

const	WHITELIST	= /^(?:background|border|box|break|clear|color|display|font|height|letter|lighting|list-style|margin|max-height|max-width|min-height|min-width|padding|text|width|word)/i,
		JS_REGEX	= /javascript\s*:|^expression/i,
		DEFAULT_OPTIONS = {};
module.exports.cleanStyle	= function(str, options){
	var uValue, attr;
	if(!options) options	= DEFAULT_OPTIONS;
	var values	= _parser(str, (name, value) => {
		// use sepecified Value
		if(options.onAttr)
			uValue	= options.onAttr(name, value);
		else uValue = undefined;

		// default
		if(uValue === undefined){
			if(!WHITELIST.test(name) || JS_REGEX.test(value))
				uValue	= false;
		}
		return uValue;
	});

	// additional modifications on the attributes
	if(options.onEnd)
		options.onEnd(values);
	// return values
	uValue = [];
	for(attr in values)
		uValue.push(attr + ':' + values[attr]);
	return uValue.join(';');
};


/** parser */
function _parser(str, onAttr){
	var name, value, v, quote, len, pos, lastPos = 0, c;
	var values	= {};
	try{
		var _add = (() => {
			if(name){
				value	= str.substring(lastPos, pos).trim();
				v		= onAttr(name, value);
				if(v !== false)
					values[name] = (v === undefined ? value : v);
			}
		});
		for(len = str.length, pos=0; pos < len; ++pos){
			c	= str.charAt(pos);
			if(c == '\\') ++pos; //escape next character
			if(quote){
				if(c === quote)
					quote	= false;
			}
			else if(c === ':'){
				name	= str.substring(lastPos, pos).trim();
				lastPos	= pos + 1;
			}
			else if(c === ';'){
				_add();
				lastPos = pos + 1;
			}
			else if(c === '"' || c === "'")
				quote = c;
		}
		if(lastPos < pos) _add();
	}catch(e){ console.error('BRSOLAB-XSS', e); }
	return values;
}