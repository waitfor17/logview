'use strict';

/** Виджет подсчёта системных ошибок за последние 24 часа */
class SysErrorCount {
    get command() {
        return (
            'SELECT COUNT(LogId) FROM ' +
            SQLTableName.SYS +
            ' WHERE EntryType="Error" AND ' +
            getSQLFilterByPeriod(0) // 24 часа
        );
    }

    get params() {
        return [];
    }

    update(result) {
        if (this.onUpdate) this.onUpdate(result[0]);
    }
}

/** Виджет сбора и вывода системных ошибок за последние 24 часа */
class SysErrors {
    constructor() {
        this.sortedBy = 0;
        this.sortedAscending = false;
        this._offset = 0;
        this.columns = [
            'LogId',
            'MachineName',
            'TimeGenerated',
            'Source',
            'MessageText',
        ];
        this.columnNames = [
            'ID',
            'Имя хоста',
            'Дата и время',
            'Источник',
            'Сообщение',
        ];
    }

    /** Смещение по результатам запроса, нужно для перелистывания страниц */
    set offset(v) {
        this._offset = v;
        updateTab(0);
    }

    /** Обновляет виджет с новой сортировкой */
    sortBy(colIndex, ascending) {
        if (colIndex < 0 || this.columns.length <= colIndex) return;

        this.sortedBy = colIndex;
        this.sortedAscending = ascending;
        updateTab(0);
    }

    get command() {
        let query =
            'SELECT LogId,MachineName,datetime(TimeGenerated),Source,MessageText FROM ';

        query += SQLTableName.SYS;
        query += ' WHERE EntryType="Error" AND ';
        query += getSQLFilterByPeriod(0);
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
        return [this._offset, 10];
    }

    update(result) {
        if (this.onUpdate) this.onUpdate(result);
    }
}

/** Отображает вкладку с системными ошибками */
class SysErrorsTab extends Component {
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
        widgetSysErrorCount.onUpdate = (eventCount) =>
            this.setState({ eventCount });
        widgetSysErrors.onUpdate = (rowData) => this.setState({ rowData });
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
        widgetSysErrors.sortBy(colIndex, asc);
    }

    render(props, state) {
        return h('div', null, [
            h('div', { class: 'widget-row' }, [
                h('div', { class: 'dashboard-widget message-list' }, [
                    // заголовок
                    h(MessageListHeader, {
                        title: 'Системные ошибки (24 часа)',
                        errorsOnly: true,
                        eventCount: state.eventCount,
                        // выставляем смещение по нажатию на номер страницы
                        onPageSelect: (i) => (widgetSysErrors.offset = i * 10),
                    }),
                    // содержимое - таблица либо заглушка
                    h(
                        'div',
                        { class: 'content table-wrapper' },
                        state.rowData.length > 0
                            ? h(MessageTable, {
                                  cols: widgetSysErrors.columnNames,
                                  colClasses: widgetSysErrors.columns,
                                  rows: state.rowData,
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
                                  cols: widgetSysErrors.columnNames,
                                  row: state.selectedRow,
                              })
                            : h('i', null, 'Выберите сообщение...')
                    ),
                ]),
            ]),
        ]);
    }
}

// создаём виджеты и регистрируем их для обновления
var widgetSysErrorCount = new SysErrorCount();
var widgetSysErrors = new SysErrors();
registeredWidgetsByTab[0].push(widgetSysErrorCount);
registeredWidgetsByTab[0].push(widgetSysErrors);
// внедряем вкладку в dom-дерево
render(h(SysErrorsTab, null), document.getElementById('tab-sys-errors'));
