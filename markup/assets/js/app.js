/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/utils/index.js":
/*!*******************************!*\
  !*** ./src/js/utils/index.js ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HTML: function() { return /* binding */ HTML; }
/* harmony export */ });
/* unused harmony exports BODY, ev */
/* harmony import */ var _resizeHandler_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./resizeHandler.js */ "./src/js/utils/resizeHandler.js");
/* harmony import */ var _resizeHandler_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_resizeHandler_js__WEBPACK_IMPORTED_MODULE_0__);

// import './vh'; - use it in case crossbrowser vh value is needed

const HTML = document.documentElement;
const BODY = document.body;

/*
  "jQuery like" ready function:
  Usage:

  import ready from 'Utils/global';
  ready(() => init());
*/

/* harmony default export */ __webpack_exports__["default"] = (Document.prototype.ready = fn => {
  if (fn && typeof fn === 'function') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        return fn();
      }
    });
  }
});

/*
  Publish custom event
  Params:

  {eventName}: String - the name of custom event. Better to use as a variable or constant not to mess names
  {data}: Object - custom event information, e.g. node element, whatever. Accessible via event
  {once}: Bool - trigger only once or every time when called
  Exmaple:

  import {ev} from 'Utils/global';

  const eventName = 'PopupToggle';

  popup.on('click', () => {
    ev(eventName, {
      popup: this,
    })
  })

  document.addEventListener(eventName, event => {
    // this is data that we pass into custom event
    const eventData = event.detail;
    const popupInstance = eventData.popup;
  })
*/

const ev = (eventName, data, target = document) => {
  const e = new CustomEvent(eventName, {
    detail: data
  });
  target.dispatchEvent(e);
};

/***/ }),

/***/ "./src/js/utils/resizeHandler.js":
/*!***************************************!*\
  !*** ./src/js/utils/resizeHandler.js ***!
  \***************************************/
/***/ (function() {

(function (window) {
  const activeClass = 'resize-active';
  const resetDelay = 500;
  let flag = false;
  let timer = null;
  const removeClassHandler = () => {
    flag = false;
    document.documentElement.classList.remove(activeClass);
  };
  const resizeHandler = () => {
    if (!flag) {
      flag = true;
      document.documentElement.classList.add(activeClass);
    }
    clearTimeout(timer);
    timer = setTimeout(removeClassHandler, resetDelay);
  };
  window.addEventListener('resize', resizeHandler);
})(window);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
!function() {
"use strict";
/*!***********************!*\
  !*** ./src/js/app.js ***!
  \***********************/
/* harmony import */ var Utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! Utils */ "./src/js/utils/index.js");

(0,Utils__WEBPACK_IMPORTED_MODULE_0__["default"])(() => {
  Utils__WEBPACK_IMPORTED_MODULE_0__.HTML.classList.add('is-loaded');
});

// jQuery document ready
// jQuery(function() {
//   // init functions
// });

// vanilla document ready
// document.addEventListener('DOMContentLoaded', function () {
//   // do something here ...
// }, false);
}();
/******/ })()
;
//# sourceMappingURL=app.js.map