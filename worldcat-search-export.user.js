// ==UserScript==
// @name         WorldCat Search Export
// @namespace    https://github.com/zhuth/
// @version      0.1.2
// @description  Fetch WorldCat Search Results and save to local machine
// @author       zhuth
// @match        https://www.worldcat.org/search*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.0.2/jszip-utils.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const $ = window.jQuery;
    const refineYourSearch = window.refineYourSearch;
    var flag = false;

    function parseQuery(queryString) {
        var query = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }

    var p = 1;
    var count = Math.min(5000, +$('.resultsinfo strong:nth-child(2)').slice(1).text().replace(/,/g, ''));
    const query = parseQuery(location.search);
    const q = query.q.replace(/[%\?\\\/#:]/, '_');
    const sortby = query.se || 'yr';
    const order = query.sd || 'asc';

    var zip = new JSZip();

    console.log(p, count, query);

    $(document).ajaxComplete(function(){
        if (!flag) return;
        if (p < count) {
            setTimeout(function (){
                var d = $('.result.details').map((i, x) => {
                    return {
                        name: $(x).find('.name').text().trim(),
                        author: ($(x).find('.author').text() || '').trim().split(/[:：]/).slice(1).join(': ').trim(),
                        publisher: $(x).find('.publisher').text().trim().split(/[:：]/).slice(1).join(': ').trim(),
                        type: $(x).find('.type').text().trim().split(/[:：]/).slice(1).join(': ').trim()
                    };
                }).toArray();
                zip.file('' + parseInt(p/10+1) + '.json', JSON.stringify(d));
                refineYourSearch(p+10, sortby, order);
                p+=10;
            }, 300);
        } else {
            zip.generateAsync({type:"blob"})
                .then(function(content) {
                saveAs(content, [q, sortby, order, count].join('-') + ".zip");
            });
            flag = false;
        }
    }).on('click', 'a.start-fetching', function (){
        flag = true;
        if (count == 5000)
            alert('Warning: Probably exceeds 5000 results. Please change query condition if possible.');
        jQuery(document).trigger('ajaxComplete');
    });

    $('.scopesummary').append(' | <a href="javascript:void(0);" class="start-fetching">Start Fetching</a>');

})();
