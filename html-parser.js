'use strict';

const	utils		= require('./utils'),

		escapeHTML	= utils.escapeHTML,

		whitespace			= /[\x20\t\r\n\f]/;

module.exports.parse	= parse;

function parse(html, onTag){
	var pos, lastPos = 0, c, len, tagStart = false, attrStart = false;
	var result	= '', r;
	for(len = html.length, pos = 0; pos < len; ++pos){
		c	= html.charAt(pos);
		// outside tag
		if(tagStart === false){
			// tag begins
			if(c == '<'){
				result		+=  escapeHTML(html.substring(lastPos, pos));
				tagStart	=	pos;
				lastPos		=	pos;
				// continue;
			}
		}
		// inside tag
		else {
			// outside cotes
			if(attrStart === false){
				//startQuote
				if(c === '"' || c ===  "'"){
					attrStart = c;

				}
				// closing tag
				else if(c == '>'){
					r		= onTag(html.substring(lastPos, pos + 1), lastPos, pos);
					lastPos	= pos + 1;
					// remove this tag body
					if(r === false){}
					// add this html
					else result += r;
				}
			}
			// inside quote
			else {
				// closing quote
				if(attrStart === c){
					attrStart = false;
					// continue;
				}
			}
		}
	}
	return result;
}