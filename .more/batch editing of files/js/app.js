var packs, path, html, pack_array = [];

var datatable = document.getElementById("datatable");

async function selectFolder() {
	packs = "";

	html = `<tr>
		<th class="pack_name_row"><span>Old Name</span></th>
		<th class="save_as_row"><span>New Name</span></th>
	</tr>`;

	// let user select folder
	// path = await window.__TAURI__.dialog.open({
	// 	recursive: true,
	// 	multiple: false,
	// 	directory: true
	// });

	// pack_array = await window.__TAURI__.fs.readDir(path, {recursive:true});

	pack_array = [
		{
			"name": "pack.mcmeta",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\pack.mcmeta"
		},
		{
			"name": "[1.15] Key DP by CMD-Golem v3.4.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.15] Key DP by CMD-Golem v3.4.zip"
		},
		{
			"name": "[1.15] Key TP by CMD-Golem v3.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.15] Key TP by CMD-Golem v3.zip"
		},
		{
			"name": "[1.16] Key DP by CMD-Golem v3.4.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.16] Key DP by CMD-Golem v3.4.zip"
		},
		{
			"name": "[1.16] Key TP by CMD-Golem v3.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.16] Key TP by CMD-Golem v3.zip"
		},
		{
			"name": "[1.17] Key DP by CMD-Golem v3.4.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.17] Key DP by CMD-Golem v3.4.zip"
		},
		{
			"name": "[1.17] Key TP by CMD-Golem v3.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.17] Key TP by CMD-Golem v3.zip"
		},
		{
			"name": "[1.18.2] Key DP by CMD-Golem v3.4.zip",
			"path": "B:\\Daten\\Minecraft\\CMD-Golem\\Datapacks\\Key\\[1.18.2] Key DP by CMD-Golem v3.4.zip"
		}
	]

	// Create Table row
	for (var i = 0; i < pack_array.length; i++) {
		html += `
		<tr id="${i}" class="pack">
			<td class="org_name">${pack_array[i].name}</td>
			<td><input class="duplicate_name" type="text" value="${pack_array[i].name}"></td>
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


// Textarea
var el_textarea = document.getElementsByTagName("textarea");
for (var i = 0; i < el_textarea.length; i++) {
	el_textarea[i].addEventListener("input", textarea);
}

function textarea(edited_textarea) {
	edited_textarea.target.style.height = "auto";
	edited_textarea.target.style.height = edited_textarea.target.scrollHeight + 12 + "px";
}