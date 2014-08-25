/** @jsx React.DOM */
var React = require("react");
var assert = require("assert");
var $ = require("../");


var $div = $(<div className="hello world" />);
console.warn("div", $div.toString());
console.warn($.getClassList($div.first()));
assert($div.hasClass("hello"));
assert($div.hasClass(("world")));
assert(!($div.hasClass("foo")));
assert($div.toString() === '<div className="hello world" />');
var $div2 = $(<div className="foobar" />);
var $nested = $(<div className="outer">
        <p className="inner"></p>
</div>);
console.warn("nested", $nested.toString());
/*
 * <div className="outer">
 *     <p className="inner" />
 * </div>
 */
var $inner = $nested.find(".inner");
console.warn("inner", $inner.toString());
/*
 * <p className="inner" />
 */
var $wrapped = $nested.wrap(<div className="wrapper" />);
console.warn("wrapped", $wrapped.toString());
var $appended = $nested.append(<div className="appended" />);
console.warn("appended", $appended.toString());
/*
 * <div className="outer">
 *     <p className="inner" />
 *     <div className="appended" />
 * </div>
 */
 var $replaceProps = $nested.props({ hello: "world" });
 console.warn("replaceProps", $replaceProps.toString());
/*
 * <div className="outer" hello="world">
 *     <p className="inner" />
 * </div>
 */
 var $toggleClass = $nested.toggleClass("outer").toggleClass("baz").addClass("foo").removeClass("baz");
 console.warn("toggleClass", $toggleClass.toString());
/*
 * <div className="foo">
 *     <p className="inner" />
 * </div>
 */
 var $replace = $nested.replace(".inner", <div className="new-inner" />);
 console.warn("replace", $replace.toString());

 var $replaceFn = $nested.replace(".inner", function() {
    var $r = $(this).wrap(<div className="wrapped" />);
    console.warn($r.toString());
    return $r;
 });
 console.warn("replaceFn", $replaceFn.toString());

var $li = $nested.replace({ ".inner": function() { return $(this).addClass("hello").props({ foo: "bar" }).text("hello world !!!"); }});
console.warn($li.toString());

var $dropdown = $(
	<div className="dropdown">
		<a className="DropDown-toggle dropdown-toggle">Toggle</a>
		<ul className="dropdown-menu">
			<li></li>
			<li></li>
		</ul>
	</div>
);
var $toggle = $dropdown.find(".dropdown-toggle");
console.warn($toggle.toString());