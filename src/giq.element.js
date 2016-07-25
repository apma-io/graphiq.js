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

giq.Element = function (attributes, node, owner, events) {
	var _events = events || giq.events(),
			//Current rotation
			rot = {a: 0, x: 0, y: 0},
			//Current position
			pos = {x: 0, y: 0},
			//Last position
			lpos = {x: 0, y: 0},
			//Current size
			size = {w: 0, h: 0},
			//Last size
			lsize = {x: 0, y: 0},
			//Scale factor
			scaleFactor = {x: 1, y: 1},
			//The element properties
			properties = giq.merge({
				fill: '#444',
				stroke: '#F5F5F5',
				fitContent: false,
				fitContentMargins: {x: 0, y: 0},
				className: '',
				sizeSnap: {x: 0, y: 0},
				minSize: {x: 0, y: 0},
				canFocus: true
			}, attributes),
			//Userdata
			userdata = {},
			group,
			parent,
			exports,
			children = []
	;

	if (giq.isNull(node)) {
		giq.log('giq.Element: Invalid node supplied');
		return false;
	}

	//////////////////////////////////////////////////////////////////////////////

	//Attach DOM events
	[	
		'mouseup', 
		'mousedown', 
		'mousemove', 
		'click', 
		'dblclick', 
		'moseover', 
		'mouseout'
	].forEach(function (evnt) {
		giq.dom.on(node, evnt, function (e) {
			_events.emit(evnt, e);
			return giq.dom.noDefault(e);
		});
	});

	//Need a special handler to handle focus events
	giq.dom.on(node, 'mousedown', function (e) {
		if (parent && !properties.canFocus) {
			parent.focus();
			return giq.dom.noDefault(e);
		}

		if (giq.__focused === exports || !properties.canFocus) {
			return;
		}

		focus();

		return giq.dom.noDefault(e);
	});

	//////////////////////////////////////////////////////////////////////////////

	function getSize() {
		return {
			x: size.w * scaleFactor.x,
			y: size.h * scaleFactor.y
		};
	}

	function getLastSize() {
		return {
			x: lsize.x,
			y: lsize.y
		};
	}

	function getLastPosition() {
		return {
			x: lpos.x,
			y: lpos.y
		}
 	}

	//Initialize the element. Sets the size/position and applies it.
	function init() {
		size.w = properties.r || properties.width || 0;
		size.h = properties.r || properties.height || 0;
		pos.x = properties.cx || properties.x || pos.x;
		pos.y = properties.cy || properties.y || pos.y;
		rot.x = pos.x + (size.w / 2);
		rot.y = pos.y + (size.h / 2);
		updateTransformation();
	}

	//Change a property
	function attr(attrs, target) {
		giq.merge(properties, attrs);

		target = target || node;

		Object.keys(properties).forEach(function (key) {
			if (key !== 'cx' && key !== 'cy' && key !== 'x' && key !== 'y' && key !== 'text') {
				target.setAttributeNS(null, key, properties[key]);
			}
			if (key === 'text') {
				node.textContent = properties[key];
			}
		});

		target.setAttributeNS(null, 'class', properties.className);

		childChange();
		_events.emit('change');
	}

	function svgattr(attr) {
		Object.keys(attr).forEach(function (key) {
			if (key !== 'cx' && key !== 'cy' && key !== 'x' && key !== 'y' && key !== 'text') {
				node.setAttributeNS(null, key, attr[key]);
			}
			if (key === 'text') {
				node.textContent = attr[key];
			}
		});
	}

	//Update the transformations for the node
	function updateTransformation() {

		(group || node).setAttributeNS(
			null, 
			'transform', 
		//	'rotate(' + rot.a + ' ' + rot.x + ' ' + rot.y + ') ' +
			'translate(' + pos.x + ' ' + pos.y + ') ' + 
			'scale(' + scaleFactor.x + ' ' + scaleFactor.y + ')'
		);

		if (lpos.x !== pos.x || lpos.y !== pos.y) {
			_events.emit('change');

			children.forEach(function(child) {
				//Propagate the change
				child._emit('change');
			});
		}

		lpos.x = pos.x;
		lpos.y = pos.y;
	}

	function snapSize() {
		if (properties.sizeSnap.x > 0) {
			size.w = Math.floor(size.w / properties.sizeSnap.x) * properties.sizeSnap.x;
		}
		if (properties.sizeSnap.y > 0) {
			size.h = Math.floor(size.h / properties.sizeSnap.y) * properties.sizeSnap.y;
		}
	}

	//Update the size of the node
	function updateSize() {
		snapSize();

		if (properties.minSize.x > size.w) {
			size.w = properties.minSize.x;
		}

		if (properties.minSize.y > size.h) {
			size.h = properties.minSize.y;
		}

		node.setAttributeNS(null, 'r', size.w);
		node.setAttributeNS(null, 'width', size.w * scaleFactor.x);
		node.setAttributeNS(null, 'height', size.h * scaleFactor.y);

		if (lsize.x !== size.w || lsize.y !== size.h) {
			_events.emit('change');
			//_events.emit('resize');
		}

		lsize.x = size.w;
		lsize.y = size.h;
	}

	//Set a new rotation state
	function setRotation(a, x, y) {
		rot.a = a;
		rot.x = x || pos.x + (size.w / 2);
		rot.y = y || pos.y + (size.h / 2);
		updateTransformation();
	}

	//Apply a rotation to the node
	function rotate(a, x, y) {
		rot.a += a;
		rot.x = x || pos.x + (size.w / 2);
		rot.y = y || pos.y + (size.h / 2);
		updateTransformation();
	}

	//Set the position of the node
	function setPosition(x, y) {
		pos.x = x;
		pos.y = y;
		updateTransformation();
	}

	//Scale the node by a factor of fx, fy
	function scale(fx, fy) {
		scaleFactor.x = fx || 0;
		scaleFactor.y = fy || 0;
		updateTransformation();
	}

	//Set the base size
	function setSize(x, y) {
		size.w = x || size.w;
		size.h = y || size.h;
		updateSize();
	}

	//Apply transformations to the children
	function childChange() {
		if (children.length === 0) {
			return;
		}

		if (properties.fitContent) {
			var adder = 0;
			size.w = size.h = 0;
			children.forEach(function (c) {
				var bb = c.node.getBBox();

				if (c.properties['text-anchor'] && c.properties['text-anchor'] === 'end') {
					if (adder < bb.width + 20) {
						//adder = bb.width + 20;//Math.abs(c.pos().x - bb.width);
					}

					if (size.w < bb.width + (c.pos().x - bb.width)) {
						size.w = bb.width + (c.pos().x - bb.width) + properties.fitContentMargins.x;
					}


				} else if (size.w < bb.width + c.pos().x) {
					size.w = bb.width + c.pos().x + properties.fitContentMargins.x;
				}
				
				if (size.h < bb.height + c.pos().y) {
					size.h = bb.height + c.pos().y + properties.fitContentMargins.y;
				}
			});
			size.w += adder;

			size.h++;

			updateSize();
		}
	}

	//Remove a child
	function remChild(child, destroyIt) {
		children = children.filter(function (b) {
			if (b === child) {
				if (destroyIt) {
					child.destroy();
				} else {
					//group.removeChild(child.gnode());
					var wp = getWorldPosition();
					child.gnode().parentNode.removeChild(child.gnode());
					group.parentNode.appendChild(child.gnode());
					//child.setPosition(child.pos().x - wp.x, child.pos().y - wp.y);
					child.setParent(undefined);					
				}				
				return false;
			}
			return true;
		});
	}

	//Add a child to the element - returns a function that can be called 
	//to remove the child.
	function addChild(child) {
		if (giq.isNull(group)) {
			group = owner.group(parent ? parent.group() : undefined);
			group.appendChild(node);
			node.setAttributeNS(null, 'x', 0);
			node.setAttributeNS(null, 'y', 0);
			node.setAttributeNS(null, 'transform', '');
			updateTransformation();
		}

		group.appendChild(child.gnode());
	
		child.setParent(exports);

		children.push(child);

		//child.on('change', childChange);
		//child.on('destroy', function () {
		//	children = children.filter(function (b) {
		//		return b !== child;
		//	});
		//	childChange();
		//});
		childChange();

		//_events.on('change', child.updateTransformation);

		//child.toFront();

		return function (destroyIt) {
			remChild(child, destroyIt);
		}
	}

	function addChildren() {
		(Array.prototype.slice.call(arguments)).forEach(function (o) {
			addChild(o);	
		});
	}

	//Destroy the element
	function destroy() {
		_events.emit('destroy');
		if (!giq.isNull(group)) {
			group.parentNode.removeChild(group);
			group.innerHTML = '';
			delete node;
			delete group;
		} else {
			node.parentNode.removeChild(node);
			delete node;
		}
	}

	function animate(attr, duration) {
		//giq.animation.add(node, attr, duration);
	}


	function setParent(p) {
		parent = p;

		if (!giq.isNull(p)) {
			//p.on('change', function () {
			//	_events.emit('change');
			//});
		}
	}

	//Retrieve the position offset as it relates to the parent element
	function posOffset() {
		if (parent) {
			return {
				x: parent.pos().x,// + pos.x,
				y: parent.pos().y// + pos.y
			};
		}
		return {x: 0, y: 0};
	}

	//Get the local position for the element
	function getPosition() {
		return {
				x: pos.x,
				y: pos.y
			}
	}

	//Get the approximate sides 
	function getRelativeSides() {
		if (parent) {
			var p = getWorldPosition(),
					pp = parent.wpos(),
					ps = parent.size(),
					res = {}
			;

			res.x = pos.x < ps.x / 2 ? 'left' : 'right';
			res.y = p.y < pp.y + (ps.y / 2) ? 'top' : 'bottom';

			return res;
		}
		return {
			x: 'left',
			y: 'top'
		}
	}

	//Get the world position for the element
	function getWorldPosition() {
		if (giq.isNull(parent)) {
			return exports.pos();
		}
		return {
			x: parent.wpos().x + pos.x,
			y: parent.wpos().y + pos.y
		}
	}

	function getLastWorldPosition() {
		if (giq.isNull(parent)) {
			return exports.posLast();
		}
		return {
			x: parent.lwpos().x + lpos.x,
			y: parent.lwpos().y + lpos.y
		}
	}

	//Bring it to the front
	function toFront() {
		var p;

		if (group) {
			p = group.parentNode;
			if (p) {
				p.removeChild(group);
				p.appendChild(group);
			}
		}

		p = node.parentNode;
		if (p) {
			p.removeChild(node);
			p.appendChild(node);
		}
	}

	function focus() {
		if (giq.__focused) {
			giq.__focused.blur();
		}
		giq.__focused = exports;

		_events.emit('focus');
	}

	function blur() {
		_events.emit('blur');
	}

	attr(attributes);
	init();

	exports = {
		_emit: _events.emit,
		getRelativeSides: getRelativeSides,
		attr: attr,
		svgattr: svgattr,
		on: _events.on,
		setRotation: setRotation,
		rotate: rotate,
		setPosition: setPosition,
		scale: scale,
		setSize: setSize,
		addChild: addChild,
		addChildren: addChildren,
		remChild: remChild,
		node: node,
		animate: animate,
		properties: properties,
		userdata: userdata,
		setParent: setParent,
		posOffset: posOffset,
		pos: getPosition,
		posLast: getLastPosition,
		wpos: getWorldPosition,
		lwpos: getLastWorldPosition,
		toFront: toFront,
		focus: focus,
		blur: blur,
		size: getSize,
		sizeLast: getLastSize,
		destroy: destroy,
		refresh: childChange,
		getBBox: function() {
			//For some reason we cant do getBBox: node.getBBox here
			return node.getBBox();
		},
		group: function () {
			return group || false;
		},
		gnode: function () {
			return group || node;
		},
		getParent: function() {
			return parent;
		}
	};

	return exports;
};