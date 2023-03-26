var packs, html, pack_array = [], org_pack_array = [];
var is_path_sel = false; // console.log(false)

var datatable = document.getElementById("datatable");
var el_file_path = document.getElementById("file_path");
var el_rp_identifier = document.getElementById("rp_identifier");
var el_newest_pack_identifier = document.getElementById("newest_pack_identifier");
var el_new_pack_identifier = document.getElementById("new_pack_identifier");
var message = document.getElementById("message");

el_rp_identifier.value = localStorage.getItem("rp_identifier");


async function selectMainFolder() {
	var path = await window.__TAURI__.dialog.open({
		recursive: true,
		multiple: false,
		directory: true
	});

	if (path != null) {
		el_file_path.value = path;
		is_path_sel = true;

		message.innerHTML = "Select your Pack Type first";
		el_update_box.classList.remove("visible");

		org_pack_array = await window.__TAURI__.fs.readDir(path, {recursive:true});
	}
	else {
		message.innerHTML = "Select your directory first";
	}
}

selectMainFolder();
// is_path_sel = true;
// var output = [];


// #################################################################################################
// change pack type
var button_datapack = document.getElementById("datapack");
var button_resource_pack = document.getElementById("resource_pack");
var el_update_box = document.getElementById("update_box");

function changePack(button) {
	if (is_path_sel) {
		var sel_pack = button.id;
		el_update_box.classList.add("visible");

		getFiles(sel_pack);

		if (sel_pack == "resource_pack") {
			button_datapack.classList.remove("active");
			button_resource_pack.classList.add("active");
		}
		else {
			button_datapack.classList.add("active");
			button_resource_pack.classList.remove("active");
		}
	}
	else {
		snackbar.classList.add("show");
		snackbar.innerHTML = "You need to select your directory first!";
		snackbar.style.color = "#CCCCCC";
		snackbar.style.backgroundColor = "#861717";

		setTimeout(function(){ snackbar.classList.remove("show"); }, 5000);
	}

	button.blur();
}

function getFiles(sel_pack) {
	packs = "";
	html = "";
	pack_array = [];

	var rp_identifier = el_rp_identifier.value;
	var newest_pack_identifier = el_newest_pack_identifier.value;
	var new_pack_identifier = el_new_pack_identifier.value;

	localStorage.setItem("rp_identifier", rp_identifier);

	message.style.display = "none";

	// var org_pack_array = var_pack_array; //console.log()
	// output = [];

	// Get Subpacks
	for (var i = 0; i < org_pack_array.length; i++) {
		var file_array = [];
		var org_file_array = org_pack_array[i].children;

		if (org_file_array == undefined) {
			continue;
		}

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

	html = `<tr>
		<th class="checkbox_row"><input type="checkbox" onclick="selectAll()"></th>
		<th class="pack_name_row"><span>Pack Name</span><div class="change_col_width"></div></th>
		<th class="duplicate_from_row"><span>Duplicate from</span><div class="change_col_width"></div></th>
		<th class="save_as_row"><span>Save as</span></th>
	</tr>`;

	for (var i = 0; i < pack_array.length; i++) {
		var html_pack = "", normal_duplicate_name = "";
		var children_array = pack_array[i].children;

		for (var j = 0; j < children_array.length; j++) {
			if (((sel_pack == "datapack" && children_array[j].name.includes(rp_identifier)) || (sel_pack == "resource_pack" && !children_array[j].name.includes(rp_identifier))) && rp_identifier != "" || !children_array[j].name.includes("zip")) {
				continue;
			}
			if (children_array[j].name.includes(newest_pack_identifier)) {
				html_pack += `<option value="${children_array[j].name}" selected>${children_array[j].name}</option>`;
				normal_duplicate_name = children_array[j].name;
			}
			else {
				html_pack += `<option value="${children_array[j].name}">${children_array[j].name}</option>`;
			}
		}

		// Check checkbox if newest pack could be found
		if (normal_duplicate_name != "") {
			var checkbox_checked = " checked";
		}
		else {
			var checkbox_checked = "";
		}

		// Autocreate new name
		if (newest_pack_identifier != "" && new_pack_identifier != "") {
			var normal_duplicate_name = normal_duplicate_name.replace(newest_pack_identifier, new_pack_identifier);
		}
		
		// create table row html
		if (html_pack != "") {
				html += `
				<tr id="${i}" class="pack">
					<td><input class="pack_checkbox" type="checkbox" ${checkbox_checked} onclick="changeSelection(this)" tabindex="-1"></td>
					<td>${pack_array[i].name}</td>
					<td><select class="duplicate_selection" onchange="changeSave(this.parentNode.parentNode)" tabindex="-1">${html_pack}</select></td>
					<td><input class="duplicate_name" type="text" value="${normal_duplicate_name}" onkeyup="this.classList.add('edited')"></td>
				</tr>`;
		}
	}
	datatable.innerHTML = html;

	checkboxes = datatable.getElementsByClassName("pack_checkbox");

	// set width of col
	initWidth(); // gui.js
	var change_col_width = datatable.getElementsByClassName("change_col_width");

	for (var i = 0; i < change_col_width.length; i++) {
		change_col_width[i].addEventListener('mousedown', initResize);
	}
}

// #################################################################################################
// save files
var snackbar = document.getElementById("snackbar");
var modal_box = document.getElementById("modal_box");
var progress_bar = document.getElementById("bar");
var action_box = document.getElementById("action_box");
var file_exists = document.getElementById("file_exists");
var el_replace_file = document.getElementById("replace_file");
var el_skip_file = document.getElementById("skip_file");
var el_file_always = document.getElementById("file_always");

async function updatePacks() {
	var exported_count = 0;
	var file_always = false;
	var skip_file = true;
	var check_packs = datatable.getElementsByClassName("pack");
	var pack_format = document.getElementById("pack_format").value;
	var file_count = check_packs.length;

	// progress bar init
	modal_box.style.display = "block";
	var progress_width_per_file = bar.parentNode.offsetWidth / check_packs.length;
	var progress_width = 0;

	for (var i = 0; i < check_packs.length; i++) {
		var check_pack = check_packs[i];
		if (check_pack.getElementsByClassName("pack_checkbox")[0].checked) {
			var zip = new JSZip();
			var file = new FileReader();

			var pack_id = check_pack.id;

			var path = pack_array[pack_id].path
			var pack_name = check_pack.getElementsByClassName("duplicate_name")[0].value;
			var save_path = path + "\\" + pack_name;

			// progress bar update
			progress_width += progress_width_per_file;
			progress_bar.style.width = progress_width + "px";

			// user input if file exists already
			var file_exists = await window.__TAURI__.fs.exists(save_path);
			// var file_exisits = false; //console.log()
			// for (var j = 0; j < pack_array[pack_id].children.length; j++) {
			// 	if (pack_array[pack_id].children[j].name == pack_name) file_exisits = true;
			// }

			if (file_exisits) {
				if (!file_always) {
					action_box.style.height = action_box.scrollHeight + "px";
					file_exists.innerHTML = pack_name;
	
					skip_file = await fileAction();
					var file_always = el_file_always.checked;
				}
	
				if (skip_file) {
					continue;
				}
			}
			else {
				action_box.style.height = 0;
			}

			exported_count++

			// get file
			var org_file = await window.__TAURI__.fs.readBinaryFile(path + "\\" + check_pack.getElementsByClassName("duplicate_selection")[0].value);
			await zip.loadAsync(org_file);

			// edit file
			var pack_mcmeta = await zip.file("pack.mcmeta").async("string");
			pack_mcmeta = JSON.parse(pack_mcmeta);
			pack_mcmeta.pack.pack_format = pack_format;
			zip.file("pack.mcmeta", JSON.stringify(pack_mcmeta));

			// save file
			var generated_zip = await zip.generateAsync({ type: 'blob' });
			var file_blob = await file.readAsArrayBuffer(generated_zip);

			var fileU8A = new Uint8Array(file_blob);
			await window.__TAURI__.fs.writeBinaryFile({ contents: fileU8A, path: save_path });

			// output.push(save_path);

			pack_array[pack_id].children.push({name: pack_name, path: path});
		}
	}
	snackbar.classList.add("show");
	snackbar.innerHTML = `Export finished (${exported_count}/${file_count})`;
	snackbar.style.color = "#292929";
	snackbar.style.backgroundColor = "#6690C2";
	progress_bar.style.width = 0;
	modal_box.style.display = "none";
	setTimeout(function(){ snackbar.classList.remove("show"); }, 5000);
}

// wait for user to select file action
function fileAction() {
	return new Promise((resolve) => {
		el_replace_file.onclick = function(){ resolve(false); }
		el_skip_file.onclick = function(){ resolve(true); }
	});
}

// function readFileAsync(content) {
// 	return new Promise((resolve, reject) => {
// 		var file = new FileReader();
// 		file.onload = () => { resolve(file.result); };
// 		file.onerror = reject;
// 		file.readAsArrayBuffer(content);
// 	})
// }

// #################################################################################################
// Autochange save as text (other filter text/ change of selection)
function changeSave(el) {
	var duplicate_name = el.getElementsByClassName("duplicate_name")[0];
	var duplicate_selection = el.getElementsByClassName("duplicate_selection")[0];
	var checkbox = el.getElementsByClassName("pack_checkbox")[0];

	if (!duplicate_name.classList.contains("edited")) {
		duplicate_name.value = duplicate_selection.value;
		checkbox.checked = true;
	}
}

// update save as on checkbox check
function changeSelection(checkbox) {
	var el = checkbox.parentNode.parentNode;

	if (checkbox.checked) {
		changeSave(el);
	}
	else {
		el.getElementsByClassName("duplicate_name")[0].value = "";
		el.getElementsByClassName("duplicate_name")[0].classList.remove("edited");
	}
}
