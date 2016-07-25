/*******************************************************************************

Copyright (c) 2014-2016, IQumulus LLC

Original Author: Chris Vasseng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*******************************************************************************/

//Handles moving of elements
/*
	returns:
	{
		function enable
		function disable
	}
*/
giq.ElementMover = function (elm, before, done) {
	var isMoving = false,
			canMove = true,
			startPos = {x: 0, y: 0},
			startMPos = {x: 0, y: 0},
			dpos = {x: 0, y: 0},
			offset = {x: 0, y: 0},
			moveListener,
			upListener,
			didMove = false,
			events = giq.events()
	;

	elm.on('mousedown', function (e) {
		if (canMove) {
			isMoving = true;
			didMove = false;

			events.emit('start');

			startPos = elm.pos();

			//Disable selection while moving
			giq.dom.style(document.body, {
				'-webkit-touch-callout': 	'none',
		    '-webkit-user-select': 		'none',
		    '-khtml-user-select': 		'none',
		    '-moz-user-select': 			'none',
		    '-ms-user-select': 				'none',
		    'user-select': 						'none'
			});

			offset = {
				x: e.clientX - startPos.x - elm.posOffset().x, 
				y: e.clientY - startPos.y - elm.posOffset().y
			};

			startMPos = {
				x: (e.clientX - offset.x) , 
				y: (e.clientY - offset.y) 
			};

			moveListener = giq.dom.on(document.body, 'mousemove', function (e) {
				if (isMoving) {
					dpos.x = ( (e.clientX - startMPos.x) ) - offset.x;
					dpos.y = ( (e.clientY - startMPos.y) ) - offset.y;

					elm.setPosition(
						startPos.x + dpos.x, 
						startPos.y + dpos.y
					);
					if (!didMove) {
						if (giq.isFn(before)) {
							before();
						}
					}
					didMove = true;
				}
			});

			upListener = giq.dom.on(document.body, 'mouseup', function (e) {
				if (isMoving) {

					if (didMove) {
						elm.setPosition(
							Math.floor( (startPos.x + dpos.x + 6) / 12) * 12,//startPos.x + dpos.x, 
							Math.floor( (startPos.y + dpos.y + 10) / 50) * 50
						);
					}

					events.emit('done');

					//Set the selections back to the default
					giq.dom.style(document.body, {
						'-webkit-touch-callout': 	'',
				    '-webkit-user-select': 		'',
				    '-khtml-user-select': 		'',
				    '-moz-user-select': 			'',
				    '-ms-user-select': 				'',
				    'user-select': 						''
					});
				}
				if (giq.isFn(done)) {
					done();
				}
				isMoving = false;
				if (moveListener) {
					moveListener();
				}
				upListener();
			});
		}
	});

	return {
		on: events.on,
		disable: function () {canMove = false},
		enable: function () {canMove = true}
	}
};

/*
		A connection has the same exported interface as a standard
		element, with the exception that it adds an attach function
		which connects to other elements.

		The connection can be cleanly removed by calling
		connection.destroy();
*/
giq.Connection = function (attributes, node, owner, events) {
	var elm = giq.Element(attributes, node, owner, events),
			path = '',
			callback = [],
			update
	;

	function signum(x) {
    return (x < 0) ? -1 : 1;
	}

	function absolute(x) {
	    return (x < 0) ? -x : x;
	}

	function midMarkers(poly, spacing){
	  var svg = poly.ownerSVGElement;
	  for (var pts=poly.points,i=1;i<pts.numberOfItems;++i){
	    var p0=pts.getItem(i-1), p1=pts.getItem(i);
	    var dx=p1.x-p0.x, dy=p1.y-p0.y;
	    var d = Math.sqrt(dx*dx+dy*dy);
	    var numPoints = Math.floor( d/spacing );
	    dx /= numPoints;
	    dy /= numPoints;
	    for (var j=numPoints-1;j>0;--j){
	      var pt = svg.createSVGPoint();
	      pt.x = p0.x+dx*j;
	      pt.y = p0.y+dy*j;
	      pts.insertItemBefore(pt,i);
	    }
	    if (numPoints>0) i += numPoints-1;
	  }
	}

	function attach(a, b) {

		//Remove existing callbacks, if any.
		callback = callback.filter(function (fn) {
			fn();
			return false;
		});

		update = function() {
			var 
					fa = a.wpos(),
					ta = b.wpos(),

					startX = fa.x,
					startY = fa.y - (a.getBBox().height / 2),
					endX = ta.x,
					endY = ta.y - (b.getBBox().height / 2),

					left = fa.x > ta.x,
					right = fa.x < ta.x,
					higher = fa.y > ta.y,
					lower = fa.y < ta.y,

					thresholdX = 40,
					thresholdY = 40
			;
	    
			/*
				We need to handle four cases:
					- target is to the left of the target, and further up
					- target is to the right of the target, and further up
					- target is to the left of target, and further down
					- target is to the right of the target, and further down
			
					The required lines will be either 3 (target is to the left) or 5 (target is to the right).
			*/

			if (b.getParent()) {
				thresholdY = b.getParent().size().y;
			}

			if (right) {
				path = 'M' + startX + ' ' + startY +
							 ' L' + (startX + thresholdX) + ' ' + startY +
							 ' L' + (startX + thresholdX) + ' ' + endY +
							 ' L' + endX + ' ' + endY 
				; 
			} else if (left && higher) {
				path = 'M' + startX + ' ' + startY +
							 ' L' + (startX + thresholdX) + ' ' + startY +
							 ' L' + (startX + thresholdX) + ' ' + (endY - thresholdY) +
							 ' L' + (endX - thresholdX) + ' ' + (endY - thresholdY) +
							 ' L' + (endX - thresholdX) + ' ' + endY + 
							 ' L' + endX + ' ' + endY 
				; 

			} else if (left && lower) {
				path = 'M' + startX + ' ' + startY +
							 ' L' + (startX + thresholdX) + ' ' + startY +
							 ' L' + (startX + thresholdX) + ' ' + (endY + thresholdY) +
							 ' L' + (endX - thresholdX) + ' ' + (endY + thresholdY) +
							 ' L' + (endX - thresholdX) + ' ' + endY + 
							 ' L' + endX + ' ' + endY 
				;
			}

			elm.node.setAttributeNS(null, 'd', path);
			//midMarkers(elm.node, '4');
			elm.toFront();
		}

		callback.push(a.on('change', update));
		callback.push(b.on('change', update));

		update();
	}

	return giq.merge(elm, {
		attach: attach,
		update: update
	});
};

////////////////////////////////////////////////////////////////////////////////
// Canvas
giq.Canvas = function (parent, options) {
	var svgNS = 'http://www.w3.org/2000/svg',
			svg = document.createElementNS(svgNS,'svg'),
			exports = {},
			events = giq.events(),
			arrowMarker = document.createElementNS(svgNS, 'marker'),
			arrowPath = document.createElementNS(svgNS, 'path'),
			defs = document.createElementNS(svgNS, 'defs')
	;

	arrowMarker.setAttributeNS(null, 'id', 'arrowMarker');
	arrowMarker.setAttributeNS(null, 'markerUnits', 'strokeWidth');
	arrowMarker.setAttributeNS(null, 'markerWidth', '2');
	arrowMarker.setAttributeNS(null, 'markerHeight', '4');
	arrowMarker.setAttributeNS(null, 'refX', 0.1);
	arrowMarker.setAttributeNS(null, 'refY', 2);
	arrowMarker.setAttributeNS(null, 'orient', 'auto');

	arrowPath.setAttributeNS(null, 'd', 'M0,0 V4 L2,2 Z');
	arrowPath.setAttributeNS(null, 'fill', '#43A047');
	arrowMarker.appendChild(arrowPath);
	defs.appendChild(arrowMarker);

	//Initialize the SVG node
	svg.setAttributeNS(null, 'height', '100%');
	svg.setAttributeNS(null, 'width', '100%');
	svg.setAttributeNS(null, 'viewbox', '0 0 3 2');

	svg.appendChild(defs);

	//Resolve the parent and attach the svg diagram
	if (giq.isStr(parent)) {
		parent = document.getElementById(parent);
	}

	if (giq.isNull(parent) || !giq.isFn(parent.appendChild)) {
		giq.log('giq.Canvas: Invalid parent supplied');
		return false;
	}

	parent.appendChild(svg);

	if (options) {

	}

	//Attach a listener to the diagram
	giq.dom.on(svg, 'mousedown', function (e) {
		events.emit('mousedown', e);
		//If there's a focused element, unfocus it.
		if (giq.__focused) {
			giq.__focused.blur();
		}

		return giq.dom.noDefault(e);
	});

		[	
		'mouseup', 
		'mousedown', 
		'mousemove', 
		'click', 
		'dblclick', 
		'moseover', 
		'mouseout'
	].forEach(function (evnt) {
		giq.dom.on(svg, evnt, function (e) {
			events.emit(evnt, e);
		});
	});


	//////////////////////////////////////////////////////////////////////////////

	//Create a basic element
	function elm(tp, attr, pnode) {
		var node = document.createElementNS(svgNS, tp),
				element = giq.Element(attr, node, exports);
		(pnode || svg).appendChild(node);
		return element;
	}

	//Pattern
	function pattern(attr) {
		var node = document.createElementNS(svgNS, 'pattern');
		if (attr) {
			Object.keys(attr).forEach(function (key) {
				node.setAttributeNS(null, key, attr[key]);
			});
		}
		svg.appendChild(node);
		return node;
	}

	//Image 
	function image(x, y, w, h, image, pnode) {

		var node = document.createElementNS(svgNS, 'image');
		node.setAttribute('x', x);
		node.setAttribute('y', y);
		node.setAttribute('width', w);
		node.setAttribute('height', h);
		node.setAttributeNS('http://www.w3.org/1999/xlink','href', image);

		(pnode || svg).appendChild(node);
		return node;
	}

	//Create a circle element
	function circle(cx, cy, r, attr) {
		return elm('circle', {
			cx: cx,
			cy: cy,
			r: r
		});
	}

	function animation(target, attr, duration) {

	}

	//Create a rectangle element
	function rect(x, y, w, h, attr) {
		return elm('rect', giq.merge({
			x: x,
			y: y,
			width: w,
			height: h
		}, attr));
	}

	function path(x, y, attr) {
		return elm('path', giq.merge({
			x: x,
			y: y
		}, attr));
	}

	function line(x, y, x2, y2, attr) {
		return elm('line', giq.merge({
			x1: x,
			y1: y,
			x2: x2,
			y2: y2
		}, attr));
	}

	//Create a text element
	function text(x, y, text, attr) {
		return elm('text', giq.merge({
			text: text,
			x: x,
			y: y,
			stroke: 'none'
		}, attr));
	}

	//Create a rounded rectangle
	function rrect(x, y, w, h, r1, r2, r3, r4) {
		var path = '',
				array = []
		;

		array = array.concat(["M",x,r1+y, "Q",x,y, x+r1,y]); //A
	  array = array.concat(["L",x+w-r2,y, "Q",x+w,y, x+w,y+r2]); //B
	  array = array.concat(["L",x+w,y+h-r3, "Q",x+w,y+h, x+w-r3,y+h]); //C
	  array = array.concat(["L",x+r4,y+h, "Q",x,y+h, x,y+h-r4, "Z"]); //D


	}

	//Create an SVG group
	function group(pnode) {
		var g = document.createElementNS(svgNS, 'g');
		(pnode || svg).appendChild(g);
		return g;
	}

	//Create a connection between two elements
	function connection(a, b, color) {
		var node = document.createElementNS(svgNS, 'path'),
				element = giq.Connection({fill: 'none', stroke: color || '#43A047', 'stroke-width':'4', 'opacity':0.5}, node, exports)
		;
		element.attach(a, b);
		svg.appendChild(node);
		return element; 
	}

	exports = {
		on: events.on,
		circle: circle,
		rect: rect,
		group: group,
		text: text,
		connection: connection,
		pattern: pattern,
		image: image,
		path: path,
		line: line
	};

	return exports;

};