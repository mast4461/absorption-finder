
var hMargin = 27;
var wMargin = 35;
var r = 2;

var chart1 = d3.select('svg#chart1');
var chart2 = d3.select('svg#chart2');
var dataInput = d3.select('textarea#data-input');
var lineParametersOutput = d3.select('input#line-parameters');

dataInput.node().value =
	'200,2.125\n' +
	'205,1.925\n' +
	'210,1.748\n' +
	'215,1.591\n' +
	'220,1.451\n' +
	'225,1.327\n' +
	'230,1.215\n' +
	'235,1.115\n' +
	'240,1.025\n' +
	'245,0.944\n' +
	'250,0.871\n' +
	'255,0.806\n' +
	'260,0.762\n' +
	'265,0.795\n' +
	'270,1.008\n' +
	'275,1.373\n' +
	'280,1.553\n' +
	'285,1.294\n' +
	'290,0.849\n' +
	'295,0.554\n' +
	'300,0.438\n' +
	'305,0.395\n' +
	'310,0.368\n' +
	'315,0.345\n' +
	'320,0.324\n' +
	'325,0.305\n' +
	'330,0.287\n' +
	'335,0.27\n' +
	'340,0.254\n' +
	'345,0.24\n' +
	'350,0.227\n' +
	'355,0.214\n' +
	'360,0.202\n' +
	'365,0.192\n' +
	'370,0.181\n' +
	'375,0.172\n' +
	'380,0.163\n' +
	'385,0.155\n' +
	'390,0.147\n' +
	'395,0.14\n'
;

function linearRegression(x,y){
	// Adaptation of http://trentrichardson.com/2010/04/06/compute-linear-regressions-in-javascript/
	var n = y.length;
	var sum_x = 0;
	var sum_y = 0;
	var sum_xy = 0;
	var sum_xx = 0;
	var sum_yy = 0;

	for (var i = 0; i < y.length; i++) {
		sum_x += x[i];
		sum_y += y[i];
		sum_xy += (x[i]*y[i]);
		sum_xx += (x[i]*x[i]);
		sum_yy += (y[i]*y[i]);
	}

	var lr = {};
	lr.slope = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
	lr.intercept = (sum_y - lr.slope * sum_x)/n;
	lr.r2 = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
	return lr;
}

var getInputData = function() {
	var raw = dataInput.node().value;
	var rows = raw.split('\n');
	var data = rows.map(function(row) {
		var rowValues = row.split(',').map(function(values) {
			return parseFloat(values.trim());
		});

		return {x: rowValues[0], y: rowValues[1]}
	});

	data = data.filter(function(v) {
		return v.x !== NaN && v.x !== undefined && v.y !== NaN && v.y !== undefined;
	});

	data.forEach(function(v) {
		v.y += (Math.random()-0.5)*2*0.025;
	});

	return data;
};

// console.log(data);

var gx = function(d) {return d.x};
var gy = function(d) {return d.y};

var xFunction = function(d) {
	return xScale(d.x);
};

var yFunction = function(d) {
	return yScale(d.y);
};

var xScale;
var yScale;
var xDomain;
var yDomain;
var data;
var subtractedData;

var lineContainer = chart1.append('svg:g').attr('id','line-container');
chart1.append('svg:g').attr('id','points-container');
chart2.append('svg:g').attr('id','points-container');
var handleContainer = chart1.append('svg:g').attr('id','handle-container');

var xAxisContainerChart1 = chart1.append('svg:g');
var yAxisContainerChart1 = chart1.append('svg:g');

var xAxisContainerChart2 = chart2.append('svg:g');
var yAxisContainerChart2 = chart2.append('svg:g');
var outputLine = chart2.append('line').attr('id', 'output-line');

var xAxisChart1 = d3.svg.axis();//.orient('top');
var yAxisChart1 = d3.svg.axis().orient('left');

var xAxisChart2 = d3.svg.axis();//.orient('top');
var yAxisChart2 = d3.svg.axis().orient('left');



var dragCircle = d3.behavior.drag()
	.on('drag',
		function(d, i) {
			var x2 = xScale.invert(d3.event.x);

			yScale.clamp(true);
			var y2 = yScale.invert(d3.event.y);
			yScale.clamp(false);


			if (i === 1) {
				[0,2].forEach(function(j) {
					handles[j].x += x2 - handles[i].x;
					handles[j].y += y2 - handles[i].y;
				});
			} else {
				reinitializeMiddleHandle();
			}
			handles[i] = {x: x2, y: y2};

			redrawLine();
			redrawHandles();
			redrawChart2();
			calcOutPut();
		}
	)
;


var extendDomain = function(domain) {
	var d = 0.1*(domain[1] - domain[0]);
	domain[0] -= d;
	domain[1] += d;
	return domain;
};

var redrawChart1 = function() {
	var w = parseInt(chart1.style('width'));
	var h = parseInt(chart1.style('height'));

	xDomain = extendDomain(d3.extent(data, gx));
	xScale = d3.scale.linear()
		.domain(xDomain)
		.range([wMargin, w-wMargin])
		.clamp(true)
	;

	yDomain = extendDomain(d3.extent(data, gy));
	yScale = d3.scale.linear()
		.domain(yDomain)
		.range([h - hMargin, hMargin])
	;

	var points = chart1.select('#points-container').selectAll('circle').data(data);

	points
		.enter()
		.append('circle')
	;

	points
		.attr('cx', xFunction)
		.attr('cy', yFunction)
		.attr('r', r)
	;


	// Update axes
	xAxisChart1.scale(xScale);
	yAxisChart1.scale(yScale);

	xAxisContainerChart1
		.attr('transform', 'translate(0,' + (h-hMargin) + ')')
		.call(xAxisChart1);
	;

	yAxisContainerChart1
		.attr('transform', 'translate(' + wMargin + ',0)')
		.attr('height', h)
		.call(yAxisChart1);
	;

};

var xScale2, yScale2;
var redrawChart2 = function() {
	subtractedData = data.map(function(d) {
		return {
			x: d.x,
			y: d.y - regressedLine(d.x)
		};
	});

	var w = parseInt(chart2.style('width'));
	var h = parseInt(chart2.style('height'));

	var xDomain = extendDomain(d3.extent(subtractedData, gx));
	xScale2 = d3.scale.linear()
		.domain(xDomain)
		.range([wMargin, w - wMargin])
		.clamp(true)
	;

	var yDomain = extendDomain(d3.extent(subtractedData, gy));
	yScale2 = d3.scale.linear()
		.domain(yDomain)
		.range([h - hMargin, hMargin])
	;

	var points = chart2.select('#points-container').selectAll('circle').data(subtractedData);

	points
		.enter()
		.append('circle')
	;

	points
		.attr('cx', function(d) {return xScale2(d.x);})
		.attr('cy', function(d) {return yScale2(d.y);})
		.attr('r', r)
	;

	var intervalData = subtractedData.filter(function(d) {
		return d.x > 260 && d.x < 300;
	});

	// Update axes
	xAxisChart2.scale(xScale2);
	yAxisChart2.scale(yScale2);

	xAxisContainerChart2
		.attr('transform', 'translate(0,' + (h-hMargin) + ')')
		.call(xAxisChart2);
	;

	yAxisContainerChart2
		.attr('transform', 'translate(' + wMargin + ',0)')
		.attr('height', h)
		.call(yAxisChart2);
	;
};

var handles;
var reinitializeEndHandles = function() {
	var xMin = 300;
	var xMax = d3.extent(data, gx)[1];
	regress(xMin, xMax);
};

var regress = function(xMin, xMax) {
	var regData = data.filter(function(d) {
		return d.x > xMin;
	});

	var lr = linearRegression(regData.map(gx), regData.map(gy));
	var lineFunction = function(x) {
		return lr.slope*x + lr.intercept;
	};

	handles = [
		{x: xMin, y: lineFunction(xMin)},
		null,
		{x: xMax, y: lineFunction(xMax)}
	];

	reinitializeMiddleHandle();
};

var reinitializeMiddleHandle = function() {
	handles[1] = {
		x: (handles[0].x + handles[2].x)/2,
		y: (handles[0].y + handles[2].y)/2
	};
};

var redrawHandles = function() {
	var circles = handleContainer.selectAll('circle').data(handles);

	circles
		.enter()
		.append('circle')
		.call(dragCircle)
	;

	circles
		.attr('cx', xFunction)
		.attr('cy', yFunction)
		.attr('r', 10)
	;
};


var lineFunction = d3.svg.line().x(xFunction).y(yFunction);
var regressedLine;
var redrawLine = function() {
	var k = (handles[2].y - handles[0].y)/(handles[2].x - handles[0].x);
	var m = handles[2].y - k*handles[2].x;

	regressedLine = function(x) {
		return k*x + m;
	};


	var lineData = xLineEnds.map(function(x) {
		return {
			x: x,
			y: regressedLine(x)
		};
	});


	// Update the path
	var lineGraph = lineContainer.selectAll('path').data([lineData])
	lineGraph.enter().append('path');
	lineGraph.attr('d', lineFunction);

	// Write line parameters to document
	var kFixed = k.toFixed(5);
	var mFixed = m.toFixed(5);
	lineParametersOutput.node().value = 'y=' + kFixed + 'x+' + mFixed;
};

d3.select('button#regress').on('click', function() {
	regress(handles[0].x, handles[2].x);
	redrawHandles();
	redrawLine();
	redrawChart1();
	redrawChart2();
	calcOutPut();
});

var handleNewData = function() {
	data = getInputData();
	redrawChart1();
	xLineEnds = extendDomain(d3.extent(data, gx));
	reinitializeEndHandles();
	redrawLine();

	redrawChart2();

	redrawHandles();
	calcOutPut();
};


var xInputNode = d3.select('input#x-input').node();
var yOutputNode = d3.select('input#y-output').node();
xInputNode.value = 280;

var calcOutPut = function() {
	var x = parseFloat(xInputNode.value);
	var y;

	// See if there is a datapoint at exactly x
	var d = subtractedData.filter(function(d) {
		return d.x === x;
	});


	if (d.length > 0) {
		// There was a datapoint at x. Simply take it's y-value
		y = d[0].y;
	} else {
		// There was no datapoint at x. Interpolate linearly between
		// the datapoints immediately below and above x.
		var comparator = function(a, b) {
			return a.x - b.x;
		};

		// Get the datapoint immediately below x
		var d1 = subtractedData.filter(function(d) {
			return d.x >= x
		}).sort(comparator);
		d1 = d1[0];

		// Get the datapoint immediately above x
		var d2 = subtractedData.filter(function(d) {
			return d.x <= x
		}).sort(comparator);
		d2 = d2[d2.length-1];

		if (d2 !== undefined && d1 !== undefined) {
			var w = d2.x - d1.x;
			var k1 = (d2.x - x)/w;
			var k2 = (x - d1.x)/w;

			y = k1*d1.y + k2*d2.y;
		} else {
			y = 0;
		}
	}

	outputLine
		.attr('x1', xScale2(x))
		.attr('x2', xScale2(x))
		.attr('y1', yScale2(0))
		.attr('y2', yScale2(y))
	;

	yOutputNode.value = y;
};

var outputLineParameters = function () {
	console.log("outputLineParameters");
};

xInputNode.addEventListener('input', calcOutPut);




dataInput.node().addEventListener('input', handleNewData, false);
handleNewData();

window.onresize = handleNewData;
