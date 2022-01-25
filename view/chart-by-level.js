'use strict';

class ChartByLevel {
    get command() {
        let queries = [];
        // несколько запросов, объединённые через UNION ALL
        let log = SQLTableName.get(diagramFilters.log);
        if (diagramFilters.log !== 1) {
            queries = [
                `SELECT COUNT(LogId) FROM ${log} WHERE EntryType="Information"`,
                `SELECT COUNT(LogId) FROM ${log} WHERE EntryType="Warning"`,
                `SELECT COUNT(LogId) FROM ${log} WHERE EntryType="Error"`,
            ];
        } else {
            queries = [
                `SELECT COUNT(LogId) FROM ${log} WHERE EntryType="SuccessAudit"`,
                `SELECT COUNT(LogId) FROM ${log} WHERE EntryType="FailureAudit"`,
            ];
        }
        // фильтр по времени
        let byPeriod = getSQLFilterByPeriod(diagramFilters.period);
        if (byPeriod) {
            for (let i = 0; i < queries.length; i++)
                queries[i] += ' AND ' + byPeriod;
        }
        return queries.join('\nUNION ALL\n');
    }

    get params() {
        return [];
    }

    update(result) {
        if (result.length !== 3 && result.length !== 2) return;

        if (this.onUpdate) {
            // выделяем результат, считаем сумму всего
            let data = result.map((arr) => arr[0]);
            let total = 0;
            for (let v of data) total += v;

            this.onUpdate(data, total);
        }
    }
}

class ChartByLevelComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chart: null,
            data: [],
            total: 0,
        };

        this.updateChart = this.updateChart.bind(this);
        widgetChartByLevel.onUpdate = this.updateChart;
    }

    componentDidMount() {
        // создаём объект графика с определённой конфигурацией на канвасе
        var ctx = document
            .querySelector('#widget-by-level canvas')
            .getContext('2d');
        var cfg = {
            type: 'pie',
            data: {
                labels: commonNames.logLevels,
                datasets: [
                    {
                        data: [0, 0, 0],
                        backgroundColor: chartColorsByLevel,
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
        // 3 - info, warning, error; 2 - success/failure audit
        if (data.length === 3) {
            dataset.backgroundColor = chartColorsByLevel;
            config.data.labels = commonNames.logLevels;
        } else {
            dataset.backgroundColor = [chartColorsByLevel[0], chartColorsByLevel[2]];
            config.data.labels = commonNames.logSecurityLevels;
        }
        this.state.chart.update();

        this.setState({ data, total });
    }

    render() {
        let names;
        if (this.state.data.length === 3) names = commonNames.logLevels;
        else names = commonNames.logSecurityLevels;

        return h(
            'div',
            { id: 'widget-by-level', class: 'dashboard-widget chart' },
            [
                h('header', null, h('span', { class: 'title' }, 'По важности')),
                h('div', { class: 'content' }, [
                    // область, на котором рисуется график
                    h('canvas', { width: '200', height: '200' }),
                    h(
                        'div',
                        { class: 'table-wrapper' },
                        // таблица
                        h(ChartTable, {
                            names,
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
let widgetChartByLevel = new ChartByLevel();
registeredWidgetsByTab[1].push(widgetChartByLevel);
