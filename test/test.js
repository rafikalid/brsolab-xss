const	xss = require('../'),
		fs	= require('mz/fs'),
		request	= require('request');


var testURL		= 'http://www.lefigaro.fr/flash-actu/2018/01/23/97001-20180123FILWWW00029-tokyo-des-blesses-et-des-voyageurs-bloques.php';
// var testURL		= 'https://www.ouest-france.fr/monde/japon/japon-tokyo-sous-la-neige-un-volcan-provoque-une-avalanche-5518563';
var outputBefore	= 'test/before-filter.htm';
var outputAfter		= 'test/after-filter.htm';

console.log('connecting>> ', testURL);
request(testURL, (err, response, body) => {

	console.log('write>> ', outputBefore);
	fs.writeFile(outputBefore, body)
		.then(() => {
			console.log('Filter>>');
			body = xss.clean(body,{
				onTag	: tagInfo => {
					try{
						if(tagInfo.tagNameLC === 'img'){
							// console.log('img>> ', tagInfo.attributes.src)
						}
					}catch(err){ console.error('chromeImg>> ', err); return false; }
				}
			});
			console.log('write>> ', outputAfter);
			return fs.writeFile(outputAfter, body);
		})
		.then(a => { console.log('DONE>> ') })
		.catch(err => { console.log('ERR>> ', err) });
		
});
