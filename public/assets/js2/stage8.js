$("#search").click(function () {

	fetch("/api/xss/stage/8?"+ new URLSearchParams({
		search: $("#input").val(),
	})).then((resp) => resp.text())
		.then(function (data) {
			$("#notification").html(`No result for: ${data}`);
		});
});


$("#file").change(function(){
	if(this.files[0]["type"] != "image/jpeg" || this.files[0]["name"].split('.').pop() != "jpg")
	{
		alert("file type not supported");
		location.reload();
	}
});
