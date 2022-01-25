'use strict';

/** Имена куков для сохранения/загрузки фильтров */
class FilterCookies {
    constructor(log, period, levels, audits) {
        this.log = log;
        this.period = period;
        this.levels = levels;
        this.audits = audits;
    }

    /** Загружает число из куков. `def` - значение по умолчанию */
    static getNum(cookie, def) {
        let value = Cookies.get(cookie);
        return value ? +value : def;
    }
}

/** Непосредственное состояние фильтра */
class FilterData {
    constructor(cookies, tab) {
        this.cookies = cookies;
        this.tab = tab; // номер вкладки
        this._log = FilterCookies.getNum(cookies.log, 0);
        this._period = FilterCookies.getNum(cookies.period, 4);
        this._levels = FilterCookies.getNum(cookies.levels, 7);
        this._audits = FilterCookies.getNum(cookies.audits, 3);
        this._search = '';
    }

    get log() {
        return this._log;
    }
    get period() {
        return this._period;
    }
    get levels() {
        return this._levels;
    }
    get audits() {
        return this._audits;
    }
    get search() {
        return this._search;
    }

    set log(value) {
        // если значение фильтра поменялось, сохраняем его в куки и обновляем вкладку
        if (this._log !== value) {
            this._log = value;
            Cookies.set(this.cookies.log, value, { sameSite: 'strict' });
            updateTab(this.tab);
        }
    }
    set period(value) {
        if (this._period !== value) {
            this._period = value;
            Cookies.set(this.cookies.period, value, { sameSite: 'strict' });
            updateTab(this.tab);
        }
    }
    set levels(value) {
        if (this._levels !== value) {
            this._levels = value;
            Cookies.set(this.cookies.levels, value, { sameSite: 'strict' });
            updateTab(this.tab);
        }
    }
    set audits(value) {
        if (this._audits !== value) {
            this._audits = value;
            Cookies.set(this.cookies.audits, value, { sameSite: 'strict' });
            updateTab(this.tab);
        }
    }
    set search(value) {
        if (this._search !== value) {
            this._search = value;
            updateTab(this.tab);
        }
    }
}

class Filters extends Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
        this.handleInputDebounced = debounce(this.handleInput, 250);
        // `debounce` позволяет обновить результаты поиска только после того,
        // как пользователь закончил набирать текст в поле ввода
        // (мин. задержка в 250 миллисекунд)
    }

    set log(value) {
        this.props.filterData.log = value;
        this.setState({}); // иначе компонент не обновляется
    }
    set period(value) {
        this.props.filterData.period = value;
        this.setState({});
    }
    set levels(value) {
        this.props.filterData.levels = value;
        this.setState({});
    }
    set audits(value) {
        this.props.filterData.audits = value;
        this.setState({});
    }

    handleInput(e) {
        this.props.filterData.search = e.target.value;
    }

    render(props) {
        return h('div', { class: 'filter-list' }, [
            h('span', { class: 'title' }, 'Фильтры:'),
            h(
                'ul',
                { class: 'filter btn-group' },
                // рендерим кнопки
                commonNames.logs.map((val, i) => {
                    // если активна, то и нажать нельзя
                    if (props.filterData.log === i)
                        return h('li', { class: 'active' }, val);

                    let onMouseDown = (e) => {
                        if (e.button === 0) this.log = i;
                    };
                    return h('li', { onMouseDown }, val);
                })
            ),
            h(
                'ul',
                { class: 'filter btn-group' },
                commonNames.logPeriods.map((val, i) => {
                    if (props.filterData.period === i)
                        return h('li', { class: 'active' }, val);

                    let onMouseDown = (e) => {
                        if (e.button === 0) this.period = i;
                    };
                    return h('li', { onMouseDown }, val);
                })
            ),
            props.filterData.log !== 1
                ? h(
                      'ul',
                      { class: 'filter checkboxes' },
                      // рендерим чекбоксы
                      commonNames.logLevels.map((val, i) => {
                          return h('li', null, [
                              h('input', {
                                  type: 'checkbox',
                                  checked: props.filterData.levels & (1 << i), // если выставлен битовый флаг
                                  onChange: () =>
                                      (this.levels =
                                          props.filterData.levels ^ (1 << i)), // переключаем битовый флаг
                              }),
                              h('label', null, val),
                          ]);
                      })
                  )
                : h(
                      'ul',
                      { class: 'filter checkboxes' },
                      commonNames.logSecurityLevels.map((val, i) => {
                          return h('li', null, [
                              h('input', {
                                  type: 'checkbox',
                                  checked: props.filterData.audits & (1 << i),
                                  onChange: () =>
                                      (this.audits =
                                          props.filterData.audits ^ (1 << i)),
                              }),
                              h('label', null, val),
                          ]);
                      })
                  ),
            props.showSearch // строка поиска
                ? h('input', {
                      type: 'text',
                      placeholder: 'Поиск...',
                      onInput: this.handleInputDebounced,
                  })
                : null,
        ]);
    }
}
