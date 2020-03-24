import LogCard from './LogCard';
import entries from './entries';

let entryLastId = 0;

const formatTime = (date) => {
    const values = ['getHours', 'getMinutes', 'getSeconds'].map(method => date[method]());
    const zeroPaddedValues = values.map(v => ('0' + v).slice(-2));
    return zeroPaddedValues.join(':');
};

const getEntry = (...args) => {
    let entry;

    if (args[0] instanceof Error) {
        const err = args[0];
        console.error(err);
        entry = {
            title: err.message,
            body: 'Check your browser console for further details',
            type: 'error'
        };
    } else {
        const [name, ...variables] = args;
        entry = entries[name](...variables);

        if (entry.code) {
            entry.code = entry.code.replace(/^\n+/, '').replace(/\n+$/, '');
        }
    }

    entry.id = ++entryLastId;
    entry.date = formatTime(new Date());
    
    if (!entry.type) {
        entry.type = 'code';
    }

    return entry;
};

export {
    getEntry,
    LogCard
};
