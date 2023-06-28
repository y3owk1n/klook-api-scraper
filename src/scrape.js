const axios = require("axios");
const fs = require("fs");
const converter = require("json-2-csv");

const random = (min, max) => {
	return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
};

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// axios get http
const getAxios = async (url) => {
	try {
		const response = await axios.get(url, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				Host: "www.klook.com",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
				"Accept-Language": "en-GB,en;q=0.9",
				"Accept-Encoding": "gzip, deflate, br",
				Currency: "MYR",
			},
		});
		return response.data;
	} catch (error) {
		console.log("error", error);
	}
};

const getAxiosAgent = async (url) => {
	try {
		const cookies =
			"encrypted_token=AQICAHgTRpIhhmT4jUmXILU4oC36nUpCIm9YDFJGUqpSfkRmdQFhPuD1Sah/gPYM9uQZPS7NAAAAizCBiAYJKoZIhvcNAQcGoHsweQIBADB0BgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDBHAA2IIa1h8HMa9OQIBEIBHQvDLIS9ewVZn4fEZL+n9hDW0+9AttJWA4tqN/QZ5vVqHky0D/tD9ComcvELbKUFjqYx360e6dslG6JMCxOBCOnX8nolYXrU=; _pt=B48js7WO3j0EknvjQBeLJxJOJI8CsGFOELuYU-jxz9U_; cookie1=1";

		const response = await axios.get(url, {
			headers: {
				Accept: "*/*",
				Host: "klook.klktech.com",
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
				"Accept-Language": "en_US",
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

const getMaxPages = async (locationID) => {
	const url = `https://www.klook.com/v2/usrcsrv/search/country/${locationID}/activities`;
	if (!locationID) return;
	await delay(random(5, 10));
	const data = await getAxios(url);
	const maxPage = Math.ceil(data.result.total / perPage);
	return maxPage;
};

const convertToCSV = async (JSONData) => {
	try {
		const parsedData = JSON.parse(JSONData);

		const csv = await converter.json2csvAsync(parsedData, {
			unwindArrays: true,
		});

		// print CSV string
		// console.log(csv);

		// write CSV to a file
		fs.writeFileSync("./src/output/products.csv", csv);

		console.log("converted to csv");
	} catch (err) {
		console.log(err);
	}
};

const getProducts = async (locationID) => {
	const maxPage = await getMaxPages(locationID);
	const finalProductsArray = [];
	console.log("Scraping total pages of:", maxPage);
	for (let i = 1; i <= maxPage; i++) {
		// for (let i = 1; i <= 1; i++) {
		const url = `https://www.klook.com/v2/usrcsrv/search/country/${locationID}/activities?start=${i}&size=${perPage}`;
		await delay(random(3, 5));
		const data = await getAxios(url);
		// const products = [data.result.items[0]]; //to be updated without array
		const products = data.result.activities;
		console.log(
			`  Scraping page: ${i} of ${maxPage} with ${products.length} results`
		);
		// console.log("1", products);
		for (const product of products) {
			const productsArray = [];
			const product_id = product.id;
			const title = product.title;
			const review_total = product.review_total;
			const product_link = product.deeplink;

			console.log(`    -----------------------------------`);
			console.log(`    Scraping #${product_id} - ${title}`);

			const url = `https://www.klook.com/v1/usrcsrv/activity/rail/presale/info?activity_id=${product_id}`;
			await delay(random(3, 5));
			const data = await getAxios(url);
			if (Object.entries(data.result).length === 0) continue;
			console.log(
				`    #${product_id} - ${title} - has ${data.result.packages.length} variations`
			);
			const variationsID = data.result.packages.map((variation) => {
				return variation.package_id;
			});
			for (const variationID of variationsID) {
				console.log(`    Scraping #${variationID}`);
				const url = `https://www.klook.com/v2/usrcsrv/packages/schedules_and_units?package_id=${variationID}&preview=0`;
				const agentUrl = `https://klook.klktech.com/v1/agentwebserv/${variationID}/skus/basic`;
				await delay(random(3, 5));
				console.log(
					`    Getting variation data for ${variationID} from Klook`
				);
				const data = await getAxios(url);
				console.log(
					`      Getting variation data for ${variationID} from Klook Agent`
				);
				const agentData = await getAxiosAgent(agentUrl);
				// console.log(3, data);
				const variationDetailUrl = `https://www.klook.com/v1/usrcsrv/packages/${variationID}/base/published?preview=0`;
				await delay(random(3, 5));
				console.log(
					`      Getting variation data detail for ${variationID} from Klook`
				);
				const variationDetail = await getAxios(variationDetailUrl);
				// console.log(3.5, variationDetail);
				const package_name = variationDetail.result[0].package_name;
				// console.log("3.1", variationID);
				// if (data !== undefined) continue;
				// if (Object.entries(data.result).length !== 0) continue;
				// if (variationID) continue;
				const firstSchedule = data.result.schedules[0].date;
				const firstScheduleUnix = Math.floor(
					new Date(
						new Date(firstSchedule).setHours(8, 0, 0, 0)
					).getTime() / 1000
				);
				console.log(
					`      #${variationID} - ${firstSchedule} - ${firstScheduleUnix}`
				);
				// console.log(`First schedule for ${variationID} = ${firstScheduleUnix}`);

				const UnixIDCombined =
					firstScheduleUnix.toString() + variationID.toString();
				console.log(
					`      Combined query params for ${variationID} = ${UnixIDCombined}`
				);
				const pricesUrl = `https://www.klook.com/v1/usrcsrv/arrangements/${UnixIDCombined}/units?preview=0`;
				// console.log("3.4", pricesUrl);
				await delay(random(3, 5));
				console.log(`      Getting prices for ${UnixIDCombined}`);
				const pricesUrlData = await getAxios(pricesUrl);
				// console.log(4, pricesUrlData);
				// if (pricesUrlData !== undefined) continue;
				// if (Object.entries(pricesUrlData.result).length !== 0) continue;
				// if (pricesUrlData.result.prices !== null) continue;
				const pricesData = pricesUrlData.result.prices;
				// console.log("pricesData", pricesData);

				const variationsMap = pricesData.map((price) => {
					const matchingArray = agentData.result[variationID].filter(
						(package) => package.sku_id === price.sku_id
					);

					return {
						name: price.name,
						price: "MYR" + " " + price.price,
						market_price: "MYR" + " " + price.market_price,
						agent_price: matchingArray.length
							? `MYR ${matchingArray[0].selling_price}`
							: null,
						agent_market_price: matchingArray.length
							? `MYR ${matchingArray[0].market_price}`
							: null,
						minimum_selling_price:
							matchingArray.length &&
							matchingArray[0].minimum_selling_prices.length
								? `MYR ${matchingArray[0].minimum_selling_prices[0].value}`
								: null,
					};
				});

				console.log(
					`      Pushing variation details for ${UnixIDCombined} to data`
				);
				console.log(`      -----------------------------------`);
				productsArray.push({
					package_name,
					variationsDetail: variationsMap,
				});
			}
			console.log(
				`Pushing final product ${product_id} - ${title} to data`
			);
			finalProductsArray.push({
				product_id,
				title,
				review_total,
				product_link,
				variations: productsArray,
			});
		}
	}
	console.log("all completed");

	fs.writeFile(
		"./src/output/products.json",
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
