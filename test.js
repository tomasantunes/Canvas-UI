/*
* TODO:
* - Use the prototype
* - Data binding
*/
window.onload = function() {
	UI.init();
	
	UI.createTheme("main", {
		padding: 2,
		margin: 2
	});
	
	UI.setTheme("main");
	
	p1 = UI.panel({
		x: "50%",
		width: "50%",
		height: "100% - 20px",
		backgroundColor: "rgb(0, 200, 0)",
		padding: 10,
		minHeight: 400,
		borderRadius: 10
	});
	
	p1Child = UI.panel({
		height: "90px",
		backgroundColor: "rgb(200, 0, 0)",
		borderSize: 1,
		parent: p1,
		text: "This is a test \n\nNew line?",
		fontSize: "20px",
		padding: "0 5 5 5"
	});
	
	p2 = UI.panel({		
		width: "50%",
		height: "35px",
		borderSize: 2,
		borderColor: "rgb(100, 100, 100)"
	});
	
	p3 = UI.panel({
		width: "50%",
		height: "50% - 28px",
		y: 35,
		backgroundColor: "rgb(250, 250, 100)",
		borderSize: 20
	});
	
	p3Child = UI.panel({
		parent: p3
	});
	
	p35 = UI.panel({
		width: "50%",
		height: "50% - 28px",
		y: "50% + 8px",
		backgroundColor: "rgb(150, 250, 250)",
		borderSize: 1
	});
	
	p4 = UI.panel({
		y: "100% - height",
		width: "100%",
		height: "20px",
		borderSize: 1
	});

    img = UI.image({
        src: "github.png",
        parent: p35,
        x: "50% - 16px",
        y: "50% - 16px"
	});
	
	btn1 = UI.button({
		src: "github.png",
		parent: p1,
		x: "0",
		y: "0",
		callback: testButton
	});

	//this will be automatic soon
	UI.fullscreen();
}

function testButton() {
	alert("Button clicked");
};
