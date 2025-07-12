let currentLang = localStorage.getItem('lang') || 'en';

function getPageName() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf('/') + 1);
  return file === '' ? 'index' : file.replace('.html', '');
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  const page = getPageName();

  fetch(`/components/header-${lang}.html`)
    .then(res => res.text())
    .then(html => {
      document.querySelector('header').innerHTML = html;
      document.getElementById('translate-btn')?.addEventListener('click', toggleLanguage);
    });

  fetch(`/components/footer-${lang}.html`)
    .then(res => res.text())
    .then(html => {
      document.querySelector('footer').innerHTML = html;
    });

  fetch(`/translation/${lang}/${page}-main.html`)
    .then(res => res.text())
    .then(html => {
      document.querySelector('main').innerHTML = html;
    });
}

function toggleLanguage() {
  const newLang = currentLang === 'en' ? 'vi' : 'en';
  setLang(newLang);
}

window.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);
});
