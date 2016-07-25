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
// Events object
/*
	Returns an object with the following functions
		- on
		- emit
		- clear
*/
giq.events = function () {
	var listeners = []
	;

	//////////////////////////////////////////////////////////////////////////////
	//Emit an event
	function emit (which) {
		if (!giq.isNull(listeners[which])) {
			var args = Array.prototype.slice.call(arguments);
			args.splice(0, 1);
			listeners[which].forEach(function (listener) {
				listener.fn.apply(listener.ctx, args);
			});
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//Clear events
	function clear() {
		listeners = [];
 	}

 	//////////////////////////////////////////////////////////////////////////////
 	//Bind 
 	/*
		Returns a function that can be called to unbind the event
 	*/
	function on(evnt, context, fn) {
		var id, stack = [];

		if (giq.isFn(context) && giq.isNull(fn)) {
			fn = context;
			context = window;
		}

		if (giq.isNull(context) && giq.isNull(fn) && !giq.isBasic(evnt)) {
			Object.keys(evnt).forEach(function (key) {
				stack.push(on(key, evnt[key]));
			});

			return function () {
				stack.forEach(function (unbind) {
					unbind();
				});
			}
		}

		if (giq.isNull(fn)) {
			return function(){};
		}

		if (typeof listeners[evnt] === 'undefined') {
			listeners[evnt] = [];
		}

		id = (new Date()).getTime() + '-' + listeners[evnt].length;

		listeners[evnt].push({
			id: id,
			fn: fn,
			ctx: context
		});

		return function () {
			listeners[evnt] = listeners[evnt].filter(function(listener) {
				return (listener.id !== id);
			});
		};
	}

	//////////////////////////////////////////////////////////////////////////////
	// Return public interface
	return {
		emit: emit,
		on: on,
		clear: clear
	};
};
