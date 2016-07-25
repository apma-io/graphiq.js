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

////////////////////////////////////////////////////////////////////////////////
//Our namespace. Everything in graphiq.js goes in here.
var giq = giq || {
	dom: {}
};

////////////////////////////////////////////////////////////////////////////////
// Logging
giq.log = function (str) {
	console.log(str);
};

////////////////////////////////////////////////////////////////////////////////
// Returns true/false based on whether or not what is a null/undefined value.
giq.isNull = function (what) {
	return (typeof what === 'undefined' || what == null);
};

////////////////////////////////////////////////////////////////////////////////
// Returns true if what is a string.
giq.isStr = function (what) {
	return (typeof what === 'string' || what instanceof String);
};

////////////////////////////////////////////////////////////////////////////////
// Returns true if what is a number
giq.isNum = function(what) {
	return !isNaN(parseFloat(what)) && isFinite(what);
};

////////////////////////////////////////////////////////////////////////////////
// Returns true if what is a function
giq.isFn = function (what) {
	return (what && (typeof what === 'function') || (what instanceof Function));
};

////////////////////////////////////////////////////////////////////////////////
//Returns true if what is an array
giq.isArr = function (what) {
	return (!giq.isNull(what) && what.constructor.toString().indexOf("Array") > -1);
};

////////////////////////////////////////////////////////////////////////////////
// Returns true if what is a bool
giq.isBool = function (what) {
	return (what === true || what === false);
};

////////////////////////////////////////////////////////////////////////////////
// Returns true if what is a basic type 
giq.isBasic = function (what) {
	return giq.isStr(what) || giq.isNum(what) || giq.isBool(what);
};

////////////////////////////////////////////////////////////////////////////////
// Convert a string to a bool
giq.toBool = function (v) {
	return (v === true || v === 'true' || v === 'y' || v === 'yes' || v === 'on' || v == '1');
};

////////////////////////////////////////////////////////////////////////////////
// Return the highest number of n numbers
giq.max = function () {
	var max = -99999999
	;

	(Array.prototype.slice.call(arguments)).forEach(function (o) {
		if (o > max) {
			max = o;
		}
	});

	return max;
};

////////////////////////////////////////////////////////////////////////////////
// Trim a string
giq.trim = function (str, maxSize) {
	if (str.length > maxSize) {
		return str.substr(0, maxSize) + '...';
	}
	return str;
};

////////////////////////////////////////////////////////////////////////////////
// Merge two objects
giq.merge = function (target, source) {
	for (var p in source) {
		target[p] = source[p];
	}
	return target;
};

//////////////////////////////////////////////////////////////////////////////
// Listen on event
giq.dom.on = function (target, event, scope, func) {
	if (giq.isNull(target)) {
		target = document.body;
	}
  if (giq.isNull(func)) {
    func = scope;
    scope = undefined;
  }

	var callback = function() {
			return func.apply(scope, arguments);
	};

	if (giq.isFn(target.addEventListener)) {
		target.addEventListener(event, callback, false);
	} else {
		target.attachEvent('on' + event, callback, false);
	}

	//Return a function that can be used to unbind the event listener
	return function () {
		if (giq.isFn(window.removeEventListener)) {
			target.removeEventListener(event, callback, false);
		} else {
			target.detachEvent('on' + event, callback);
		}
	};
};

//////////////////////////////////////////////////////////////////////////////
//Prevent default event action
giq.dom.noDefault = function (e) {
	e.cancelBubble = true;
	//e.preventDefault();
	e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
};

//////////////////////////////////////////////////////////////////////////////
//Style an element
giq.dom.style = function (node, st) {
	if (!giq.isNull(st) && node.style) {
		for (var p in st) {
			node.style[p] = st[p];
		}
	}
	return node;
};


