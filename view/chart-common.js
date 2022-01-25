'use strict';

/** Цвета графика по уровням (information, warning, error) */
var chartColorsByLevel = [
    'rgba(100, 220, 80, .8)',
    'rgba(255, 160, 20, .8)',
    'rgba(220, 20, 20, .8)',
];

/** Случайный цвет для графика */
function randomChartColor() {
    let r = Math.random() * 200 + 30;
    let g = Math.random() * 200 + 30;
    let b = Math.random() * 200 + 30;
    return `rgba(${r},${g},${b},0.8)`;
}

/** Хранит фильтры вкладки с диаграммами */
var diagramFilters = new FilterData(
    new FilterCookies(
        'diagram-filter-by-log',
        'diagram-filter-by-period',
        'diagram-filter-by-level',
        'diagram-filter-by-audit'
    ),
    1
);

/** Отображает таблицу под графиком */
function ChartTable(props) {
    return h('table', { class: 'app' }, [
        h(
            'thead',
            null,
            h('tr', null, [h('th', null, 'Имя'), h('th', null, 'Кол-во')])
        ),
        h(
            'tbody',
            null,
            props.data // рисуем поля таблицы
                .map((item, i) =>
                    h('tr', null, [
                        h('td', null, props.names[i]),
                        h('td', null, item),
                    ])
                )
                // присоединяем строку "Всего"
                .concat(
                    h('tr', null, [
                        h('td', null, h('b', null, 'Всего')),
                        h('td', null, h('b', null, props.total)),
                    ])
                )
        ),
    ]);
}
