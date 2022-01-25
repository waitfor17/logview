'use strict';

class ChartByMachine {
    get command() {
        let query = 'SELECT MachineName,COUNT(LogId) FROM ';

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
        // группировка по имени хоста
        let end = ' GROUP BY MachineName';
        return query + end;
    }

    get params() {
        return [];
    }

    update(result) {
        if (this.onUpdate) {
            // выделяем результат, считаем сумму всего
            let names = result.map((r) => r[0]);
            let data = result.map((r) => r[1]);
            let total = 0;
            for (let v of data) total += v;

            this.onUpdate(names, data, total);
        }
    }
}

class ChartByMachineComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chart: null,
            names: [],
            data: [],
            total: 0,
        };

        this.updateChart = this.updateChart.bind(this);
        widgetChartByMachine.onUpdate = this.updateChart;
    }

    componentDidMount() {
        // создаём объект графика с определённой конфигурацией на канвасе
        var ctx = document
            .querySelector('#widget-by-machine canvas')
            .getContext('2d');
        var cfg = {
            type: 'pie',
            data: {
                datasets: [
                    {
                        data: [0],
                        backgroundColor: [],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: false,
                legend: { display: false },
            },
        };
        this.state.chart = new Chart(ctx, cfg);
    }

    /** Обновляет график и таблицу по обновлению виджета */
    updateChart(names, data, total) {
        let config = this.state.chart.config;
        let dataset = config.data.datasets[0];
        config.data.labels = names;
        dataset.data = data;
        // генерируем случайные цвета для разных машин
        if (dataset.backgroundColor.length < data.length)
            dataset.backgroundColor = data.map((v) => randomChartColor());
        this.state.chart.update();

        this.setState({ names, data, total });
    }

    render() {
        return h(
            'div',
            { id: 'widget-by-machine', class: 'dashboard-widget chart' },
            [
                h(
                    'header',
                    null,
                    h('span', { class: 'title' }, 'По имени машины')
                ),
                h('div', { class: 'content' }, [
                    // область, на котором рисуется график
                    h('canvas', { width: '180', height: '180' }),
                    h(
                        'div',
                        { class: 'table-wrapper' },
                        // таблица
                        h(ChartTable, {
                            names: this.state.names,
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
let widgetChartByMachine = new ChartByMachine();
registeredWidgetsByTab[1].push(widgetChartByMachine);
