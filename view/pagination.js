'use strict';

/** Компонент переключения страниц */
class Pagination extends Component {
    constructor(props) {
        super(props);
        // хранит номер открытой сейчас страницы
        this.state = { active: 0 };
    }

    render(props, state) {
        if (props.count <= 1) return h('div', { class: 'pagination' });

        // подбираем смещение и кол-во отображаемых кнопок (5 максимум)
        let first = Math.max(Math.min(state.active - 2, props.count - 5), 0);
        let last = Math.min(props.count, first + 5);
        // должны ли кнопки "назад" и "вперёд" быть активны
        let hasPrev = state.active > 0;
        let hasNext = state.active < props.count - 1;

        let prev = h(
            'div',
            hasPrev
                ? {
                      class: 'page',
                      onMouseDown: (e) => {
                          // если нажата левая кнопка мыши...
                          if (e.button === 0) {
                              // выставляем страницу и сообщаем об этом выше
                              this.setState({ active: state.active - 1 });
                              props.onSelect(state.active - 1);
                          }
                      },
                  }
                : { class: 'page disabled' },
            '« пред.'
        );
        let next = h(
            'div',
            hasNext
                ? {
                      class: 'page',
                      onMouseDown: (e) => {
                          if (e.button === 0) {
                              this.setState({ active: state.active + 1 });
                              props.onSelect(state.active + 1);
                          }
                      },
                  }
                : { class: 'page disabled' },
            'след. »'
        );
        let pages = [];

        pages.push(prev);
        for (let i = first; i < last; i++) {
            pages.push(
                h(
                    'div',
                    i === state.active
                        ? { class: 'page active' }
                        : {
                              class: 'page',
                              onMouseDown: (e) => {
                                  if (e.button === 0) {
                                      this.setState({ active: i });
                                      props.onSelect(i);
                                  }
                              },
                          },
                    i + 1
                )
            );
        }
        pages.push(next);
        return h('div', { class: 'pagination' }, pages);
    }
}
