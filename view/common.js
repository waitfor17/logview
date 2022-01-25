'use strict';

var commonNames = {
    logs: ['Приложения', 'Безопасность', 'Система'],
    logPeriods: ['24 часа', '1 неделя', '1 месяц', '1 год', 'За всё время'],
    logLevels: ['Информация', 'Предупреждение', 'Ошибка'],
    logSecurityLevels: ['Успешный аудит', 'Неуспешный аудит'],
}

/** Бросает ошибку с сообщением `message`, если условие `condition` не выполнено */
function assert(condition, message) {
    if (!condition) {
        message = message || 'Assertion failed';
        throw new Error(message);
    }
}

const SQLTableName = {
    APP: 'LogApplication',
    SEC: 'LogSecurity',
    SYS: 'LogSystem',

    get: function (log) {
        if (log === 0) return this.APP;
        else if (log === 1) return this.SEC;
        else if (log === 2) return this.SYS;
        else assert(false);
    },
};

/** Собирает SQL-фильтр по периоду */
function getSQLFilterByPeriod(period) {
    if (period < 0 || 4 <= period) return null;

    let span;
    switch (period) {
        case 0:
            span = '1 days';
            break;
        case 1:
            span = '7 days';
            break;
        case 2:
            span = '1 months';
            break;
        case 3:
            span = '1 years';
            break;
        default:
    }
    // больше, чем текущий момент минус выбранный промежуток
    return `TimeGenerated > strftime("%Y-%m-%dT%H:%M:%S", "now", "localtime", "-${span}")`;
}

/** Собирает SQL-фильтр по уровню важности события. `levels` и `audits` - наборы битовых флагов */
function getSQLFilterByLevels(log, levels, audits) {
    if (levels < 0 || 8 <= levels) return null;
    if (audits < 0 || 4 <= audits) return null;

    let filter = '';
    // конструируем OR выражение
    if (log !== 1) {
        if (levels !== (1 | 2 | 4)) { // иначе всё включено и фильтр не нужен
            filter += ' (0';
            if (levels & 1) filter += ' OR EntryType="Information"';
            if (levels & 2) filter += ' OR EntryType="Warning"';
            if (levels & 4) filter += ' OR EntryType="Error"';
            filter += ')';
        }
    } else {
        if (audits !== (1 | 2)) {
            filter += ' (0';
            if (audits & 1) filter += ' OR EntryType="SuccessAudit"';
            if (audits & 2) filter += ' OR EntryType="FailureAudit"';
            filter += ')';
        }
    }
    return filter;
}
