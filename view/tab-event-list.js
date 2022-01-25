'use strict';

/** Виджет подсчёта сообщений журнала с определёнными фильтрами и поиском */
class EventCount {
    get command() {
        let query = 'SELECT COUNT(LogId) FROM ';

        query += SQLTableName.get(eventListFilters.log);
        query += ' WHERE 1';
        // фильтры
        let byPeriod = getSQLFilterByPeriod(eventListFilters.period);
        let byLevels = getSQLFilterByLevels(
            eventListFilters.log,
            eventListFilters.levels,
            eventListFilters.audits
        );
        if (byPeriod) query += ' AND ' + byPeriod;
        if (byLevels) query += ' AND ' + byLevels;
        // поиск (только если введено 3 и более символов)
        if (eventListFilters.search.length > 2) {
            query += ' AND (TimeGenerated LIKE ? OR MessageText LIKE ?)';
        }
        return query;
    }

    get params() {
        // параметры будут подставлены вместо ? знаков
        if (eventListFilters.search.length > 2) {
            const sch = '%' + eventListFilters.search + '%';
            return [sch, sch];
        }
        return [];
    }

    update(result) {
        if (this.onUpdate) this.onUpdate(result[0]);
    }
}

/** Виджет вывода журнала с определёнными фильтрами и поиском */
class Events {
    constructor() {
        this.sortedBy = 0;
        this.sortedAscending = false;
        this._offset = 0;
        this.columns = [
            'LogId',
            'MachineName',
            'EntryType',
            'TimeGenerated',
            'Source',
            'MessageText',
        ];
        this.columnNames = [
            'ID',
            'Имя хоста',
            'Важность',
            'Дата и время',
            'Источник',
            'Сообщение',
        ];
    }

    /** Смещение по результатам запроса, нужно для перелистывания страниц */
    set offset(v) {
        this._offset = v;
        updateTab(2);
    }

    /** Обновляет виджет с новой сортировкой */
    sortBy(colIndex, ascending) {
        if (colIndex < 0 || this.columns.length <= colIndex) return;

        this.sortedBy = colIndex;
        this.sortedAscending = ascending;
        updateTab(2);
    }

    get command() {
        let query =
            'SELECT LogId,MachineName,EntryType,datetime(TimeGenerated),Source,MessageText FROM ';

        query += SQLTableName.get(eventListFilters.log);
        query += ' WHERE 1';
        // фильтры
        let byPeriod = getSQLFilterByPeriod(eventListFilters.period);
        let byLevels = getSQLFilterByLevels(
            eventListFilters.log,
            eventListFilters.levels,
            eventListFilters.audits
        );
        if (byPeriod) query += ' AND ' + byPeriod;
        if (byLevels) query += ' AND ' + byLevels;
        // поиск
        if (eventListFilters.search.length > 2) {
            query += ' AND (TimeGenerated LIKE ? OR MessageText LIKE ?)';
        }
        // сортировка
        if (this.sortedBy !== 0 || !this.sortedAscending) {
            query += ' ORDER BY ';
            query += this.columns[this.sortedBy];
            query += this.sortedAscending ? ' ASC' : ' DESC';
        }
        query += ' LIMIT ?,?';
        return query;
    }

    get params() {
        if (eventListFilters.search.length > 2) {
            const sch = '%' + eventListFilters.search + '%';
            return [sch, sch, this._offset, 10];
        }
        return [this._offset, 10];
    }

    update(result) {
        if (this.onUpdate) this.onUpdate(result);
    }
}

/** Отображает вкладку со просмотром журнала */
class EventsTab extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: [],
            eventCount: 0,
            sortedBy: 0,
            sortedAscending: false,
            selectedRow: null,
        };
        // при обновлении этих виджетов нужно перерисовать вкладку
        widgetEventCount.onUpdate = (eventCount) => this.setState({ eventCount });
        widgetEvents.onUpdate = (rowData) => this.setState({ rowData });
        this.handleSorting = this.handleSorting.bind(this);
    }

    /** Переключает режим сортировки */
    handleSorting(colIndex) {
        let asc = false;
        if (this.state.sortedBy === colIndex) asc = !this.state.sortedAscending;

        this.setState({
            sortedBy: colIndex,
            sortedAscending: asc,
        });
        widgetEvents.sortBy(colIndex, asc);
    }

    render(props, state) {
        // доп. классы нужны, чтобы покрасить строки в цвет в зависимости от важности
        let levelClasses = state.rowData.map((row) => {
            switch (row[2]) {
                case 'Warning':
                    return 'warning';
                case 'FailureAudit':
                case 'Error':
                    return 'error';
                default:
                    return '';
            }
        });

        return h('div', null, [
            // фильтры, со строкой поиска
            h(Filters, { filterData: eventListFilters, showSearch: true }),
            // виджеты
            h('div', { class: 'widget-row' }, [
                h('div', { class: 'dashboard-widget message-list' }, [
                    // заголовок
                    h(MessageListHeader, {
                        title: 'События',
                        eventCount: state.eventCount,
                        // выставляем смещение по нажатию на номер страницы
                        onPageSelect: (i) => (widgetEvents.offset = i * 10),
                    }),
                    // содержимое - таблица либо заглушка
                    h(
                        'div',
                        { class: 'content table-wrapper' },
                        state.rowData.length > 0
                            ? h(MessageTable, {
                                  cols: widgetEvents.columnNames,
                                  colClasses: widgetEvents.columns,
                                  rows: state.rowData,
                                  rowClasses: levelClasses,
                                  sortedBy: state.sortedBy,
                                  sortedAscending: state.sortedAscending,
                                  onSort: this.handleSorting,
                                  onSelect: (row) =>
                                      this.setState({ selectedRow: row }),
                              })
                            : h('i', null, 'Пусто')
                    ),
                ]),
                h('div', { class: 'dashboard-widget full-message' }, [
                    // заголовок
                    h(
                        'header',
                        null,
                        h('span', { class: 'title' }, 'Просмотр сообщения')
                    ),
                    // содержимое - полное сообщение либо заглушка
                    h(
                        'div',
                        {
                            class: state.selectedRow
                                ? 'content form'
                                : 'content',
                        },
                        state.selectedRow
                            ? h(FullMessage, {
                                  cols: widgetEvents.columnNames,
                                  row: state.selectedRow,
                              })
                            : h('i', null, 'Выберите сообщение...')
                    ),
                ]),
            ]),
        ]);
    }
}

/** Хранит фильтры вкладки с журналом */
var eventListFilters = new FilterData(
    new FilterCookies(
        'list-filter-by-log',
        'list-filter-by-period',
        'list-filter-by-level',
        'list-filter-by-audit'
    ),
    2
);

// создаём виджеты и регистрируем их для обновления
var widgetEventCount = new EventCount();
var widgetEvents = new Events();
registeredWidgetsByTab[2].push(widgetEventCount);
registeredWidgetsByTab[2].push(widgetEvents);
// внедряем вкладку в dom-дерево
render(h(EventsTab, null), document.getElementById('tab-event-list'));
