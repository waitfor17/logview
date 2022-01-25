'use strict';

/** Отправляет POST-запрос на сервер с вложенной в него SQL-командой и параметрами */
function executeSQL(query, params, id, callback) {
    // содержимое запроса в JSON-RPC формате
    var payload = {
        method: 'execute',
        params: [query].concat(params),
        jsonrpc: '2.0',
        id: id, // уникальный id запроса
    };
    // парсинг ответа
    function decodeResponse(str) {
        let obj = JSON.parse(str);
        if (obj.result) obj.result = JSON.parse(obj.result);
        return obj;
    }

    // создаём AJAX-запрос
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState === this.DONE && this.status === 200) {
            // по прибытию ответа, парсим его и возвращаем через коллбэк
            callback(decodeResponse(this.responseText));
        }
    };
    // настраиваем его
    request.open('POST', 'sql-interpreter', true);
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    // и отправляем со всеми данными
    request.send(JSON.stringify(payload));
}

(function () {
    // элемент вверху страницы будет отображать ошибки
    let errorElm = document.getElementById('db-error');

    function error(e) {
        console.log(e);
        errorElm.style.height = '';
        errorElm.textContent = 'Ошибка: ' + e.data.message;
    }
    function noerror() {
        errorElm.style.height = '0';
    }

    // функции измерения времени запроса и рендера
    if (!window.performance || !performance.now) {
        window.performance = { now: Date.now };
    }
    function tic() {
        return performance.now();
    }
    function toc(time, msg) {
        let dt = performance.now() - time;
        console.log((msg || 'toc') + ': ' + dt + 'ms');
    }

    // выставляем основную функцию обновления
    updateTab = function(tab) {
        noerror();
        // подготавливаем таймер
        let completed = 0;
        let time = tic();

        let widgets = registeredWidgetsByTab[tab];
        assert(widgets);
        for (let i = 0; i < widgets.length; i++) {
            // вычисляем уникальный ID запроса; сейчас он не обязателен,
            // но в будущем может быть полезен
            let id = (tab << 16) | i;
            // берём у виджета команду с параметрами и отдаём их на исполнение
            executeSQL(
                widgets[i].command,
                widgets[i].params,
                id,
                (obj) => {
                    // забираем результат
                    completed++;
                    if (!obj.result) {
                        error(obj.error);
                        return;
                    }
                    // если нет ошибки, то обновляем виджет
                    widgets[i].update(obj.result);
                    // замеряем прошедшее время, когда обновился последний виджет
                    if (completed === widgets.length)
                        toc(time, 'Executing SQL & Displaying results');
                }
            );
        }
    };
    // обновляем вкладки при открытии страницы
    updateTab(0);
    updateTab(1);
    updateTab(2);
    // а также каждую минуту
    window.setInterval(() => {
        updateTab(0);
        updateTab(1);
        updateTab(2);
    }, 60 * 1000)
})();
