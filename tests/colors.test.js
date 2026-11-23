/** @jest-environment jsdom */

const {
	validateLoginCredentials,
	formatColorList,
	doLogin,
	searchColor
} = require("../public/js/code.js");

describe("Colors application unit tests", () => {
	test("login credentials require a non-empty username and password", () => {
		expect(validateLoginCredentials("testuser", "password")).toBe(true);
		expect(validateLoginCredentials("", "password")).toBe(false);
		expect(validateLoginCredentials("testuser", "")).toBe(false);
		expect(validateLoginCredentials("   ", "password")).toBe(false);
	});

	test("color search results are formatted as one item per line", () => {
		expect(formatColorList(["Red", "Green", "Blue"]))
			.toBe("Red<br />\r\nGreen<br />\r\nBlue");
		expect(formatColorList(null)).toBe("");
	});
});

describe("Colors application integration tests", () => {
	let mockXHR;

	beforeEach(() => {
		document.body.innerHTML = `
			<input id="loginName" value="testuser">
			<input id="loginPassword" value="testpassword">
			<span id="loginResult"></span>
			<input id="searchText" value="bl">
			<span id="colorSearchResult"></span>
			<p></p>
		`;

		mockXHR = {
			open: jest.fn(),
			setRequestHeader: jest.fn(),
			send: jest.fn()
		};
		global.XMLHttpRequest = jest.fn(() => mockXHR);
	});

	test("doLogin sends login JSON and reports invalid credentials", () => {
		doLogin();

		expect(mockXHR.open)
			.toHaveBeenCalledWith("POST", "http://cop4331colors.com/LAMPAPI/Login.php", true);
		expect(mockXHR.setRequestHeader)
			.toHaveBeenCalledWith("Content-type", "application/json; charset=UTF-8");
		expect(JSON.parse(mockXHR.send.mock.calls[0][0])).toEqual({
			login: "testuser",
			password: "testpassword"
		});

		mockXHR.readyState = 4;
		mockXHR.status = 200;
		mockXHR.responseText = '{"id":0,"firstName":"","lastName":"","error":"No Records Found"}';
		mockXHR.onreadystatechange();

		expect(document.getElementById("loginResult").innerHTML)
			.toBe("User/Password combination incorrect");
	});

	test("searchColor sends the search JSON and displays returned colors", () => {
		searchColor();

		expect(mockXHR.open)
			.toHaveBeenCalledWith("POST", "http://cop4331colors.com/LAMPAPI/SearchColors.php", true);
		expect(JSON.parse(mockXHR.send.mock.calls[0][0])).toEqual({
			search: "bl",
			userId: 0
		});

		mockXHR.readyState = 4;
		mockXHR.status = 200;
		mockXHR.responseText = '{"results":["Blue","Black"],"error":""}';
		mockXHR.onreadystatechange();

		expect(document.getElementById("colorSearchResult").innerHTML)
			.toBe("Color(s) has been retrieved");
		const renderedList = document.querySelector("p").innerHTML;
		expect(renderedList).toContain("Blue");
		expect(renderedList).toContain("Black");
		expect(renderedList).toMatch(/Blue.*<br.*>.*Black/s);
	});
});
