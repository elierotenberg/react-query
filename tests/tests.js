/** @jsx React.DOM */
var React = require("react");
var assert = require("assert");
var $ = require("../");


var $div = $(React.DOM.div({className: "hello world"}));
console.warn("div", $div.toString());
console.warn($.getClassList($div.first()));
assert($div.hasClass("hello"));
assert($div.hasClass(("world")));
assert(!($div.hasClass("foo")));
assert($div.toString() === '<div className="hello world" />');
var $div2 = $(React.DOM.div({className: "foobar"}));
var $nested = $(React.DOM.div({className: "outer"}, 
        React.DOM.p({className: "inner"})
));
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
var $wrapped = $nested.wrap(React.DOM.div({className: "wrapper"}));
console.warn("wrapped", $wrapped.toString());
var $appended = $nested.append(React.DOM.div({className: "appended"}));
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
 var $replace = $nested.replace(".inner", React.DOM.div({className: "new-inner"}));
 console.warn("replace", $replace.toString());

 var $replaceFn = $nested.replace(".inner", function() {
    return $(this).wrap(React.DOM.div({className: "wrapped"}));
 });
 console.warn("replaceFn", $replaceFn.toString());