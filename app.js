//Currency Class
class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

// Conversion Class
class Conversion {
    constructor(fromCurrency, toCurrency, amount, result, date = new Date()) {
        this.fromCurrency = fromCurrency;
        this.toCurrency = toCurrency;
        this.amount = amount;
        this.result = result;
        this.date = date.toISOString();
    }

    toString() {
        return `${this.amount} ${this.fromCurrency} → ${this.result.toFixed(2)} ${this.toCurrency}`;
    }
}

// App Class
class CurrencyConverter {
    constructor() {
        this.currencies = [];
        this.history = [];
        this.favorites = [];
        this.majorCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'JPY']; // Major currencies
        this.apiKey = 'ddafaf4967bb2447c490e266'; // Replace with your API key
        this.apiUrl = 'https://v6.exchangerate-api.com/v6/';

        this.initElements();
        this.loadData();
        this.fetchCurrencies();
    }

    initElements() {
        this.amountInput = document.getElementById('amount');
        this.fromCurrencySelect = document.getElementById('from-currency');
        this.toCurrencySelect = document.getElementById('to-currency');
        this.resultInput = document.getElementById('result');
        this.convertBtn = document.getElementById('convert-btn');
        this.swapBtn = document.getElementById('swap-btn');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');
        this.favoritesContainer = document.getElementById('favorites-container');
        this.saveFavoriteBtn = document.getElementById('save-favorite');
        this.quickToggleContainer = document.getElementById('quick-toggle');

        this.setupEventListeners();
        this.createQuickToggleButtons();
    }

    setupEventListeners() {
        this.convertBtn.addEventListener('click', () => this.convert());
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.saveFavoriteBtn.addEventListener('click', () => this.saveFavorite());
    }

    createQuickToggleButtons() {
        if (!this.quickToggleContainer) return;

        this.quickToggleContainer.innerHTML = '';

        // Create buttons for major currencies
        this.majorCurrencies.forEach(currency => {
            const button = document.createElement('button');
            button.textContent = currency;
            button.className = 'toggle-btn';
            button.addEventListener('click', () => this.setTargetCurrency(currency));
            this.quickToggleContainer.appendChild(button);
        });
    }

    setTargetCurrency(currency) {
        this.toCurrencySelect.value = currency;
        this.convert();
    }

    async fetchCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}${this.apiKey}/codes`);
            const data = await response.json();

            if (data.result === 'success') {
                this.currencies = data.supported_codes.map(([code, name]) => new Currency(code, name));
                this.populateCurrencyDropdowns();
            } else {
                throw new Error(data['error-type']);
            }
        } catch (error) {
            console.error('Error fetching currencies:', error);
            alert('Failed to load currencies. Please try again later.');

            // Fallback to the major currencies
            this.loadFallbackCurrencies();
        }
    }

    loadFallbackCurrencies() {
        // Define fallback currency names
        const fallbackCurrencies = [
            new Currency('USD', 'United States Dollar'),
            new Currency('EUR', 'Euro'),
            new Currency('GBP', 'British Pound Sterling'),
            new Currency('CAD', 'Canadian Dollar'),
            new Currency('JPY', 'Japanese Yen')
        ];

        this.currencies = fallbackCurrencies;
        this.populateCurrencyDropdowns();
    }

    populateCurrencyDropdowns() {
        this.fromCurrencySelect.innerHTML = '';
        this.toCurrencySelect.innerHTML = '';

        // Add major currencies first
        this.majorCurrencies.forEach(code => {
            const currency = this.currencies.find(c => c.code === code);
            if (currency) {
                // Add to "from" dropdown with highlight
                const option1 = document.createElement('option');
                option1.value = currency.code;
                option1.textContent = `${currency.code} - ${currency.name}`;
                option1.classList.add('major-currency');
                this.fromCurrencySelect.appendChild(option1);

                // Add to "to" dropdown with highlight
                const option2 = document.createElement('option');
                option2.value = currency.code;
                option2.textContent = `${currency.code} - ${currency.name}`;
                option2.classList.add('major-currency');
                this.toCurrencySelect.appendChild(option2);
            }
        });

        // Add separator for major currencies
        if (this.currencies.length > this.majorCurrencies.length) {
            const separator1 = document.createElement('option');
            separator1.disabled = true;
            separator1.textContent = '──────────────';
            this.fromCurrencySelect.appendChild(separator1);

            const separator2 = document.createElement('option');
            separator2.disabled = true;
            separator2.textContent = '──────────────';
            this.toCurrencySelect.appendChild(separator2);
        }

        // Add remaining currencies
        this.currencies
            .filter(currency => !this.majorCurrencies.includes(currency.code))
            .forEach(currency => {
                const option1 = document.createElement('option');
                option1.value = currency.code;
                option1.textContent = `${currency.code} - ${currency.name}`;
                this.fromCurrencySelect.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = currency.code;
                option2.textContent = `${currency.code} - ${currency.name}`;
                this.toCurrencySelect.appendChild(option2);
            });

        // Set default values
        this.fromCurrencySelect.value = 'USD';
        this.toCurrencySelect.value = 'EUR';
    }

    async convert() {
        const fromCurrency = this.fromCurrencySelect.value;
        const toCurrency = this.toCurrencySelect.value;
        const amount = parseFloat(this.amountInput.value);

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (fromCurrency === toCurrency) {
            this.resultInput.value = amount;
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}${this.apiKey}/pair/${fromCurrency}/${toCurrency}/${amount}`);
            const data = await response.json();

            if (data.result === 'success') {
                const result = data.conversion_result;
                this.resultInput.value = result.toFixed(2);

                // Save to history
                const conversion = new Conversion(fromCurrency, toCurrency, amount, result);
                this.history.unshift(conversion);
                this.saveData();
                this.renderHistory();
            } else {
                throw new Error(data['error-type']);
            }
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Failed to convert. Please try again later.');
        }
    }

    swapCurrencies() {
        const temp = this.fromCurrencySelect.value;
        this.fromCurrencySelect.value = this.toCurrencySelect.value;
        this.toCurrencySelect.value = temp;
        this.convert();
    }

    saveFavorite() {
        const fromCurrency = this.fromCurrencySelect.value;
        const toCurrency = this.toCurrencySelect.value;

        if (fromCurrency === toCurrency) {
            alert('Cannot save same currency pair');
            return;
        }

        const pair = `${fromCurrency}_${toCurrency}`;

        if (!this.favorites.includes(pair)) {
            this.favorites.push(pair);
            this.saveData();
            this.renderFavorites();
        }
    }

    removeFavorite(pair) {
        this.favorites = this.favorites.filter(fav => fav !== pair);
        this.saveData();
        this.renderFavorites();
    }

    renderFavorites() {
        this.favoritesContainer.innerHTML = '';

        this.favorites.forEach(pair => {
            const [from, to] = pair.split('_');
            const favoriteElement = document.createElement('div');
            favoriteElement.className = 'favorite-pair';
            favoriteElement.innerHTML = `
                <span>${from} → ${to}</span>
                <button onclick="app.useFavorite('${pair}')">Use</button>
                <button onclick="app.removeFavorite('${pair}')">×</button>
            `;
            this.favoritesContainer.appendChild(favoriteElement);
        });
    }

    useFavorite(pair) {
        const [from, to] = pair.split('_');
        this.fromCurrencySelect.value = from;
        this.toCurrencySelect.value = to;
        this.convert();
    }

    renderHistory() {
        this.historyList.innerHTML = '';

        this.history.slice(0, 5).forEach(conversion => {
            const li = document.createElement('li');
            li.textContent = conversion.toString();
            this.historyList.appendChild(li);
        });
    }

    clearHistory() {
        this.history = [];
        this.saveData();
        this.renderHistory();
    }

    loadData() {
        const savedData = localStorage.getItem('currencyConverterData');
        if (savedData) {
            const { history, favorites } = JSON.parse(savedData);
            this.history = history.map(item => new Conversion(
                item.fromCurrency,
                item.toCurrency,
                item.amount,
                item.result,
                new Date(item.date)
            ));
            this.favorites = favorites;
            this.renderHistory();
            this.renderFavorites();
        }
    }

    saveData() {
        const data = {
            history: this.history,
            favorites: this.favorites
        };
        localStorage.setItem('currencyConverterData', JSON.stringify(data));
    }
}

// Initialize app
const app = new CurrencyConverter();

// Make app available globally for button click handlers
window.app = app;