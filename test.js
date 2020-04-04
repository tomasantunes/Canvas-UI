/*
* TODO:
* - Use the prototype
* - Data binding
*/
window.onload = function() {
	UI.init("canvas1");
	
	UI.createTheme("main", {
		padding: 2,
		margin: 2
	});
	
	UI.setTheme("main");

	p1 = UI.panel({
		x: 0,
		width: "100%",
		height: "25%",
		backgroundColor: "rgb(180, 180, 180)",
		padding: 10,
		minHeight: 400,
		borderRadius: 10
	});
	
	p1Child = UI.panel({
		width: "50px",
		height: "50px",
		backgroundColor: "rgb(52, 195, 65)",
		borderSize: 1,
		parent: p1,
		text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque in congue massa. Duis velit sapien, pharetra nec ornare quis, sollicitudin in purus. Vivamus non justo ut diam ultrices lobortis. Nunc turpis leo, commodo vitae est a, auctor lobortis tellus. Morbi elementum tortor id vestibulum vestibulum.",
		fontSize: "20px",
		padding: 10
	});
	
	p2 = UI.panel({		
		width: "100%",
		height: "25%",
		borderSize: 2,
		borderColor: "rgb(180, 180, 180)"
	});
	
	p3 = UI.panel({
		y: "50%",
		width: "100%",
		height: "25%",
		backgroundColor: "rgb(180, 180, 180)",
	});
	
	p3Child = UI.panel({
		parent: p3
	});
	
	p4 = UI.panel({
		y: "75%",
		width: "100%",
		height: "25%",
		backgroundColor: "rgb(150, 250, 250)",
		borderSize: 5,
		padding: 10
	});

    img = UI.image({
        src: "github.png",
        parent: p4,
        x: 0,
        y: "25%"
	});
	
	input1 = UI.input({
		parent: p4,
		x: "200px",
		y: "0",
	});

	dropdown1 = UI.dropdown({
		parent: p4,
		x: "600px",
		y: 0,
		width: 120,
		height: 30
	});

	checkbox1 = UI.checkbox({
		parent: p4,
		x: "0",
		y: "100px",
		checked: false
	});

	btn1 = UI.button({
		src: "button1.png",
		parent: p4,
		x: "0",
		y: "0",
		callback: testButton.bind(this, 1)
	});

	btn2 = UI.button({
		src: "show-text-btn.png",
		parent: p4,
		x: "400px",
		y: "0",
		callback: getTextValue.bind(this, input1)
	});

	//this will be automatic soon
	UI.fullscreen();
}

function testButton(id) {
	alert("Button" + id.toString() + " clicked");
};

function getTextValue(input) {
	alert(input.getValue());
}
