var packs, html, pack_array = [];

var type_identifier = "DP";
var no_type_identifier = false;
var datatable = document.getElementById("datatable");

var test;

async function selectMainFolder() {
	// var path = await window.__TAURI__.dialog.open({
	// 	recursive: true,
	// 	multiple: false,
	// 	directory: true
	// });

	// var org_pack_array = await window.__TAURI__.fs.readDir(path, {recursive:true});

	test = org_pack_array;
	var org_pack_array = var_pack_array;

	// Get Subpacks
	for (var i = 0; i < org_pack_array.length; i++) {
		var file_array = [];
		var org_file_array = org_pack_array[i].children;

		for (var j = 0; j < org_file_array.length; j++) {
			if (org_file_array[j].children == undefined) {
				file_array.push(org_file_array[j]);
			}
			else {
				pack_name = org_pack_array[i].name + " " + org_file_array[j].name;
				pack_array.push({name:pack_name, path:org_file_array[j].path, children:org_file_array[j].children});
			}
		}

		pack_array.push({name:org_pack_array[i].name, path:org_pack_array[i].path, children:file_array});
	}

	// Show Packs in list
	html = '<tr><th class="checkbox_row"><input type="checkbox" onclick="selectAll()"></th><th class="pack_name_row">Pack Name</th><th class="save_as_row">Save as</th></tr>';

	for (var i = 0; i < pack_array.length; i++) {
		var html_pack = "";
		var children_array = pack_array[i].children;

		for (var j = 0; j < children_array.length; j++) {
			console.log(children_array[j])
			if (!children_array[j].name.includes(type_identifier) || no_type_identifier) {
				continue;
			}
			// Other method to detect newest item (last item could be that it hasnt type_identifier) or remove items in "Get Subpacks" section
			if (j == children_array.length - 1) {
				html_pack += `<option value="${children_array[j].path}" selected>${children_array[j].name}</option>`;
				var normal_duplicate_name = children_array[j].name;
				var normal_duplicate_path = children_array[j].path;
			}
			else {
				html_pack += `<option value="${children_array[j].path}">${children_array[j].name}</option>`;
			}
		}
		
		if (html_pack != "") {
				html += `
				<tr id="${i}" data-path="${normal_duplicate_path}">
					<td><input type="checkbox"></td>
					<td>${pack_array[i].name}</td>
					<td><select onchange="changeDuplicateFrom(this)">${html_pack}</select></td>
					<td><input type="text" value="${normal_duplicate_name}"></td>
				</tr>`;
		}
	}
	datatable.innerHTML = html;
}

selectMainFolder()


async function saveFiles(path) {
	var zip = new JSZip();
	var file = await window.__TAURI__.fs.readBinaryFile(path);
	await zip.loadAsync(file);

	console.log("download");

	zip.generateAsync({type:"base64"}, function updateCallback(metadata) {
		//console.log(metadata.percent + "%");
	}).then(function (content) {
		var link = document.createElement('a');
		link.download = "Test.zip";
		link.href = "data:application/zip;base64," + content;
		link.click();
	});
}