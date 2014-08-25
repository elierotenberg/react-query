react-query
===========
Simple lib with a familiar feeling for manipulating React Virtual DOM descriptors.
Using the wrapper function conveniently named `$` (which you can exports with whatever
name you want if you use other $-based libs, which you probably shouldn't in a React 
project), you can easily manipulate VDOM descriptors, most often found in `render()` and `props.children`.
This is useful both for `React.DOM` which React provides out of the box but also for you own descriptors.

This opens the way for decorating `render()` at will, and naturally implement decorator components by passing them
children instead of props containing descriptors.

***IMPORTANT NOTE***: Here we manipulate only __descriptors__ which are typically constructed using JSX. If you are new
to React, you ought to know that these are __not__ actually mounted nodes, but merely a descriptions of what may eventually
be mounted by React. For example, you don't have access to the children that these components will render upon mounting.

By design choice, `react-query` never mutates anything. All mutations-like functions returns a new wrapped VDOM descriptors array,
on which the mutations have been applied. This may have performance issues and will probably be adressed in the future by opting-in
for in-place mutations.

### Example

Simple example of using `react-query` to create a decorator component which will use the markup of its children to
implement a simple dropdown menu.

```js
/** @jsx React.DOM */
var React = require("react");
var $ = require("react-query");

var DropDown = React.createClass({
    getInitialState: function() {
        return { toggled: true };
    },
    toggleMenu: function() {
        this.setState({ toggled: !this.state.toggled });
    },
    // Imperative, jQuery-style:
    render: function() {
        var $children = $(this.props.children);
        var $toggle = $children.find(".dropdown-toggle").prop("onClick", this.toggleMenu);
        var $menu = $children.find(".dropdown-menu").toggleClass("dropdown-toggled", this.state.toggled);
        return $.merge($toggle, $menu).wrap(<div className="dropdown" />).expose();
    },
    // Functionally, React-style:
    render: function() {
        return $(this.props.children).replace({
            ".dropdown-toggle": function() {
                return $(this).prop("onClick", this.toggleMenu);
            },
            ".dropdown-menu": function() {
                return $(this).toggleClass("dropdown-toggled", this.state.toggled);
            },
        }).wrap(<div className="dropdown" />);
    }
});

React.renderComponent(<DropDown>
    <a className="dropdown-toggle">Toggle</a>
    <ul className="dropdown-menu">
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
</DropDown>, document.body);
```


### API

Like some other $-exporting lib, `react-query` expose both a static and an Object-oriented API.

The static API is not meant to be used publicly, though, except for a few functions: for internal convenience most of them
are curried, which is often impractical in JS.

The OO API manipulates `$` instances, which are thin wrappers around an array of descriptors. You can get a new instance by calling the constructor,
with or without `new`. Many methods of the `$` instances return a new `$` instance, which allows for chaining.

#### Static methods (methods of the `$` object)

##### `$.merge(wrapper1: $, wrapper2: $, ...): $`
Merges/flattens multiple $ instances into a single $ instance.

##### `$.toString(vnode: descriptor): String`
Pretty-prints a single descriptor.

##### `[new] $(vnode: descriptor): $` or `[new] $(vnodes: Array<descriptor>): $`
Constructs a new $ instance wrapping one or several vnode descriptors.

#### OO methods (methods of `$` instances)

##### `$r.each(fn: Function(vnode, key)): undefined`
Iterates over all the descriptors inside `r` and calls `fn`. `fn` is applied successively
with the current vnode as the `this` context (so that `$(this)` is what you think), and passed
vnode and key as arguments (for convenience with `_` functions).

##### `$r.map(fn: Function(vnode, key): any): Array`
Similar to `$#each` but returns a list that contains the return values of each call to `fn`.

##### `$r.all(predicate: Function(vnode, key): any): boolean`
Similar to `$#map` but returns `true` if and only if `predicate` has returned a truthy value for
each call. Returns `false` otherwise.

##### `$r.filter(predicate: Function(vnode, key): any): $`
Similar to `$#map` but returns a new `$` instance which wraps only the descriptors in `$r` that match
the predicate (i.e. the predicate has returned a truthy value).

##### `$r.children(): $`
Returns a new `$` instance wrapping the children of every descriptor in `$r`.

##### `$r.descendants(): $`
Similar to `$#children` but the returned instance wraps all the descendants (not only the direct children).

##### `$r.tree(): $`
Similar to `$#descendants` but also contains the elements initially in `$r`.

##### `$r.hasClass(className: String): boolean`
Returns true if and only if all descriptors in `$r` have the given `className` (as in "HTML class attribute as a React prop").

##### `$r.first(): descriptor`
Returns the first element wrapped in `$r` unless `$r` is empty, in which case it throws.

##### `$r.size(): Number`
Returns the number of elements wrapped in `$r`.

##### `$r.single(): descriptor`
Similar to `$#first` but throws if `$r` doesn't have exactly 1 element.

##### `$r.tagName(): String` or `$r.tagName(tagName: String): $`
Getter form: returns the `displayName` (as in "HTML tag name as a React displayName") of the first element in `$r`.
Setter form: returns a new `$` instance in which all the wrapped elements have their displayName set to the given value.

##### `$r.prop(name: String): any` or `$r.prop(name: String, value: any): $`
Similar to `$r#tagName` but for a prop.

##### `$r.props(): Object` or `$r.props(props: Object<String, any>): $`
Getter form: returns an object containing the props of the first element in `$r`.
Setter form: returns a new `$` instance in which all the wrapped elements have their props set to the given values. It doesn't touch the unspecified props.
Warning: `children` is a prop like any other.

##### `$r.classList(): Array<String>` or `$r.classList(classList: Array<String>): $`
Getter form: returns the list of the classNames of the first element in `$r`.
Setter form: returns a new `$` instance in which all the wrapped elements have their `className` prop set as the join of `classList` with `' '`.

##### `$r.addClass(className: String): $`
Returns a new `$` instance in which all the wrapped elements have their `className` prop augmented with the given `className` (doesn't create duplicates).

##### `$r.removeClass(className: String): $`
Similar to `$#addclass` but removes a class instead.

##### `$r.toggleClass(className: String, [optState: boolean]): $`
If `optState` is given, returns a new `$` instance in which all the wrapped elements have the class `className` if and only if `optState` is truthy.
Else, returns a new `$` instance in which all the wrapped elements have the class `className` if and only if they didn't have it before.

##### `$r.get(k: Number): descriptor`
Returns the descriptor at index `k` in the wrapped array, or throws if it doesn't exist.

##### `$r.toChildren(): Array<descriptor>` (alias: `$r.expose(): Array<descriptor>`)
Returns the unwrapped array of descriptors, making it suitable for a return value of `render` or being passed as children to another descriptor.

##### `$r.toString(): String`
Pretty-prints the underlying descriptors. Useful for console dirty debugging.

##### `$r.equals(vnode: descriptor): boolean` or `$r.equals($r: $): boolean`
Return true if and only if the given descriptor equals each descriptor in `$r`.
Deep comparison is made for `displayName` and regular props (other than `children`), while `$#equals` is called recursively to compare `children` props.

##### `$r.find(selector: String): $`
Performs a CSS-selector-like query and returns the matching descriptors wrapped in a new `$` instance.
Accepted tokens are:
- `className` selectors using `.` operator (like CSS classes)
- `props` selectors using `[]` operator and `=`, `~=`, `|=`, `^=`, `$=`, `*=` modifiers (like CSS attributes)
- `displayName` selectors (using plain strings) (like CSS tag names)
- any combination (e.g. "a.my-class[href^=http]")
- descendant nesting operator (space) direct child nesting operator (`>`) (like CSS nesting without support for `~` and `+`).

Note that performance-wise, unlike browsers, `$` looks up top-down and not bottom-up.

##### `$r.wrap(vnode: descriptor): $`
Returns a new `$` instance in which each descriptor is wrapped as the last child of `vnode` (and sole child if `vnode` had no children of course).

##### `$r.append(vnode: descriptor): $`
Returns a new `$` instance in which each descriptor has `vnode` as its last child (and sole child if this descriptor had no children of course).


### LICENSE
MIT Elie Rotenberg <elie@rotenberg.io>
