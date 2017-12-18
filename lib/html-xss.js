'use strict';
/**
 * BRSOLAB.com
 * HTML & CSS XSS filter
 *
 * xss.clean(html, options)		// remove js scripts frm the code
 * xss.cleanStyle(css, options)	// clean css from dangerouse code
 *
 * xss.escape(html)				// escape this html code
 * xss.unescape(html)			// escape this html code
 * xss.encode(html)				// escape this html code
 * xss.decode(html)				// escape this html code
 */

const	HtmlParser	= require('./html-parser'),
		cssXss		= require('./css-xss'),
		he			= require('he');

const	VOID		= function(){},
		ATTR_REGEXP	= /\s([\w-_]+)(?:\s*=\s*([\w-_]+|".*?(?!\\)"|'.*?(?!\\)'|""|''))?/g,
		DEF_OPTIONS	= {
			comments	: false,
			/**
			 * style	= false, // do not include style tag
			 * style	= true, // include style tag, do default filter
			 * style	= {
			 * 		@return {undefined} do default filter
			 * 		@return {false} remove this attribute
			 * 		@return {string} set this as the attribute value
			 * 		onAttr	: function(name, value){}
			 *
			 * 		// do aditional modifications on the attributes
			 * 		onEnd	: function(attrs){}
			 * }
			 */
			img			: true, // keep images
			style		: true, // keep style attribute
			id			: false, // keep id attribute
			class		: false, // keep class attribute

			onTag		: VOID
		};

const	VOID_TAGS	= ['img', 'br', 'hr', 'input', 'area', 'col', 'command', 'embed', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'base'],
		BLACKLIST	= ['script', 'input', 'link', 'meta', 'base', 'style', 'iframe', 'frame'],
		RM_TAG_ONLY	= ['html', 'head', 'body'];

module.exports	= {
	clean,
	escape,
	encode,
	unescape: decode,
	decode,

	cleanStyle	 : cssXss.cleanStyle,

	get voidTags(){return VOID_TAGS},
	get blackList(){return BLACKLIST}
}

/** tag helpers */
const TAG_HELPERS = {
	// get tagAttributes
	get attributes(){
		if(this.isEndTag) throw new Error('End tag could not have attributes: ' + this.tagBody);
		var attrs	= HtmlParser.parseAttr(this.tagBody);
		Object.defineProperty(this, 'attributes', {
			value	: attrs,
			writable: true
		});
		return attrs;
	},
	// clean attributes
	cleanAttributes	: function(options){
		var attrs	= this.attributes;
		var attr, i;
		if(!options) options = this._options;
		for(i in attrs){
			attr	= i.toLowerCase();
			if(attr.startsWith('on')) delete attrs[i]; // javascript
			else if(attr === 'style'){
				if(options.style)
					attrs[i] = cssXss.cleanStyle(attrs[i], options.style);
				else delete attrs[i];
			}
			else if(
				attr === 'id' && options.id === false
				|| attr === 'class' && options.class === false
				|| /javascript\s*\:/i.test(attrs[i])
			) delete attrs[i];
		}
	},
	// get HTML
	get html(){
		var html	= '<' + this.tagName;
		var attrs	= this.attributes;
		for(var i in attrs)
			html	+= ' ' + he.escape(i) + '="' + he.escape(attrs[i]) + '"';
		if(this.hasSingleTagMark)
			html	+= '/';
		html += '>';
		if(!this.isSingleTag && this.innerHTML !== false){ // case of <style> && <script>
			html += this.innerHTML;
			html += '</' + this.tagName + '>';
		}
		return html;
	}
};

/**
 *
 * @param {Object} options
 *        .allowCommentTag	: do not remove html comments
 *        .onTag(tagName, tagBody, startPosition, endPosition)	: callBack on each tag
 *        		@return {boolean} if returns === false: remove the tag whole body
 *        		@return {strin} replace with this string
 *        		@return {undefined} do the defaut behaviour
 */
function clean(html, options){
	var attr, isEndTag, isSingleTag, result, isBlackListed, tagInfo, hasSingleTagMark;
	// options
		if(!options) options = DEF_OPTIONS;
		else{
			for(attr in DEF_OPTIONS){
				if(!options.hasOwnProperty(attr))
					options[attr] = DEF_OPTIONS[attr];
			}
		}
	// remove comments
	if(!options.allowCommentTag)
		html	= html.replace(/<!--[\s\S]*?-->/g, '');
	// remove unwanted tags
	html	= HtmlParser.parse(html, (tagName, tagNameLC, tagBody, startPosition, lastPosition, innerHTML) => {
		try{
			// is endTag
			isEndTag	= tagBody.charAt(1) == '/';
			// is single tag
			hasSingleTagMark = tagBody.charAt(tagBody.length - 2) == '/';
			isSingleTag	= hasSingleTagMark || VOID_TAGS.indexOf(tagNameLC) != -1;
			// is blackListed
			isBlackListed = BLACKLIST.indexOf(tagNameLC) != -1;
			// user operations
				tagInfo	= {tagBody, isEndTag, isSingleTag, hasSingleTagMark, startPosition, lastPosition, isBlackListed};
				Object.defineProperties(tagInfo, {
					tagNameLC	: {value : tagNameLC},
					tagName		: {value : tagName},
					_options	: {value : options}
				});
			// innerHTML
				if(innerHTML !== undefined)	tagInfo.innerHTML	= innerHTML;
				else Object.defineProperty(tagInfo, 'innerHTML', {value : false});
				tagInfo.__proto__	= TAG_HELPERS;
			result	= options.onTag(tagInfo);
			// user specified value
			if(result === false)
				result = isSingleTag ? '' : false;
			else if(result !== undefined)
				result = result;
			// image
			else if(tagNameLC === 'img'){
				if(options.img === false) result = '';
				else{
					tagInfo.cleanAttributes();
					result = tagInfo.html;
				}
			}
			// blackList
			else if(isBlackListed)
				result = isSingleTag ? '' : false;
			// remove tag
			else if(RM_TAG_ONLY.indexOf(tagNameLC) != -1)
				result	= '';
			// end tags
			else if(isEndTag)
				result = '</' + tagName + '>';
			// clean attributes
			else{
				tagInfo.cleanAttributes();
				//TODO add clean innerHTML, case of "<style>"
				result = tagInfo.html;
			}
		} catch(e) {
			console.error('BRSOLAB-XSS>> ', e);
			result	= isSingleTag ? '' : false;
		}
		return result;
	});

	return html;
}

/** escape HTML */
function escape(html) { return he.escape(html); }
function encode(html) { return he.encode(html); }
function decode(html) { return he.decode(html); }