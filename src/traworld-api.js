const { createHash } = require("crypto");
const fetch = require("node-fetch");
const converter = require("json-2-csv");
const fs = require("fs");

const convertToCSV = async (JSONData) => {
	try {
		const parsedData = JSON.parse(JSON.stringify(JSONData));

		const csv = await converter.json2csvAsync(parsedData, {
			unwindArrays: true,
		});

		fs.writeFileSync("./src/traworld-output/products.csv", csv);

		console.log("converted to csv");
	} catch (err) {
		console.log(err);
	}
};

// Construct Form Url Encoded
const formUrlEncoded = (payload) => {
	let formBody = [];
	for (let property in payload) {
		let encodedKey = encodeURIComponent(property);
		let encodedValue = encodeURIComponent(payload[property]);
		formBody.push(encodedKey + "=" + encodedValue);
	}
	formBody = formBody.join("&");

	return formBody;
};

// Post Request Handler
const postAxios = async (url, payload) => {
	// Get Form Url Encoded
	const formBody = formUrlEncoded(payload);

	// Form Url Encoded
	try {
		const response = await fetch(url, {
			method: "POST",
			body: formBody,
			headers: {
				"content-type":
					"application/x-www-form-urlencoded;charset=UTF-8",
			},
		});
		return await response.json();
	} catch (error) {
		console.log("Error: ", error);
	}
};

// API Configurations
const apiServer = `https://www.traworld.com`;
const apiLanguage = `en-GB`;
const apiSite = `sapi2477`;
const apiVersion = `1.0.0`;

// API Secrets
const secret_key = `-#7Aq^B7kWJ`;
const encryption_iv = `3?jhAYuKV=u!QkFz`;

const getProductInfo = async () => {
	// Api Route
	const apiRoute = `get-product-info`;
	const apiUrl = `${apiServer}/${apiLanguage}/${apiSite}/${apiVersion}/${apiRoute}`;

	// WSID
	const imei = Math.floor(10000000 + Math.random() * 90000000); // 8 random digits, should be an actual IMEI of a device but for this example we will use a random number
	const timestamp = new Date().getTime() / 1000; // Unix Timestamp
	const wsid = `${imei}${timestamp}`; // IMEI+timestamp, the documentation is wrong, should not have ':' between imei and timestamp

	// Public Key
	const publicKey = Math.random().toString(36).substring(2, 7); // 5 random string, use to encrypt and decrypt the parameters

	const page = 1;
	const records_per_page = 179;
	const currency = "MYR";

	// Hash for signature
	const hashingString = `${page}${records_per_page}${currency}${wsid}${secret_key}${publicKey}`;
	const hashAlgorithm = `sha256`;
	const hashedString = createHash(hashAlgorithm)
		.update(hashingString)
		.digest("hex");
	const signature = `${hashedString}:${publicKey}`;

	// Create payload
	const payload = {
		page, // optional
		records_per_page, // optional
		currency, // optional
		wsid, // required
		signature, // required
	};

	// Post request
	const data = await postAxios(apiUrl, payload);

	console.log(data);
	if (data.code !== 100) {
		console.log("API Error: ", data.message);
		return;
	}

	if (data.data.service_list.total_pages !== 1) {
		console.log(
			"Record per page must be ",
			data.data.service_list.total_records
		);
		return;
	}

	if (
		Number(data.data.service_list.item_per_page) !==
		data.data.service_list.total_records
	) {
		console.log("Only 1 page is allowed");
		return;
	}

	const finalData = data.data.service_list.list.map((item) => {
		return {
			service_name: item.service_name,
			merchant_name: item.merchant_name,
			url: Object.entries(item)[13][1],
			google_drive_link: "",
		};
	});

	// await convertToCSV(finalData);
	return data;
};

getProductInfo();
