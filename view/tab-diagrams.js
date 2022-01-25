'use strict';

/** Отображает вкладку с диаграммами */
class DiagramsTab extends Component {
    render() {
        // Fragment - несуществующий элемент, который нужен, чтобы вернуть список
        return h(Fragment, null, [
            h(Filters, { filterData: diagramFilters }),
            h('div', { class: 'widget-row' }, [
                h(ChartByLogComponent, null),
                h(ChartByLevelComponent, null),
                h(ChartByMachineComponent, null),
                h(ChartByTimeComponent, null),
            ]),
        ]);
    }
}
// внедряем вкладку в dom-дерево
render(h(DiagramsTab, null), document.getElementById('tab-diagrams'));
