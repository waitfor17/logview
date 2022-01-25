'use strict';

/** Переключает основные вкладки по нажатию */
function switchTab(event, tabID) {
    if (event.button !== 0) return;

    var tab = document.getElementById(tabID);
    if (!tab) return;

    var btn = event.target;
    var btns = document.getElementsByClassName('nav-link');
    var tabs = document.getElementsByClassName('tab-pane');
    // вначале скрыть все
    for (let el of btns) {
        el.classList.remove('active');
    }
    for (let el of tabs) {
        el.classList.remove('show');
    }
    // затем показать активные
    btn.classList.add('active');
    tab.classList.add('show');
}

/** Содержит все виджеты приложения, разложенные по вкладкам */
var registeredWidgetsByTab = [[], [], []];

/** Запускает обновление одной вкладки (с индексом `i`) */
var updateTab = function (i) {
    console.log('No database open'); // будет назначено в файле db.js
};
