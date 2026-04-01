// filters init
export default function initFilters() {
  const filterButtons = document.querySelectorAll('.filters__btn');
  const postsGrid = document.getElementById('posts-grid');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const activeClass = 'active';
  let activeButton = null;
  let isLoading = false;

  if (!filterButtons.length || !postsGrid || !loading || !error) return;

  const defaultHTML = postsGrid.innerHTML;

  filterButtons.forEach(function(btn) { btn.addEventListener('click', clickHandler); });

  window.addEventListener('popstate', function(e) {
    const category = e.state && e.state.category;
    setActiveButton(category);
    if (category) {
      loadPosts(category);
    } else {
      postsGrid.innerHTML = defaultHTML;
    }
  });

  applyURLFilter();

  function setActiveButton(category) {
    if (activeButton) {
      activeButton.classList.remove(activeClass);
      activeButton.setAttribute('aria-pressed', 'false');
    }

    activeButton = [...filterButtons].find(function(btn) {
      return btn.dataset.category === category;
    }) || null;

    if (activeButton) {
      activeButton.classList.add(activeClass);
      activeButton.setAttribute('aria-pressed', 'true');
    }
  }

  function applyURLFilter() {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get('category');

    if (!initialCategory) return;

    setActiveButton(initialCategory);
    if (activeButton) loadPosts(initialCategory);
  }

  function clickHandler() {
    if (isLoading || this === activeButton) return;

    const category = this.dataset.category;
    setActiveButton(category);
    updateURL(category);
    loadPosts(category);
  }

  function updateURL(category) {
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    history.pushState({ category }, '', url);
  }

  function loadPosts(category) {
    isLoading = true;
    loading.classList.remove('hidden');
    postsGrid.classList.add('hidden');
    error.classList.add('hidden');

    fetch(`posts/${category}.html`)
      .then(function(response) {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return new Promise(function(resolve) {
          setTimeout(function() { resolve(response.text()); }, 500);
        });
      })
      .then(function(html) {
        postsGrid.innerHTML = html;
      })
      .catch(function() {
        postsGrid.innerHTML = '';
        error.classList.remove('hidden');
      })
      .finally(function() {
        isLoading = false;
        loading.classList.add('hidden');
        postsGrid.classList.remove('hidden');
      });
  }
}
