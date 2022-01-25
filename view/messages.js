'use strict';

/** Заголовок окна с таблицей сообщений. Содержит счётчик сообщений и пагинацию */
function MessageListHeader(props) {
    let hasPagination = props.eventCount > 10;
    return h('header', null, [
        h('span', { class: 'title' }, props.title),
        h('div', { class: 'expand' }),
        h(
            'span',
            { class: props.errorsOnly ? 'count error' : 'count' },
            h('span', null, props.eventCount),
            ' найдено'
        ),
        hasPagination ? h('div', { class: 'sep' }) : null,
        hasPagination
            ? h(Pagination, {
                  count: Math.ceil(props.eventCount / 10), // 10 штук на страницу
                  onSelect: props.onPageSelect,
              })
            : null,
    ]);
}

/** Таблица с сообщениями логов */
class MessageTable extends Component {
    constructor(props) {
        super(props);
        // LogID выделенного сообщения
        this.state = { selectedID: -1 };
    }

    render(props, state) {
        assert(props.onSelect);
        assert(props.onSort);
        let cols = props.cols || [];
        let rows = props.rows || [];

        return h('table', null, [
            h(
                'thead',
                null,
                h(
                    'tr',
                    null,
                    // имена колонок с иконками, обозначающими сортировку
                    cols.map((name, i) => {
                        let up = true,
                            down = true;
                        if (props.sortedBy === i) {
                            up = !!props.sortedAscending;
                            down = !up;
                        }
                        return h(
                            'th',
                            {
                                class: props.colClasses
                                    ? props.colClasses[i]
                                    : '',
                                // сортировка по нажатию
                                onMouseDown: (e) => {
                                    if (e.button === 0) props.onSort(i);
                                },
                            },
                            [
                                name,
                                // иконки сортировки
                                up ? h('div', { class: 'triangle-up' }) : null,
                                down
                                    ? h('div', { class: 'triangle-down' })
                                    : null,
                            ]
                        );
                    })
                )
            ),
            h(
                'tbody',
                null,
                // строки таблицы
                rows.map((row, i) =>
                    h(MessageTableRow, {
                        cols,
                        row,
                        // выбор сообщения
                        selected: parseInt(row[0]) === state.selectedID,
                        onSelect: (row) => {
                            this.setState({ selectedID: parseInt(row[0]) });
                            props.onSelect(row);
                        },
                        class: props.rowClasses ? props.rowClasses[i] : '',
                    })
                )
            ),
        ]);
    }
}

/** Строка таблицы с сообщениями. Может быть выделена */
function MessageTableRow(props) {
    return h(
        'tr',
        {
            class: props.selected ? 'selected ' + props.class : props.class,
            onMouseDown: (e) => {
                if (e.button === 0) props.onSelect(props.row);
            },
        },
        props.row.map((cell) => {
            // срезать слишком широкий текст
            if (cell.length > 50) cell = cell.slice(0, 50) + '...';
            return h('td', null, cell);
        })
    );
}

/** Отображает всю информацию о сообщении в виде набора полей */
function FullMessage(props) {
    let fields = [];
    for (let i = 0; i < props.cols.length; i++) {
        fields.push(h('h4', null, props.cols[i]));
        fields.push(h('pre', null, props.row[i]));
    }
    return h(Fragment, null, fields);
}
