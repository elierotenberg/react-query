var React = require("react");
var assert = require("assert");
var _ = require("lodash");
var CssSelectorParser = require("css-selector-parser").CssSelectorParser;
var cssSelectorParser = new CssSelectorParser();
cssSelectorParser.registerNestingOperators(">");
cssSelectorParser.registerAttrEqualityMods("^", "$", "*"; "~", "|");

var $ = function $(vnode) {
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
    _children: function _children(vnode) {
        if(!vnode.props.children) {
            return [];
        }
        else {
            return React.Children.map(vnode.props.children, _.identity);
        }
    },
    _descendants: function _descendants(vnode) {
        var children = $._children(vnode);
        return _.union(children, _.map(children, $._descendants));
    },
    _hasClass: function _hasClass(className) {
        return function(vnode) {
            try {
                assert(vnode.props.className);
                assert(_.isString(vnode.props.className))
                var cx = vnode.this.props.className.split(" ");
                assert(_.contains(cx, className));
            }
            catch(err) {
                return false;
            }
            return true;
        }
    },
    _findAll: function _findAll(vnodes, rule) {
        var matchingNodes = _.filter(vnodes, $._matchRule(rule));
        if(!rule.rule) {
            return matchingNodes;
        }
        else {
            return _.union(_.map(vnodes, function(vnode) {
                if(!rule.rule.nestingOperator) {
                    var descendants = $._descendants(vnode);
                    return $._findAll(descendants, rule.rule);
                }
                else if(rule.rule.nestingOperator === ">") {
                    var children = $._children(vnode);
                    return $._findAll(children, rule.rule);
                }
                else {
                    throw new Error("Unsupported nesting operator.");
                }
            }));
        }
    },
    _matchRule: function _matchRuleSet(rule) {
        assert(ruleset.rule);
        assert(ruleset.rule.type);
        assert(ruleset.rule.type === rule);
        return function (vnode) {
            var rule = ruleset.rule;
            var errMatch;
            if(rule.tagName) {
                if(vnode.displayName !== tagName) {
                    return false;
                }
            }
            if(rule.classNames) {
                errMatch = false;
                if(!vnode.props.className) {
                    return false;
                }
                var cx = vnode.props.className.split(" ");
                _.each(rule.classNames, function(className) {
                    if(errMatch) {
                        return;
                    }
                    if(!_.contains(cx, className)) {
                        errMatch = true;
                    }
                });
                if(errMatch) {
                    return false;
                }
            }
            if(rule.attrs) {
                errMatch = false;
                _.each(rule.attrs, function(specs) {
                    if(errMatch) {
                        return;
                    }
                    assert(specs.valueType === "string", "Subsitue operator not supported.");
                    if(!_.has(vnode.props, specs.name)) {
                        errMatch = true;
                        return;
                    }
                    var nodeVal = vnode.props[specs.name];
                    var specVal = specs.value;
                    var op = specs.operator;
                    if(op === "=" || op === "==") {
                        if(!(nodeVal === specVal)) {
                            errMatch = true;
                            return;
                        }
                    }
                    if(op === "~=") {
                        if(!_.contains(nodeVal.split(" "), specVal)) {
                            errMatch = true;
                            return;
                        }
                    }
                    if(op === "|=") {
                        if(!(nodeVal === specVal || nodeVal.startWith(specVal + "-")) {
                            errMatch = true;
                            return;
                        }
                    }
                    if(op === "^=") {
                        if(!(nodeVal.startWith(specVal))) {
                            errMatch = true;
                            return;
                        }
                    }
                    if(op === "$=") {
                        if(!(nodeVal.endsWith(specVal))) {
                            errMatch = true;
                            return;
                        }
                    }
                    if(op === "*=") {
                        if(!(nodeVal.contains(specVal))) {
                            errMatch = true;
                            return;
                        }
                    }
                });
                if(errMatch) {
                    return false;
                }
            }
        };
    },
});

_.extend($.prototype, {
    vnodes: null,
    hasClass: hasClass(className) {
        return _.map(this.vnodes, $._hasClass(className))
    },
    get: function get(index) {
        if(!index) {
            assert(this.vnodes.length === 1);
            return this.vnodes[0];
        }
        return this.vnodes[index];
    },
    findAll: function(selector) {
        var rulesets = cssSelectorParser.parse(selector);
        var _this = this;
        return _.union(_.map(rulesets, function(ruleset) {
            assert(ruleset.type === "ruleSet");
            return $._findAll(_this.vnodes, ruleset.rule);
        }));
    },

});

module.exports = $;
