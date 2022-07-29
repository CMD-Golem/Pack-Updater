var packs, html, pack_array = [], org_pack_array = [];
var is_path_sel = true; // console.log(false)

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

function getFiles() {
	packs = "";
	html = "";
	pack_array = [];

	var rp_identifier = el_rp_identifier.value;
	var newest_pack_identifier = el_newest_pack_identifier.value;
	var new_pack_identifier = el_new_pack_identifier.value;

	localStorage.setItem("rp_identifier", rp_identifier);

	message.style.display = "none";

	var org_pack_array = var_pack_array; //console.log()

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
		<th class="pack_name_row th_resizeable"><span>Pack Name</span><div class="change_col_width"></div></th>
		<th class="duplicate_from_row th_resizeable"><span>Duplicate from</span><div class="change_col_width"></div></th>
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
				<tr data-path="${pack_array[i].path}" class="pack">
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
	initWidth();
	var th_resizeable = datatable.getElementsByClassName("th_resizeable");

	for (var i = 0; i < th_resizeable.length; i++) {
		th_resizeable[i].getElementsByClassName("change_col_width")[0].addEventListener('mousedown', initResize);
	}
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

			// console.log(write_return);
			// if (!write_return) {
			// 	success = false;
			// }
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
		el.getElementsByClassName("duplicate_name")[0].classList.remove("edited");
	}
}

// change pack type
var button_datapack = document.getElementById("datapack");
var button_resource_pack = document.getElementById("resource_pack");
var el_update_box = document.getElementById("update_box");

var sel_pack = "datapack";

function changePack(button) {
	if (is_path_sel) {
		sel_pack = button.id;
		el_update_box.classList.add("visible");

		getFiles();

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

// #################################################################################################
// style js

// change col width
var resizing_col, resizing_next_col, col_width_px, next_col_width_px, col_width, next_col_width;
var th_resizeable = datatable.getElementsByClassName("th_resizeable");

for (var i = 0; i < th_resizeable.length; i++) {
	th_resizeable[i].getElementsByClassName("change_col_width")[0].addEventListener('mousedown', initResize);
}

function initResize(e) {
	resizing_col = e.target.parentNode;
	resizing_next_col = resizing_col.nextElementSibling;

	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
	var calc_col_width = document.documentElement.scrollLeft + e.clientX - resizing_col.offsetLeft;
	var calc_next_col_width = resizing_next_col.clientWidth - calc_col_width + resizing_col.clientWidth - 20;

	if (calc_col_width >= 130 && calc_next_col_width >= 130) {
		resizing_col.style.width = calc_col_width;
		resizing_next_col.style.width = calc_next_col_width;

		col_width_px = calc_col_width;
		next_col_width_px = calc_next_col_width;
	}
}

function onMouseUp() {
	window.removeEventListener('mousemove', onMouseMove);
	window.removeEventListener('mouseup', onMouseUp);

	if (col_width_px <= 130) {
		col_width_px = 130;
	}
	if (next_col_width_px <= 130) {
		next_col_width_px = 130;
	}

	col_width = (100 * col_width_px / datatable.clientWidth) + "%";
	next_col_width = (100 * next_col_width_px / datatable.clientWidth) + "%";

	resizing_col.style.width = col_width;
	resizing_next_col.style.width = next_col_width;

	localStorage.setItem(resizing_col.className.split(" ")[0], col_width);
	localStorage.setItem(resizing_next_col.className.split(" ")[0], next_col_width);
};

// set width
if (localStorage.getItem("duplicate_from_row") == "unset") {
	localStorage.setItem("pack_name_row", "unset");
	localStorage.setItem("duplicate_from_row", "unset");
	localStorage.setItem("save_as_row", "unset");
}

function initWidth() {
	document.getElementsByClassName("pack_name_row")[0].style.width = localStorage.getItem("pack_name_row");
	document.getElementsByClassName("duplicate_from_row")[0].style.width = localStorage.getItem("duplicate_from_row");
	document.getElementsByClassName("save_as_row")[0].style.width = localStorage.getItem("save_as_row");
}
initWidth();

// change row width
// var el_duplicate = document.getElementsByClassName("duplicate_from_row")[0];
// var el_save = document.getElementsByClassName("save_as_row")[0];

// function rowWidth() {
// 	el_duplicate.style.width = "auto";
// 	el_save.style.width = "auto";

// 	var row_width = el_duplicate.offsetWidth + el_save.offsetWidth;
// 	el_duplicate.style.width = row_width / 2 - 10;
// 	el_save.style.width = row_width / 2 - 10;
// }
// rowWidth();

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
	navigator.clipboard.readText().then( clipText => selected_input.value += clipText );
	contextMenu.classList.remove("visible");
}