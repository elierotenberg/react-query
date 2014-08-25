var React = require("react");
var assert = require("assert");
var _ = require("lodash");
var CssSelectorParser = require("css-selector-parser").CssSelectorParser;
var cssSelectorParser = new CssSelectorParser();
cssSelectorParser.registerNestingOperators(">");
cssSelectorParser.registerAttrEqualityMods("^", "$", "*", "~", "|");

var $ = function $(vnode) {
    if(!(this instanceof $)) {
        return new $(vnode);
    }
    if(_.isArray(vnode)) {
        this.vnodes = vnode;
    }
    else {
        this.vnodes = [vnode];
    }
};

if(!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(searchString, position) {
            position = position || 0;
            return this.lastIndexOf(searchString, position) === position;
        },
    });
}

if(!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function(searchString, position) {
            var subjectString = this.toString();
            if(position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        },
    });
}

if(!String.prototype.contains) {
    Object.defineProperty(String.prototype, 'contains', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function() {
            return String.prototype.indexOf.apply(this, arguments) !== -1;
        },
    });
}

_.extend($, {
    merge: function() {
        return $(_.flatten(_.toArray(arguments), true));
    },
    toString: function toString(vnode) {
        return $._toStringWithTabs(0)(vnode);
    },
    _toStringWithTabs: function _toStringWithTabs(depth) {
        return function(vnode) {
            var children = $.getChildren(vnode);
            var s = [];
            for(var k = 0; k < depth; k++) {
                s.push("\t");
            }
            var tabs = s.join("");
            var begin = tabs + "<" + $.getTagName(vnode);
            var propsWithoutChildren = $.getPropsWithoutChildren(vnode);
            if(propsWithoutChildren && !_.isEmpty(propsWithoutChildren)) {
                begin += " " + _.map(propsWithoutChildren, function(value, key) {
                    return key + '="' + value + '"';
                }).join(" ");
            }
            if(children.length === 0) {
                return begin + " />";
            }
            else {
                return begin + ">\n" + _.map(children, $._toStringWithTabs(depth+1)).join("\n") + "\n" + tabs + "</" + $.getTagName(vnode) + ">";
            }
        };
    },
    getProps: function getProps(vnode) {
        if(!vnode.props) {
            return {};
        }
        return _.object(_.map(vnode.props, function(value, key) {
            return [key, value];
        }));
    },
    setProps: function setProps(props) {
        return function(vnode) {
            return new vnode.constructor(_.extend({}, $.getProps(vnode), props));
        };
    },
    getPropsWithoutChildren: function getPropsWithoutChildren(vnode) {
        return _.omit($.getProps(vnode), ["children"]);
    },
    getChildren: function getChildren(vnode) {
        if(!vnode.props.children) {
            return [];
        }
        else {
            var res = [];
            React.Children.forEach(vnode.props.children, function(child) {
                res.push(child);
            });
            return res;
        }
    },
    getDescendants: function getDescendants(vnode) {
        var children = $.getChildren(vnode);
        return _.union(children, _.flatten(_.flatten(_.map(children, $.getDescendants), true)));
    },
    getTree: function getTree(vnode) {
        var tree = $.getDescendants(vnode);
        tree.unshift(vnode);
        return tree;
    },
    getClassList: function getClassList(vnode) {
        if(!vnode.props.className) {
            return [];
        }
        else {
            return vnode.props.className.split(" ");
        }
    },
    hasClass: function hasClass(className) {
        return function(vnode) {
            return _.contains($.getClassList(vnode), className);
        };
    },
    addClass: function addClass(className) {
        return function(vnode) {
            var classList = $.getClassList(vnode);
            classList.push(className);
            return $.setProps({ className: classList.join(" ") })(vnode);
        };
    },
    removeClass: function removeClass(className) {
        return function(vnode) {
            var classList = _.without($.getClassList(vnode), className);
            return $.setProps({ className: classList.join(" ") })(vnode);
        };
    },
    toggleClass: function toggleClass(className, optState) {
        return function(vnode) {
            if(!_.isUndefined(optState)) {
                if(optState) {
                    return $.addClass(className)(vnode);
                }
                else {
                    return $.removeClass(className)(vnode);
                }
            }
            else {
                if($.hasClass(className)(vnode)) {
                    return $.removeClass(className)(vnode);
                }
                else {
                    return $.addClass(className)(vnode);
                }
            }
        };
    },
    getTagName: function getTagName(vnode) {
        return vnode.type.displayName;
    },
    setTagName: function setTagName(tagName) {
        return function(vnode) {
            return new vnode.constructor(_.extend({}, $.getProps(vnode), { className: $.getClassList(vnode).join(" "), }));
        };
    },
    equals: function equals(other) {
        return function(vnode) {
            if($.getTagName(other) !== $.getTagName(vnode)) {
                return false;
            }
            if(!_.isEqual($.getPropsWithoutChildren(other), $.getPropsWithoutChildren(vnode))) {
                return false;
            }
            var otherChildren = $.getChildren(other);
            var vnodeChildren = $.getChildren(vnode);
            if(otherChildren.length !== vnodeChildren.length) {
                return false;
            }
            var differentChildren = false;
            _.each(otherChildren, function(otherChild, key) {
                if(differentChildren) {
                    return;
                }
                var vnodeChild = vnodeChildren[key];
                if(!$.equals(otherChild, vnodeChild)) {
                    differentChildren = true;
                }
            });
            if(differentChildren) {
                return false;
            }
            return true;
        };
    },
    wrap: function wrap(wrapper) {
        return function(vnode) {
            var children = $.getChildren(wrapper);
            children.push(vnode);
            return new wrapper.constructor(_.extend({}, $.getProps(wrapper), { children: children }));
        };
    },
    append: function append(other) {
        return function(vnode) {
            var children = $.getChildren(vnode);
            children.push(other);
            return new vnode.constructor(_.extend({}, $.getProps(vnode), { children: children }));
        };
    },
    replace: function replace($match, replaceWithVNode) {
        return function(vnode) {
            if($match.contains(vnode)) {
                if(_.isFunction(replaceWithVNode)) {
                    return replaceWithVNode.apply(vnode, vnode);
                }
                else {
                    return replaceWithVNode;
                }
            }
            else {
                return new vnode.constructor(_.extend({}, $.getPropsWithoutChildren(vnode), {
                    children: _.map($.getChildren(vnode), $.replace($match, replaceWithVNode)),
                }));
            }
        };
    },
    findWithSelectors: function findWithSelectors(selectors) {
        assert(_.isArray(selectors));
        return function(vnode) {
            return _.flatten(_.map(selectors, $.findWithSingleSelector(vnode)), true);
        };
    },
    findWithSingleSelector: function findWithSingleSelector(vnode) {
        return function(selector) {
            assert(selector.type === "ruleSet");
            return $.findWithRule(selector.rule, vnode);
        };
    },
    findWithRule: function findWithRule(rule, vnode) {
        assert(rule.type === "rule");
        if(!rule.rule) {
            return $.matchSingleRule(rule)(vnode) ? [vnode] : [];
        }
        else {
            var extractSubTargets = null;
            var $findWithSubRule = _.partial($.findWithRule, rule.rule);
            if(!rule.rule.nestingOperator) {
                extractSubTargets = $.getDescendants;
            }
            else if(rule.rule.nestingOperator === ">") {
                extractSubTargets = $.getChildren;
            }
            else {
                throw new Error("Unsupported nesting operator '" + rule.rule.nestingOperator + "'.");
            }
            return _.map(extractSubTargets(vnode), $findWithSubRule);
        }
    },
    matchSingleRule: function matchSingleRule(rule) {
        assert(rule);
        assert(rule.type);
        assert(rule.type === "rule");
        return function(vnode) {
            if(rule.tagName && rule.tagName !== "*") {
                if($.getTagName(vnode) !== rule.tagName) {
                    return false;
                }
            }
            if(rule.classNames) {
                var diff = _.xor(rule.classNames, $.getClassList(vnode));
                if(_.size(diff) > 0) {
                    return false;
                }
            }
            if(rule.attrs) {
                var differentProps = false;
                var props = $.getProps(vnode);
                var fail = function() {
                    differentProps = true;
                };
                _.each(rule.attrs, function(specs) {
                    if(differentProps) {
                        return fail();
                    }
                    assert(specs.valueType === "string", "Subsitute operator not supported.");
                    if(!_.has(props, specs.name)) {
                        return fail();
                    }
                    var nodeVal = props[specs.name];
                    var specVal = specs.value;
                    var op = specs.operator;
                    if(op === "=" || op === "==") {
                        if(nodeVal !== specVal) {
                            return fail();
                        }
                    }
                    else if(op === "~=") {
                        if(!_.contains(nodeVal.split(" "), specVal)) {
                            return fail();
                        }
                    }
                    else if(op === "|=") {
                        if(!(nodeVal === specVal || nodeVal.startWith(specVal + "-"))) {
                            return fail();
                        }
                    }
                    else if(op === "^=") {
                        if(!(nodeVal.startWith(specVal))) {
                            return fail();
                        }
                    }
                    else if(op === "$=") {
                        if(!(nodeVal.endsWith(specVal))) {
                            return fail();
                        }
                    }
                    else if(op === "*=") {
                        if(!(nodeVal.contains(specVal))) {
                            return fail();
                        }
                    }
                    else if(op) {
                        throw new Error("Unsupported operator: '" + op + "'.");
                    }
                });
                if(differentProps) {
                    return false;
                }
            }
            return true;
        };
    },
});

_.extend($.prototype, {
    vnodes: null,
    each: function each(fn) {
        _.each(this.vnodes, function(vnode, key) {
            fn.call(vnode, vnode, key);
        });
        return this;
    },
    map: function map(fn) {
        return _.map(this.vnodes, function(vnode, key) {
            return fn.call(vnode, vnode, key);
        });
    },
    all: function all(predicate) {
        return _.all(this.vnodes, function(vnode, key) {
            return predicate.call(vnode, vnode, key);
        });
    },
    any: function any(predicate) {
        return _.any(this.vnodes, function(vnode, key) {
            return predicate.call(vnode, vnode, key);
        });
    },
    contains: function contains(vnode) {
        return _.contains(this.expose(), vnode);
    },
    containsLike: function containsLike(vnode) {
        return this.any(function() {
            $(this).like(vnode);
        });
    },
    filter: function filter(predicate) {
        var res = [];
        this.each(function() {
            if(predicate(this)) {
                res.push(this);
            }
        });
        return $(res);
    },
    children: function children() {
        return $(_.flatten(this.map($.getChildren), true));
    },
    descendants: function descendants() {
        return $(_.flatten(this.map($.getDescendants), true));
    },
    tree: function tree() {
        return _.flatten(this.map($.getTree), true);
    },
    hasClass: function hasClass(className) {
        return this.all($.hasClass(className));
    },
    first: function first() {
        assert(this.vnodes.length > 0, "Empty vnodes.");
        return this.vnodes[0];
    },
    size: function size() {
        return _.size(this.vnodes);
    },
    single: function single() {
        assert(this.vnodes.length === 1, "Length should be exactly 1.");
        return this.vnodes[0];
    },
    tagName: function tagName() {
        if(arguments.length === 0) {
            return $.getTagName(this.first());
        }
        else {
            return $(this.map($.setTagName(arguments[0])));
        }
    },
    prop: function prop() {
        if(arguments.length === 1) {
            return $.getProps(this.first())[arguments[0]];
        }
        else {
            var props = _.object([
                [arguments[0], arguments[1]],
            ]);
            return this.props(props);
        }
    },
    props: function props() {
        if(arguments.length === 0) {
            return $.getProps(this.first());
        }
        else {
            return $(this.map($.setProps(arguments[0])));
        }
    },
    classList: function className() {
        if(arguments.length === 0) {
            return $.getClassList(this.first());
        }
        else {
            return $(this.map($.setProps({ className: arguments[0].join(" ") })));
        }
    },
    addClass: function addClass(className) {
        return $(this.map($.addClass(className)));
    },
    removeClass: function removeClass(className) {
        return $(this.map($.removeClass(className)));
    },
    toggleClass: function toggleClass(className, optState) {
        return $(this.map($.toggleClass(className, optState)));
    },
    get: function get(index) {
        assert(this.vnodes[index], "Invalid index.");
        return this.vnodes[index];
    },
    toChildren: function toChildren() {
        return this.vnodes;
    },
    toString: function toString() {
        if(this.vnodes.length === 1) {
            return $.toString(this.first());
        }
        else {
            return this.map($.toString).join("\n");
        }
    },
    equals: function like(vnode) {
        if(vnode instanceof $) {
            return this.like(vnode.first());
        }
        return this.all($.equals(vnode));
    },
    find: function find(selectorString) {
        assert(_.isString(selectorString));
        var parsed = cssSelectorParser.parse(selectorString);
        var selectors = parsed.type === "selectors" ? parsed.selectors : [parsed];
        return $(_.flatten(_.map(this.tree(), $.findWithSelectors(selectors))));
    },
    replace: function replace() {
        if(arguments.length === 2) {
            var selectorString = arguments[0];
            var replaceWithVNode = arguments[1];
            var $match = this.find(selectorString);
            return $(this.map($.replace($match, replaceWithVNode)));
        }
        else {
            var selectorStringToVNodes = arguments[0];
            var $curr = this;
            _.each(selectorStringToVNodes, function(replaceWithVNode, selectorString) {
                $curr = $curr.replace(selectorString, replaceWithVNode);
            });
            return $curr;
        }
    },
    wrap: function wrap(vnode) {
        return $(
            new vnode.constructor(_.extend({}, vnode.props, { children: this.vnodes }))
        );
    },
    append: function append(vnode) {
        return $(this.map($.append(vnode)));
    },
    expose: function expose() {
        return this.toChildren();
    },
});

module.exports = $;
