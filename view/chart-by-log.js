'use strict';

class ChartByLog {
    get command() {
        // запросы из разных таблиц будут объединены через UNION ALL
        let app = 'SELECT COUNT(LogId) FROM ';
        let sec = 'SELECT COUNT(LogId) FROM ';
        let sys = 'SELECT COUNT(LogId) FROM ';
        app += SQLTableName.APP;
        sec += SQLTableName.SEC;
        sys += SQLTableName.SYS;
        app += ' WHERE 1'; // 1 и 0 нужны как заглушки для тривиальных фильтров
        sec += ' WHERE 1';
        sys += ' WHERE 1';
        // фильтры
        let byPeriod = getSQLFilterByPeriod(diagramFilters.period);
        if (byPeriod) {
            app += ' AND ' + byPeriod;
            sec += ' AND ' + byPeriod;
            sys += ' AND ' + byPeriod;
        }
        let levels = diagramFilters.levels;
        if (levels !== (1 | 2 | 4)) {
            app += ' AND (0';
            sys += ' AND (0';
            if (levels & 1) {
                app += " OR EntryType='Information'";
                sys += " OR EntryType='Information'";
            }
            if (levels & 2) {
                app += " OR EntryType='Warning'";
                sys += " OR EntryType='Warning'";
            }
            if (levels & 4) {
                app += " OR EntryType='Error'";
                sys += " OR EntryType='Error'";
            }
            app += ')';
            sys += ')';
        }
        let audit = diagramFilters.audits;
        if (audit !== (1 | 2)) {
            sec += ' AND (0';
            if (audit & 1) {
                sec += " OR EntryType='SuccessAudit'";
            }
            if (audit & 2) {
                sec += " OR EntryType='FailureAudit'";
            }
            sec += ')';
        }
        return [app, sec, sys].join('\nUNION ALL\n');
    }

    get params() {
        return [];
    }

    update(result) {
        if (this.onUpdate) {
            // выделяем результат, считаем сумму всего
            let data = result.map((arr) => arr[0]);
            let total = 0;
            for (let v of data) total += v;

            this.onUpdate(data, total);
        }
    }
}

class ChartByLogComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chart: null,
            data: [],
            total: 0,
        };

        this.updateChart = this.updateChart.bind(this);
        widgetChartByLog.onUpdate = this.updateChart;
    }

    componentDidMount() {
        // создаём объект графика с определённой конфигурацией на канвасе
        var ctx = document
            .querySelector('#widget-by-log canvas')
            .getContext('2d');
        var cfg = {
            type: 'pie',
            data: {
                labels: commonNames.logs,
                datasets: [
                    {
                        data: [0, 0, 0],
                        backgroundColor: [
                            'rgba(64, 64, 255, .8)',
                            'rgba(64, 200, 255, .8)',
                            'rgba(200, 20, 255, .8)',
                        ],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: false,
                legend: {
                    labels: {
                        fontColor: '#bbb',
                    },
                },
            },
        };
        this.state.chart = new Chart(ctx, cfg);
    }

    /** Обновляет график и таблицу по обновлению виджета */
    updateChart(data, total) {
        let config = this.state.chart.config;
        let dataset = config.data.datasets[0];
        dataset.data = data;
        this.state.chart.update();

        this.setState({ data, total });
    }

    render() {
        return h(
            'div',
            { id: 'widget-by-log', class: 'dashboard-widget chart' },
            [
                h(
                    'header',
                    null,
                    h('span', { class: 'title' }, 'По типам журнала')
                ),
                h('div', { class: 'content' }, [
                    // область, на котором рисуется график
                    h('canvas', { width: '200', height: '200' }),
                    h(
                        'div',
                        { class: 'table-wrapper' },
                        // таблица
                        h(ChartTable, {
                            names: commonNames.logs,
                            data: this.state.data,
                            total: this.state.total,
                        })
                    ),
                ]),
            ]
        );
    }
}

// создаём виджет и регистрируем его для обновления
var widgetChartByLog = new ChartByLog();
registeredWidgetsByTab[1].push(widgetChartByLog);
