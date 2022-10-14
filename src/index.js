import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios';
import { API } from './js/class_api';
import { createListItem } from './js/createMarkup';
import getRefs from './js/getRefs';

const apiClass = new API();

const refs = getRefs();

const options = {
  root: null,
  rootMargin: '100px',
  threshold: 1.0,
};
const callback = async function (entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting && entry.intersectionRect.bottom > 320) {
      apiClass.incrementPage();
      infinityScroll.unobserve(entry.target);

      try {
        const data = await apiClass.getPhotos();
        renderContent(data.hits);
        if (apiClass.isShowLoadMore) {
          const target = document.querySelector('.photo-card:last-child');
          infinityScroll.observe(target);
          observer.observe(target);
        }
      } catch (error) {
        Notify.failure(
          error.message,
          'Sorry, there are no images matching your search query. Please try again.'
        );
        clearPage();
      }
    }
  });
};
const infinityScroll = new IntersectionObserver(callback, options);

const handleSubmit = event => {
  event.preventDefault();

  const searchQuery = event.currentTarget.elements.searchQuery.value
    .trim()
    .toLowerCase();

  if (!searchQuery) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }

  apiClass.query = searchQuery;

  clearPage();

  initPage();

  async function initPage() {
    try {
      const data = await apiClass.getPhotos();
      if (data.hits.length === 0) {
        refs.input.value = '';
        Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        return;
      }

      renderContent(data.hits);

      apiClass.calculateTotalPages(data.total);
      Notify.success(`Hooray! We found ${data.total} images.`);
      if (apiClass.isShowLoadMore) {
        const target = document.querySelector('.photo-card:last-child');
        infinityScroll.observe(target);
      }
    } catch (error) {
      Notify.failure(
        error.message,
        'Sorry, there are no images matching your search query. Please try again.'
      );
      clearPage();
    }
  }
};

refs.form.addEventListener('submit', handleSubmit);

const generateContent = array =>
  array.reduce((acc, item) => acc + createListItem(item), '');

const renderContent = array => {
  const result = generateContent(array);
  refs.gallery.insertAdjacentHTML('beforeend', result);
  lightbox.refresh();
};

function clearPage() {
  apiClass.resetPage();
  refs.gallery.innerHTML = '';
  refs.loadMoreBtn.classList.add('is-hidden');
}

const lightbox = new SimpleLightbox('.gallery a', {
  sourceAttr: 'href',
  captionType: 'attr',
  captionsData: 'alt',
  captionDelay: '250',
  captionPosition: 'bottom',
});
