// filters init
export default function initFilters() {
  const filterButtons = document.querySelectorAll('.filters__btn');
  const postsGrid = document.getElementById('posts-grid');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(function(btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');

      const category = this.dataset.category;
      loadPosts(category);
    });
  });

  function loadPosts(category) {
    filterButtons.forEach(function(btn) { btn.disabled = true; });
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
        filterButtons.forEach(function(btn) { btn.disabled = false; });
        loading.classList.add('hidden');
        postsGrid.classList.remove('hidden');
      });
  }
}
