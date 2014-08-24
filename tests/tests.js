/** @jsx React.DOM */
var React = require("react");
var $ = require("../");


var $div = $(<div className="hello world" />);
assert($div.hasClass("hello"));
assert($div.hasClass(("world")));
assert(!$div.hasClass("foo"));