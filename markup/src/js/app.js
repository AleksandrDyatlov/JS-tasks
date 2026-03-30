import ready, { HTML } from 'Utils';
import initFilters from 'Components/filters';

ready(() => {
  HTML.classList.add('is-loaded');

  initFilters();
});

// jQuery document ready
// jQuery(function() {
//   // init functions
// });

// vanilla document ready
// document.addEventListener('DOMContentLoaded',function() {
//   //
// }, false);
