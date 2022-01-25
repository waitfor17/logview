'use strict';

class ChartByTime {
    get command() {
        let query = 'SELECT ';
        // формат даты, который будет выводить база
        switch (diagramFilters.period) {
            case 0:
                query += 'strftime("%Y-%m-%d %H:%M",';
                break;
            case 1:
            case 2:
                query += 'date(';
                break;
            default:
                query += 'strftime("%Y-%m",';
        }
        query += 'TimeGenerated), COUNT(LogId) FROM ';

        query += SQLTableName.get(diagramFilters.log);
        query += ' WHERE 1';
        // фильтры
        let byPeriod = getSQLFilterByPeriod(diagramFilters.period);
        let byLevels = getSQLFilterByLevels(
            diagramFilters.log,
            diagramFilters.levels,
            diagramFilters.audits
        );
        if (byPeriod) query += ' AND ' + byPeriod;
        if (byLevels) query += ' AND ' + byLevels;

        // группировка по часам/дням/месяцам
        query += ' GROUP BY strftime';
        switch (diagramFilters.period) {
            case 0:
                query += '("%Y-%m-%dT%H", TimeGenerated) LIMIT 24;';
                break;
            case 1:
                query += '("%Y-%m-%d", TimeGenerated) LIMIT 7;';
                break;
            case 2:
                query += '("%Y-%m-%d", TimeGenerated) LIMIT 30;';
                break;
            case 3:
                query += '("%Y-%m", TimeGenerated) LIMIT 12;';
                break;
            default:
                query += '("%Y-%m", TimeGenerated);';
        }
        return query;
    }

    get params() {
        return [];
    }

    update(result) {
        if (this.onUpdate) {
            // просто записываем данные по осям
            let data = result.map((row) => ({
                t: row[0],
                y: row[1],
            }));
            this.onUpdate(data);
        }
    }

    /** Выбирает масштаб графика в зависимости от фильтра */
    static getTimeUnit() {
        switch (diagramFilters.period) {
            case 0:
                return 'hour';
            case 1:
            case 2:
                return 'day';
            case 3:
            case 4:
                return 'month';
            default:
                return 'year';
        }
    }
}

class ChartByTimeComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chart: null,
        };

        this.updateChart = this.updateChart.bind(this);
        widgetChartByTime.onUpdate = this.updateChart;
    }

    componentDidMount() {
        // создаём объект графика с определённой конфигурацией на канвасе
        var ctx = document
            .querySelector('#widget-by-time canvas')
            .getContext('2d');
        var cfg = {
            type: 'bar',
            data: {
                datasets: [
                    {
                        data: [0],
                        backgroundColor: 'rgba(150, 80, 200, 0.8)',
                        maxBarThickness: 20,
                    },
                ],
            },
            options: {
                responsive: false,
                legend: { display: false },
                scales: {
                    xAxes: [
                        {
                            type: 'time',
                            offset: true,
                            ticks: {
                                autoSkip: false,
                                source: 'data',
                                fontColor: '#bbb',
                                minRotation: 50, // наклон лейблов
                                maxRotation: 75,
                            },
                            time: {
                                unit: ChartByTime.getTimeUnit(),
                            },
                        },
                    ],
                    yAxes: [
                        {
                            ticks: {
                                beginAtZero: true,
                                fontColor: '#bbb',
                            },
                        },
                    ],
                },
            },
        };
        this.state.chart = new Chart(ctx, cfg);
    }

    /** Обновляет график по обновлению виджета */
    updateChart(data) {
        let config = this.state.chart.config;
        let dataset = config.data.datasets[0];
        dataset.data = data;
        config.options.scales.xAxes[0].time.unit = ChartByTime.getTimeUnit();
        this.state.chart.update();
    }

    render() {
        return h(
            'div',
            { id: 'widget-by-time', class: 'dashboard-widget chart' },
            [
                h('header', null, h('span', { class: 'title' }, 'По времени')),
                h('div', { class: 'content' }, [
                    // область, на котором рисуется график
                    h('canvas', { width: '550', height: '300' }),
                ]),
            ]
        );
    }
}

// создаём виджет и регистрируем его для обновления
let widgetChartByTime = new ChartByTime();
registeredWidgetsByTab[1].push(widgetChartByTime);
