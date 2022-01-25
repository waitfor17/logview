'use strict';

function setTheme(name) {
    document.body.setAttribute('data-theme', name);
    // сохраняем выбор в куки
    Cookies.set('theme', name, { sameSite: 'strict' });
}

// оживляем кнопки переключения темы
document
    .querySelector('#button-theme-light')
    .addEventListener('click', function () {
        setTheme('light');
    });
document
    .querySelector('#button-theme-dark')
    .addEventListener('click', function () {
        setTheme('dark');
    });

// выставляем сохранённую ранее тему при запуске
if (Cookies.get('theme') == 'light') setTheme('light');
else setTheme('dark');
