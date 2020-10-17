'use strict';
const fs = require('fs');
const https = require('https');
const alfy = require('alfy');
const algoliasearch = require('algoliasearch');

const client = algoliasearch(
	'0H4SMABBSG',
	'9670d2d619b9d07859448d7628eea5f3'
);
const index = client.initIndex('Post_production');

function download(filename, url, callback) {
	let file = fs.createWriteStream(filename);

	https.get(url, function (response) {
		if (callback !== undefined) {
			response.pipe(file).on('finish', () => {
				callback(file);
			});
		}
	});
}

(async () => {
	const {hits} = await index.search({
		query: alfy.input,
		hitsPerPage: 9
	});

	const results = hits.map(hit => {
		const iconPath = `${__dirname}/media/${hit.id}`;

		const result = {
			uid: hit.id,
			title: hit.name,
			subtitle: `${hit.vote_count} votes · ${hit.comments_count} comments · ${hit.tagline}`,
			arg: `https://producthunt.com${hit.url}`,
			icon: {
				path: iconPath
			},
			mods: {
				cmd: {
					arg: hit.product_links[0].url,
					subtitle: `${hit.product_links[0].store_name}: ${hit.product_links[0].url}`
				}
			}
		};

		return result;
	});

	hits.forEach(hit => {
		const iconPath = `${__dirname}/media/${hit.id}`;
		const iconUrl = `https://ph-files.imgix.net/${hit.thumbnail.image_uuid}?auto=format&fit=crop&h=128&w=128`;

		fs.exists(iconPath, exists => {
			if (!exists) {
				download(iconPath, iconUrl, () => {
					return true;
				});
			}
		});
	});

	alfy.output(results);
})();
