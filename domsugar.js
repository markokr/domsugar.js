/*
 * DOMSugar - thin helper for DOM node creation.
 *
 * domsugar([doc,] 'tag#id' [, {attrs} ] [, [children] ])
 *
 * Examples;
 *   domsugar('br')
 *   ==> <br/>
 *
 *   domsugar('div#foo', {className: 'aa bb'})
 *   ==> <div id="foo" class="aa bb"></div>
 *
 * Child can be plain text or node:
 *
 *   domsugar('div', [domsugar('span', ['Hello']), ' world &'])
 *   ==> <div><span>Hello</span> world &amp;</span></div>
 *
 * "onFoo" attribute installs event handler for "foo":
 *
 *   domsugar('button', {onClick: function(){}}, ['OK']})
 *   ==> <button>OK</button>  with 'click' handler set
 *
 * "style" can be object:
 *
 *   domsugar('div', {style: {font-size: 10, border: "solid"}})
 *   ==> <div style="font-size: 10px; border: solid"></div>
 */

(function (factory) {
    if (typeof define === "function" && define.amd) {    // AMD, RequireJS
        define([], factory);
    } else if (typeof exports === "object") {            // CommonJS, node.js
        module.exports = factory();
    } else {                                             // Browser
        this.domsugar = factory();
    }
}(function () {
"use strict";

var root_doc = document;

var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
};

var directProperties = {
    "className": "className",
    "defaultValue": "defaultValue",
    "htmlFor": "htmlFor",
    "textContent": "textContent",
    "unselectable": "unselectable",
    "value": "value",

    // shortcuts

    //"class": "className",
    //"text": "textContent",
    //"for": "htmlFor",
    //"html": "innerHTML",
};

var booleanProperties = {
    "autofocus": 1,
    "checked": 1,
    "defaultChecked": 1,
    "disabled": 1,
    "hidden": 1,
    "multiple": 1,
    "readOnly": 1,
    "required": 1,
    "selected": 1
};

var cssStyleNames = {
    "float": typeof root_doc.body.style.cssFloat == "undefined" ? "styleFloat" : "cssFloat"
};

// numeric params that are not 'px' based
var cssNoPx = { "opacity": 1, "zIndex": 1, "index": 1 };

// Convert '-webkit-foo' to 'WebkitFoo' and cache it
function mapCssName(key) {
    var jsKey = key.replace(/-./g, function (m) { return m.charAt(1).toUpperCase(); });

    // '-ms-' -> 'ms' workaround
    if (/^Ms/.test(jsKey)) {
        jsKey = "m" + jsKey.substr(1);
    }

    cssStyleNames[key] = jsKey;
    return jsKey;
}

// apply CSS style
function setStyle(el, key, value) {
    var jsKey;
    if (value != null) {
        // convert css name to DOM attribure
        jsKey = cssStyleNames[key];
        if (!jsKey) {
            jsKey = mapCssName(key);
        }

        // append 'px' to numbers
        if (typeof value === "number" && !cssNoPx[jsKey]) {
            value = value + "px";
        }

        // set it.  IE may throw exceptions, ignore those.
        try {
            el.style[jsKey] = value;
        } catch (err) { }
    }
}

function setProperty(el, key, value) {
    if (key === "style") {
        if (typeof value === "string") {
            // Full CSS
            el.style.cssText = value;
        } else {
            // Separate CSS attributes
            for (key in value) {
                setStyle(el, key, value[key]);
            }
        }
    } else if (key.charAt(0) === 'o' && key.charAt(1) === 'n' && key.charAt(2) >= 'A' && key.charAt(2) <= 'Z') {
        // Install event handlers
        if (el.addEventListener) {
            key = key.charAt(2).toLowerCase() + key.substr(3);
            el.addEventListener(key, value);
        } else {
            el[key] = value;
        }
    } else {
        // Regular HTML properties
        var prop = directProperties[key];
        if (prop) {
            el[prop] = (value == null ? '' : '' + value);
        } else if (booleanProperties[key]) {
            el[key] = !!value;
        } else if (value == null) {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, '' + value);
        }
    }
}

function appendChildren(doc, el, children) {
    var i, node, clen = children.length;
    for (i = 0; i < clen; i++) {
        node = children[i];
        if (isArray(node)) {
            appendChildren(doc, el, node);
        } else {
            if (typeof node === "string") {
                node = doc.createTextNode(node);
            }
            if (node) {
                el.appendChild(node);
            }
        }
    }
}

function domSugar(doc, tag, props, children) {
    var real_tag, name, el, prop, m;
    var node_id, classes;
    var splitter = /([#.])([^#.]+)/g;

    // allow missing 'doc'
    if (typeof doc === 'string') {
        children = props;
        props = tag;
        tag = doc;
        doc = root_doc;
    }

    // allow missing 'props'
    if (isArray(props)) {
        children = props;
        props = null;
    }

    // parse tag
    while ((m = splitter.exec(tag))) {
        if (real_tag == null)
            real_tag = tag.substr(0, splitter.lastIndex - m[0].length);
        name = m[2];
        if (m[1] === "#") {
            node_id = name;
        } else {
            classes = classes ? classes + ' ' + name : name;
        }
    }

    // node setup
    el = doc.createElement(real_tag || tag);
    if (props) {
        for (prop in props) {
            setProperty(el, prop, props[prop]);
        }
    }
    if (node_id) {
        el.setAttribute("id", node_id);
    }
    if (classes) {
        el.className = classes;
    }
    if (children) {
        appendChildren(doc, el, children);
    }
    return el;
}

return domSugar;

}));

