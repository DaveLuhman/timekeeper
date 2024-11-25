function openInNewTab(timecardId) {
	const x = window.open();
	const newPage = document.createElement("div");
	newPage.width = "100%";
	newPage.height = "100%";
	newPage.innerHTML = document.getElementById(
		`timecard-${timecardId}`,
	).innerHTML;
	x.document.body.appendChild(newPage);
}

if (document.getElementsByClassName("fa-print").length > 0) {
	const printButtons = document.getElementsByClassName("fa-print");
	for (const button of printButtons) {
		button.addEventListener("click", () => {
			openInNewTab(button.dataset.id);
		});
	}
}
