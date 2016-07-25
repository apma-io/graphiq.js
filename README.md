graphiq.js
==========

## What

Very thin stand-alone wrapper built ontop of SVG. Graphiq.js was built to aid in the creation of Apma Flow, and as such, is tailored towards drawing movable/connectable elements organized in groups. 

## Building

Graphiq.js uses [bakor](https://github.com/iqumulus/bakor) as its build system. With bakor globally installed on your system (`npm install -g bakor`), run `bakor` in the source folder to create the `build` folder containing a minified and an unminified version of the library. 

## API

### Draw Area

Create a new draw area by calling `giq.Canvas(<parent node>)`. This returns an object with the following functions:

  * `on`: Listen to draw area events
  * `circle(cx, cy, r, attributes)`: Draw a circle at `cx`,`cy` with a radius of `r`. `attributes` is an object containing properties to be added to the resulting SVG node. Returns an instance of `giq.Element`.
  * `rect(x, y, w, h, attributes)`: Draw a rectangle at `x`,`y` with a width of `w`, and a height of `h`. `attributes` is an object containing properties to be added to the resulting SVG node. Returns an instance of `giq.Element`.
  * `text(x, y, text, attributes)`: Draw text `text` at `x`,`y`. `attributes` is an object containing properties to be added to the resulting SVG node. Returns an instance of `giq.Element`.
  * `line(x, y, x2, y2, attributes)`: Draw a line from `x`,`y` to `x2`, `y2`. `attributes` is an object containing properties to be added to the resulting SVG node. Returns an instance of `giq.Element`.
  * `group([pnode])`: Create and return a new SVG group. `pnode` is optional, and is the node to append the group to. Returns an SVG `group` node.
  * `image(x, y, w, h, pnode)`: Creates and returns a new `image` SVG node. `x`,`y` is the position to draw the image at, `w` is the width, `h` is the height. `pnode` is optional, and is the node to append the image to.
  * `pattern(attributes)`: Create an return a new `pattern` SVG node. `attributes` is an object containing properties to be added to the resulting SVG node. 
  * `connection(a, b, color)`: Create a connection (line) between two elements, `a` and `b`, with the color of `color`. Returns a `giq.Connection` instance with the following functions:
    - `attach(a, b)`: Re-establish a connection
    - `update()`: Update the connection. This is normally done automatically when the connected elements change. 

### Element

To construct a new Element object, call `giq.Element(attributes, node, owner, events)`. `attributes` is the properties of the element (see below), `node` is the SVG node to wrap, `owner` is the draw area managing the element, and `events` is an optional `giq.events` object to be used internally in the element.

**Properties**

Valid attributes for the element constructor is:
    
    {
        "fill": "<color>",             //defaults to '#444'
        "stroke": "<color>",           //defaults to '#F5F5F5'
        "fitContent": <true|false>,    //If true, the node will resize to fit its children. Defaults to false.
        "fitContentMargins": {x: <number>, y: <number>}, //Sets child margins if fitting content
        "sizeSnap": {x: <number>, y: <number>},     //Snap size to a grid
        "minSize": {x: <number>, y: <number>},      //Minimum size of the node
        "canFocus": <true|false>
    }

**Object Properties**

The constructor returns an object with the following interface:

  * `getRelativeSides`: 
  * `attr(object)`: Set one or more properties for the element.
  * `svgattr(object)`: Set one or more properties for the SVG node
  * `on(event, callback)`: Listen to an element event. Valid events:
      - `mouseup`
      - `mousedown`
      - `mousemove`
      - `click`
      - `dblclick`
      - `mouseover`
      - `mouseout`
      - `change`: The element has changed.
      - `destroy`: Called right before the element is destroyed.
      - `focus`: Called when the element gains focus.
      - `blur`: Called when the element loses focus.
  * `setRotation(a, x, y)`: Set the rotation of the element. `a` is the angle. `x` and `y` are both optional. If supplied, they determin the pivot to rotate on.
  * `rotate(a, x, y)`: Same as `setRotation`, but adds the supplied angle to the current rotation rather than overriding it.
  * `setPosition(x, y)`: Set the position of the element to `x`,`y`.
  * `scale(fx, fy)`: Scale the element by the factor supplied.
  * `setSize(w, h)`: Set the element size to `w`,`h`.
  * `addChild(child)`: Adds another element as a child to this element. This turns the current element into a group, and the childs will operate in a coordinate system relative to the parent. Returns a function that can be called to remove the child at a later point.
  * `addChildren(child1, child2, child3, ...)`: Add multiple children to the element. See `addChild`. 
  * `remChild(child, destroyIt)`: Removes the child `child` from the element. If `destroyIt` is seet to true, the child will be removed from the draw area as well as for the element. 
  * `node`: The SVG node which the element wraps.
  * `posOffset()`: Returns an object `{x, y}` containing the elements position relative to the parent element.
  * `pos`: The current position of the element.
  * `posLast`: The position of the element prior to the last transform applied.
  * `wpos()`: Returns the elements position in world coordinates.
  * `lwpos()`: Returns the elements position in world coordinates prior to the applying the last transform.
  * `toFront()`: Bring the element to the front. 
  * `focus()`: Focus the element
  * `blur()`: Blur the element
  * `size()`: Return the size of the element
  * `sizeLast()`: Return the size of the element prior to applying the last transform.
  * `destroy()`: Destroy the element - this removes it from the draw area.
  * `refresh()`: Force an update of the element. 
  * `getBBox()`: Return a bounding box for the element.

### ElementMover

ELements can be made movable using `giq.ElementMover(element, before, done)`. `element` is the element to make movable, `before` is the function to call when starting to move, `done` is the the function to call when done moving (i.e. the mouse button was released).

Note that when applying the mover, all the positions of the element and its children are updated as the element is moved. In other words, no further action is required.

The function returns an object with the following interface:
  * `disable`: Disable the mover
  * `enable`: Enable the mover

## License 

[MIT](LICENSE).