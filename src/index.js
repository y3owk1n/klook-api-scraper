const axios = require("axios");
const fs = require("fs");
const converter = require("json-2-csv");

/**
 *
 * @param {number} min
 * @param {number} max
 * @returns A random number between min (inclusive) and max (exclusive)
 */
const random = (min, max) => {
	return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
};

/**
 *
 * @param {number} ms
 * @returns Delay a function in ms
 */
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Axios get request on host www.klook.com
 * @param {string} url
 * @returns axios response object
 */
const getAxios = async (url) => {
	try {
		const response = await axios.get(url, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				Host: "www.klook.com",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
				// "Accept-Language": "zh_TW", //Traditional Chinese
				// "Accept-Language": "zh_CN", //Simplified Chinese
				"Accept-Language": "en-GB,en;q=0.9", //English
				"Accept-Encoding": "gzip, deflate, br",
				Currency: "MYR",
			},
		});
		return response.data;
	} catch (error) {
		console.log("error", error);
	}
};

/**
 * Axios get request on host klook.klktech.com
 * @param {string} url
 * @returns axios response object
 */
const getAxiosAgent = async (url) => {
	try {
		const cookies =
			"_pt=rOz4*g9v6mRdqL7MHkhGf7Bl1Aq-*wo1hUlvIoJWhA4_; cookie1=1; encrypted_token=AQICAHgTRpIhhmT4jUmXILU4oC36nUpCIm9YDFJGUqpSfkRmdQG6fh3K29yqbiUNQN4W/7eIAAAAizCBiAYJKoZIhvcNAQcGoHsweQIBADB0BgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDFxm/1CeICI7Zv12uwIBEIBHUG7Temhn2e5P9FjMLDdS+vg2pafdK2n/NEW+5eUeihmQA26O1gZexZeQeIDiY40m0lP/lFtEUEEcF3TiX+W2Fa7WKndVHiM=";

		const response = await axios.get(url, {
			headers: {
				Accept: "*/*",
				Host: "klook.klktech.com",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
				// "Accept-Language": "zh_TW", //Traditional Chinese
				// "Accept-Language": "zh_CN", //Simplified Chinese
				"Accept-Language": "en_US", //English
				"Accept-Encoding": "gzip, deflate, br",
				Currency: "MYR",
				Cookie: cookies,
			},
		});
		return response.data;
	} catch (error) {
		console.log("error", error);
	}
};

const perPage = 15;

/**
 * Get maximum page numbers to scrap
 * @param {string} locationID
 * @returns Number of pages to scrap
 */
const getMaxPages = async (locationID) => {
	const url = `https://www.klook.com/v2/usrcsrv/search/country/${locationID}/activities`;
	if (!locationID) return;
	await delay(random(1, 3));
	const data = await getAxios(url);
	const maxPage = Math.ceil(data.result.total / perPage);
	return maxPage;
};

/**
 * Convert JSON data to CSV
 * @param {object} JSONData
 */
const convertToCSV = async (JSONData) => {
	try {
		const parsedData = JSON.parse(JSON.stringify(JSONData));

		const csv = await converter.json2csvAsync(parsedData, {
			unwindArrays: true,
		});

		fs.writeFileSync("./output/products.csv", csv);

		console.log("converted to csv");
	} catch (err) {
		console.log(err);
	}
};

/**
 * Get product data from klook & klook merchant API
 * @param {string} locationID
 */
const getProducts = async (locationID) => {
	const maxPage = await getMaxPages(locationID);
	const finalProductsArray = [];
	console.log("Scraping total pages of:", maxPage);
	for (let i = 1; i <= maxPage; i++) {
		const url = `https://www.klook.com/v2/usrcsrv/search/country/${locationID}/activities?start=${i}&size=${perPage}`;
		await delay(random(1, 1));
		const data = await getAxios(url);

		const products = data.result.activities;
		for (const product of products) {
			const productsArray = [];
			const product_id = product.id;
			const title = product.title;
			const review_total = product.review_total;
			const product_link = product.deeplink;
			const city_name = product.city_name;
			const booked = product.participate;

			console.log(
				`  Scraping page: ${i} of ${maxPage} with ${products.length} results`
			);
			console.log(`    -----------------------------------`);
			console.log(`    Scraping #${product_id} - ${title}`);

			const url = `https://www.klook.com/v1/usrcsrv/activity/rail/presale/info?activity_id=${product_id}`;
			await delay(random(1, 3));
			const data = await getAxios(url);
			if (Object.entries(data.result).length === 0) continue;
			console.log(
				`    #${product_id} - ${title} - has ${data.result.packages.length} variations`
			);
			const variationsID = data.result.packages.map((variation) => {
				return variation.package_id;
			});
			for (const variationID of variationsID) {
				console.log(`      Scraping #${variationID}`);
				const url = `https://www.klook.com/v2/usrcsrv/packages/schedules_and_units?package_id=${variationID}&preview=0`;
				const agentUrl = `https://klook.klktech.com/v1/agentwebserv/${variationID}/skus/basic`;
				await delay(random(1, 1));
				console.log(
					`      Getting variation data for ${variationID} from Klook`
				);
				const data = await getAxios(url);
				console.log(
					`      Getting variation data for ${variationID} from Klook Agent`
				);
				const agentData = await getAxiosAgent(agentUrl);

				const variationDetailUrl = `https://www.klook.com/v1/usrcsrv/packages/${variationID}/base/published?preview=0`;
				await delay(random(1, 1));
				console.log(
					`      Getting variation data detail for ${variationID} from Klook`
				);
				const variationDetail = await getAxios(variationDetailUrl);

				const package_name = variationDetail.result[0].package_name;

				if (data.result.schedules !== null) {
					const firstSchedule =
						data.result.schedules[0].time_slots[0].arrangement_id;

					console.log(`      #${variationID} - ${firstSchedule}`);

					const pricesUrl = `https://www.klook.com/v1/usrcsrv/arrangements/${firstSchedule}/units?preview=0`;

					await delay(random(1, 3));
					console.log(`      Getting prices for ${firstSchedule}`);
					const pricesUrlData = await getAxios(pricesUrl);

					const pricesData = pricesUrlData.result.prices;

					console.log(`      Login Status: ${agentData.success}`);
					const variationsMap = pricesData.map((price) => {
						const matchingArray =
							agentData.result &&
							agentData.result[variationID] &&
							agentData.result[variationID].length
								? agentData.result[variationID].filter(
										(package) =>
											package.sku_id === price.sku_id
								  )
								: [];

						return {
							name: price.name,
							price: price.price,
							market_price: price.market_price,
							agent_price: matchingArray.length
								? matchingArray[0].selling_price
								: null,
							agent_market_price: matchingArray.length
								? matchingArray[0].market_price
								: null,
							minimum_selling_price:
								matchingArray.length &&
								matchingArray[0].minimum_selling_prices.length
									? matchingArray[0].minimum_selling_prices[0]
											.value
									: null,
						};
					});

					console.log(
						`      Pushing variation details for ${firstSchedule} to data`
					);
					console.log(`      -----------------------------------`);
					productsArray.push({
						package_name,
						variationsDetail: variationsMap,
					});
				} else {
					productsArray.push({
						package_name: null,
						variationsDetail: {
							name: null,
							price: null,
							market_price: null,
							agent_price: null,
							agent_market_price: null,
							minimum_selling_price: null,
						},
					});
				}
			}
			console.log(
				`Pushing final product ${product_id} - ${title} to data`
			);
			finalProductsArray.push({
				product_id,
				title,
				review_total,
				product_link,
				city_name,
				booked,
				variations: productsArray,
			});
			fs.writeFile(
				"./output/products.json",
				JSON.stringify(finalProductsArray),
				(err) => {
					console.log("error", err);
				}
			);
			console.log("saved into json");

			await convertToCSV(finalProductsArray);
		}
	}
	console.log("all completed");

	fs.writeFile(
		"./output/products.json",
		JSON.stringify(finalProductsArray),
		(err) => {
			console.log("error", err);
		}
	);
	console.log("saved into json");

	await convertToCSV(finalProductsArray);
};

// 19 = Malaysia
getProducts(19);
