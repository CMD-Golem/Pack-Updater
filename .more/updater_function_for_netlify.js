// https://stackoverflow.com/a/6832706/14225364
function compare(a, b) {
	if (a === b) { return false; }

	var a_components = a.split(".");
	var b_components = b.split(".");

	// loop while the components are equal
	for (var i = 0; i < 3; i++) {
		if (parseInt(a_components[i]) > parseInt(b_components[i])) { return false; }
		if (parseInt(a_components[i]) < parseInt(b_components[i])) { return true; }
	}
}

// Handler
exports.handler = async function(event, context) {
	// get counter id from url
	//cmd-golem.netlify.app/.netlify/functions/pack_updater/windows/0.1.0
	var current_str = event.path.match(/([^\/]*)\/*$/)[0];
	var target = event.path.replace("/" + current_str, "").match(/([^\/]*)\/*$/)[0];

	console.log(current_str);

	var newest_str = "0.1.1";
	
	var update_needed = compare(current_str, newest_str)

	if (update_needed) {
		json_body = {
			url: "https://raw.githubusercontent.com/CMD-Golem/Pack-Updater/main/release_bundle/datapack_updater_0.1.1_x64_en-US.msi.zip",
			version: newest_str,
			notes: "Test note",
			pub_date: new Date().toISOString(),
			signature: process.env.PACK_UPDATER_SECRET
		}

		// return aviable update
		return {
			statusCode: 200,
			body: JSON.stringify(json_body)
		}
	}
	else {
		// return no update aviable
		return {
			statusCode: 204
		}
	}
}