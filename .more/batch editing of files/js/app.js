var packs, path, html, pack_array = [];

var datatable = document.getElementById("datatable");

async function selectMainFolder() {
	path = await window.__TAURI__.dialog.open({
		recursive: true,
		multiple: false,
		directory: true
	});

	pack_array = await window.__TAURI__.fs.readDir(path, {recursive:true});
}

selectMainFolder();

function getFiles() {
	packs = "";

	html = `<tr>
		<th class="pack_name_row"><span>Old Name</span></th>
		<th class="save_as_row"><span>New Name</span></th>
	</tr>`;

	// Get Subpacks
	for (var i = 0; i < pack_array.length; i++) {

		// Autocreate new name
		var old_file_name = pack_array[i].name;

		// var file_number = parseInt(old_file_name.replace("episode_ (", "").replace(")"));
		// var new_file_number = 218 - file_number;

		var new_file_name = old_file_name + ".jpg";
		
		// create table row html
		html += `
		<tr id="${i}" class="pack">
			<td class="org_name">${old_file_name}</td>
			<td><input class="duplicate_name" type="text" value="${new_file_name}"></td>
		</tr>`;
	}
	datatable.innerHTML = html;
}

// save files
async function updatePacks() {
	var check_packs = datatable.getElementsByClassName("pack");

	for (var i = 0; i < check_packs.length; i++) {
		var check_pack = check_packs[i];
		var old_name = check_pack.getElementsByClassName("org_name")[0].innerHTML;
		var file_name = check_pack.getElementsByClassName("duplicate_name")[0].value;

		await window.__TAURI__.fs.renameFile(path + "\\" + old_name, path + "\\" + file_name);
	}
}
