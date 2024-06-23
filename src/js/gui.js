// De/Select all checkboxes
var checkboxes, check_status = false;

function selectAll() {
	check_status = !check_status;
	for (var i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = check_status;
		changeSelection(checkboxes[i]); // app.js
	}
}

// change col width
var resizing_col, resizing_next_col, col_width_px, next_col_width_px, col_width, next_col_width;

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

function copy(cut) {
	var text = selected_input.value;
	var sel_start = selected_input.selectionStart;
	var sel_end = selected_input.selectionEnd;

	var selected = selected_input.value.slice(sel_start, sel_end);
	if (selected != "") {
		navigator.clipboard.writeText(selected);
		if (cut) selected_input.value = [text.slice(0, sel_start), text.slice(sel_end)].join('');
	}
	else if (text != "") {
		navigator.clipboard.writeText(text);
		if (cut) selected_input.value = "";
	}
	contextMenu.classList.remove("visible");
}

async function paste() {
	var sel_start = selected_input.selectionStart;
	var sel_end = selected_input.selectionEnd;

	var text = selected_input.value;
	var paste_text = await window.__TAURI__.clipboard.readText();

	if (sel_start != sel_end) {
		text = [text.slice(0, sel_start), text.slice(sel_end)].join('');
	}
	selected_input.value = [text.slice(0, sel_start), paste_text, text.slice(sel_start)].join('');

	contextMenu.classList.remove("visible");
}