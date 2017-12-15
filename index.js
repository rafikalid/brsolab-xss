/**
 * BRSOLAB.com
 * HTML & CSS XSS filter
 *
 * xss.clean(html)			// remove js scripts frm the code
 * xss.cleanCSS(css)		// clean css from dangerouse code
 * xss.noImages(html|css	// remove js and images from the code
 * xss.compile(options)
 * 			.clean(html)	// use those options to clean the css
 * 			.cleanCSS(css)	// clean css
 *
 * xss.escape(html)			// escape this html code
 */

const HtmlParser	= require('./html-parser');

const DEF_OPTIONS	= {};

module.exports.clean	= xssHTML;

function xssHTML(html, options){
	// options
		if(!options) options = DEF_OPTIONS;
		else{
			//TODO
		}
	// remove comments
	if(!options.allowCommentTag)
		html	= html.replace(/<!--[\s\S]*?-->/g, '');
	// remove unwanted tags
	html	= HtmlParser.parse(html, (tagBody, startPosition, lastPosition) => {
		console.log('TAG>> ', tagBody);
	});
}