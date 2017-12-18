'use strict';

const	he				= require('he');

const	whitespace		= /[\x20\t\r\n\f]/;

module.exports.parse	= parse;
module.exports.parseAttr= parseAttr;

function parse(html, onTag){
	var pos, lastPos = 0, lastPos2 = 0, c, len, tagStart = false, attrStart = false;
	var result	= '', r, str, tagName, tagNameLC;
	var rmTag	= false, rmTagC = 0;
	var scriptStyle	= false, scriptStyleLen;
	for(len = html.length, pos = 0; pos < len; ++pos){
		c	= html.charAt(pos);
		// style or script
		if(scriptStyle){
			if(c == '<'){
				r	= html.substr(pos + 1, scriptStyleLen).toLowerCase();
				c	= html.charAt(pos + scriptStyleLen + 1);
				if( (r === '/' + scriptStyle) && ( c === '>' || whitespace.test(c) ) ){
					r		= onTag(tagName, tagNameLC, str, lastPos2, pos + scriptStyleLen, html.substring(lastPos, pos));
					// escape this tag
					pos 	= html.indexOf('>', pos); // escape
					if(pos == -1) pos = len;
					// remove this tag body
					if(r === false){}
					// add html as it is
					else if(r === true)
						result	+= html.substring(lastPos2, pos);
					// add this html
					else result += r;
					scriptStyle = false;
					lastPos = pos + 1;
				}
			}
		}
		// outside tag
		else if(tagStart === false){
			// tag begins
			if(c == '<'){
				if(rmTag === false)
					result		+=  html.substring(lastPos, pos);
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
					try{
						str		= html.substring(lastPos, pos + 1);
						// tag name
						tagName		= str.match(/^<[\/!]?([\w-]*)/)[1];
						tagNameLC	= tagName.toLowerCase();
						// script or style
						if(tagNameLC === 'script' || tagNameLC === 'style'){
							scriptStyle		= tagNameLC;
							scriptStyleLen	= scriptStyle.length + 1;
							lastPos2		= lastPos;
						}
						// other tags
						else{
							r		= onTag(tagName, tagNameLC, str, lastPos, pos);
							// remove this tag body
							if(r === false){}
							// add html as it is
							else if(r === true)
								result	+= str;
							// add this html
							else result += r;
						}
						lastPos	= pos + 1;
						tagStart= false;
					} catch(e) {
						console.error('BRSOLAB-XSS>>', e);
					}
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

/** parse attributes */
function parseAttr(tagBody){
	var result	= {};
	var len, c, attrName, str,
		state	= 0, // state: [0: no attr, 1: attrName, 2: before = , 3: after =, 4: attrValue]
		quote	= false,
		lastPos	= 0,
		pos		= tagBody.match(/\s/);
	// add value
	var _add =(() => {
		if(state === 1){
			attrName	= tagBody.substring(lastPos, pos);
			result[attrName] = attrName;
			state = 2;
		}
		else if(state === 4){
			result[attrName] = he.decode(tagBody.substring(lastPos, pos));
			state	= 0;
		}
	});
	// loop
	if(pos) for(len = tagBody.length, pos = pos.index + 1; pos < len; ++pos){
		c = tagBody.charAt(pos);
		//escape next char
		if(c == '\\') ++pos;
		// quote
		else if(quote !== false){
			// end quote
			if(quote === c){
				quote = false;
				_add();
			}
		}
		else if(c === '"' || c === "'"){
			quote	= c;
			state	= state == 3 ? 4 : 1;
			lastPos = pos + 1;
		}
		// equal
		else if(c === '='){
			_add();
			if(state == 1 || state == 2) state = 3;
			else throw new Error('incorrect tagBody');
		}
		// white space
		else if(whitespace.test(c))
			_add();
		// end
		else if(c === '>' || c === '/')
			_add();
		// word char
		else{
			if(state === 1 || state === 4){} //attr name or value
			else{
				lastPos = pos;
				if(state === 3) state = 4;
				else state = 1;
			}
		}
	}
	return result;
}