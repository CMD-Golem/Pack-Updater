var packs, html, pack_array = [], org_pack_array = [];

var datatable = document.getElementById("datatable");

var el_rp_identifier = document.getElementById("rp_identifier");
var el_newest_pack_identifier = document.getElementById("newest_pack_identifier");
var el_new_pack_identifier = document.getElementById("new_pack_identifier");
var message = document.getElementById("message");
var el_file_path = document.getElementById("file_path");

el_rp_identifier.value = localStorage.getItem("rp_identifier");

async function selectMainFolder() {
	var path = await window.__TAURI__.dialog.open({
		recursive: true,
		multiple: false,
		directory: true
	}).catch((e) => {
		message.innerHTML = "Select your directory first";
		return;
	});

	
	if (path != "") {
		el_file_path.value = path;
		message.innerHTML = "Select your Pack Type first";
		org_pack_array = await window.__TAURI__.fs.readDir(path, {recursive:true});
	}
}

selectMainFolder();

function getFiles() {
	packs = "";
	html = "";
	pack_array = [];

	var rp_identifier = el_rp_identifier.value;
	var newest_pack_identifier = el_newest_pack_identifier.value;
	var new_pack_identifier = el_new_pack_identifier.value;

	localStorage.setItem("rp_identifier", rp_identifier);

	message.style.display = "none";

	// var org_pack_array = var_pack_array;

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
	html = '<tr><th class="checkbox_row"><input type="checkbox" onclick="selectAll()"></th><th class="pack_name_row">Pack Name</th><th class="duplicate_from_row">Duplicate from</th><th class="save_as_row">Save as</th></tr>';

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
				<tr data-path="${pack_array[i].path}" class="pack">
					<td><input class="pack_checkbox" type="checkbox" ${checkbox_checked} onclick="changeSelection(this)"></td>
					<td>${pack_array[i].name}</td>
					<td><select class="duplicate_selection" onchange="changeSave(this.parentNode.parentNode)">${html_pack}</select></td>
					<td><input class="duplicate_name" type="text" value="${normal_duplicate_name}" onkeyup="this.classList.add('edited')"></td>
				</tr>`;
		}
	}
	datatable.innerHTML = html;

	checkboxes = datatable.getElementsByClassName("pack_checkbox");

	// same row width
	el_duplicate = document.getElementsByClassName("duplicate_from_row")[0];
	el_save = document.getElementsByClassName("save_as_row")[0];

	window.addEventListener("resize", rowWidth);
	rowWidth();
}

// #################################################################################################
// save files
var snackbar = document.getElementById("snackbar");

async function updatePacks() {
	var check_packs = datatable.getElementsByClassName("pack");
	var pack_format = parseInt(document.getElementById("pack_format").value);
	var success = true;

	for (var i = 0; i < check_packs.length; i++) {
		var check_pack = check_packs[i];
		if (check_pack.getElementsByClassName("pack_checkbox")[0].checked) {
			var zip = new JSZip();

			var path = check_pack.getAttribute("data-path");
			var pack_name = check_pack.getElementsByClassName("duplicate_name")[0].value;

			// get file
			var org_file = await window.__TAURI__.fs.readBinaryFile(path + "\\" + check_pack.getElementsByClassName("duplicate_selection")[0].value);
			await zip.loadAsync(org_file);

			// edit file
			var pack_mcmeta = await zip.file("pack.mcmeta").async("string");
			pack_mcmeta = JSON.parse(pack_mcmeta);
			pack_mcmeta.pack.pack_format = pack_format;
			zip.file("pack.mcmeta", JSON.stringify(pack_mcmeta));


			var generated_zip = await zip.generateAsync({ type: 'blob' });
			var file_blob = await readFileAsync(generated_zip);
			var fileU8A = new Uint8Array(file_blob);
			console.log(pack_name);
			await window.__TAURI__.fs.writeBinaryFile({ contents: fileU8A, path: path + "\\" + pack_name });

			console.log(write_return);
			if (!write_return) {
				success = false;
			}
		}
	}
	snackbar.classList.add("show");
	setTimeout(function(){ snackbar.classList.remove("show"); }, 5000);
	if (success) {
		snackbar.innerHTML = "Export succeeded!";
		snackbar.style.color = "#292929";
		snackbar.style.backgroundColor = "#6690C2";
	}
	else {
		snackbar.innerHTML = "Export for at least one pack failed!";
		snackbar.style.color = "#CCCCCC";
		snackbar.style.backgroundColor = "#861717";
	}
}

function readFileAsync(content) {
	return new Promise((resolve, reject) => {
		var file = new FileReader();
		file.onload = () => { resolve(file.result); };
		file.onerror = reject;
		file.readAsArrayBuffer(content);
	})
}

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


// #################################################################################################
// De/Select all checkboxes
var checkboxes, check_status = false;

function selectAll() {
	check_status = !check_status;
	for (var i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = check_status;
		changeSelection(checkboxes[i]);
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
	}
}

// change pack type
var button_datapack = document.getElementById("datapack");
var button_resource_pack = document.getElementById("resource_pack");

var sel_pack = "datapack";

function changePack(button) {
	sel_pack = button;
	getFiles();
	if (button == "resource_pack") {
		button_datapack.classList.remove("active");
		button_resource_pack.classList.add("active");
	}
	else {
		button_datapack.classList.add("active");
		button_resource_pack.classList.remove("active");
	}
}

// #################################################################################################
// style js

// change page layout
// if (localStorage.getItem("horizontal_view") == "true") {
// 	toggleView();
// }

// function toggleView() {
// 	var body = document.getElementsByTagName("body")[0]
// 	if (body.classList.contains("horizontal_view")) {
// 		body.classList.remove("horizontal_view");
// 		localStorage.setItem("horizontal_view", "false");
// 	}
// 	else {
// 		body.classList.add("horizontal_view");
// 		localStorage.setItem("horizontal_view", "true");
// 	}
// }


// change row width
var el_duplicate = document.getElementsByClassName("duplicate_from_row")[0];
var el_save = document.getElementsByClassName("save_as_row")[0];

function rowWidth() {
	el_duplicate.style.width = "auto";
	el_save.style.width = "auto";

	var row_width = el_duplicate.offsetWidth + el_save.offsetWidth;
	el_duplicate.style.width = row_width / 2 - 10;
	el_save.style.width = row_width / 2 - 10;
}
rowWidth();


// #################################################################################################
// context menu
var contextMenu = document.getElementById("context-menu");
var scope = document.querySelector("body");
var selected_input;

var normalizePozition = (mouseX, mouseY) => {
	// compute what is the mouse position relative to the container element (scope)
	var {
		left: scopeOffsetX,
		top: scopeOffsetY,
	} = scope.getBoundingClientRect();

	scopeOffsetX = scopeOffsetX < 0 ? 0 : scopeOffsetX;
	scopeOffsetY = scopeOffsetY < 0 ? 0 : scopeOffsetY;

	var scopeX = mouseX - scopeOffsetX;
	var scopeY = mouseY - scopeOffsetY;

	// check if the element will go out of bounds
	var outOfBoundsOnX = scopeX + contextMenu.offsetWidth > scope.offsetWidth;
	var outOfBoundsOnY = scopeY + contextMenu.offsetHeight > scope.offsetHeight;

	var normalizedX = mouseX;
	var normalizedY = mouseY;

	// normalize on X
	if (outOfBoundsOnX) {
		normalizedX = scopeOffsetX + scope.offsetWidth - contextMenu.offsetWidth;
	}

	// normalize on Y
	if (outOfBoundsOnY) {
		normalizedY = scopeOffsetY + scope.offsetHeight - contextMenu.offsetHeight;
	}
	return { normalizedX, normalizedY };
};

scope.addEventListener("contextmenu", (event) => {
	event.preventDefault();
	if (event.target.tagName == 'INPUT' && event.target.getAttribute('type') == 'text') {
		selected_input = event.target;

		var { clientX: mouseX, clientY: mouseY } = event;
		var { normalizedX, normalizedY } = normalizePozition(mouseX, mouseY);

		contextMenu.classList.remove("visible");

		contextMenu.style.top = `${normalizedY}px`;
		contextMenu.style.left = `${normalizedX}px`;

		setTimeout(() => {
			contextMenu.classList.add("visible");
		});
	}
	else {
		contextMenu.classList.remove("visible");
	}
});

scope.addEventListener("click", (e) => {
	if (e.target.offsetParent != contextMenu) {
		contextMenu.classList.remove("visible");
	}
});

function cut() {
	copy();
	selected_input.value = "";
}

function copy() {
    var text = selected_input.value.slice(selected_input.selectionStart, selected_input.selectionEnd);
	if (text == '') {
		text = selected_input.value;
	}
	if (text != "") {
		navigator.clipboard.writeText(text);
	}
	contextMenu.classList.remove("visible");
}

function paste() {
	navigator.clipboard.readText().then( clipText => selected_input.value = clipText );
	contextMenu.classList.remove("visible");
}