WinAPI.createWindow('calculator');

let calcValue = '0';

window.appendCalc = function(char) {
    if (char === '←') {
        calcValue = calcValue.slice(0, -1) || '0';
    } else if (char === 'C') {
        calcValue = '0';
    } else if (char === '=') {
        try {
            calcValue = eval(calcValue).toString();
        } catch {
            calcValue = 'Error';
        }
    } else {
        if (calcValue === '0' || calcValue === 'Error') calcValue = '';
        calcValue += char;
    }
    const el = document.getElementById('calc-display');
    if (el) el.textContent = calcValue;
};

window.clearCalc = function() {
    calcValue = '0';
    const el = document.getElementById('calc-display');
    if (el) el.textContent = calcValue;
};

window.calculate = function() {
    window.appendCalc('=');
};
