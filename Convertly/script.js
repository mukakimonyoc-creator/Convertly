/* =========================================================
   CONVERTLY V2
   MAIN JAVASCRIPT
========================================================= */

const API = "https://api.frankfurter.dev/v2";

const CACHE_KEY = "convertly_rates_v2";
const CURRENCY_CACHE_KEY = "convertly_currencies_v2";
const THEME_KEY = "convertly_theme";

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;


/* =========================================================
   DOM
========================================================= */

const amountInput =
    document.getElementById("amount");

const fromCurrency =
    document.getElementById("fromCurrency");

const toCurrency =
    document.getElementById("toCurrency");

const fromFlag =
    document.getElementById("fromFlag");

const toFlag =
    document.getElementById("toFlag");

const convertButton =
    document.getElementById("convertButton");

const swapButton =
    document.getElementById("swapButton");

const refreshButton =
    document.getElementById("refreshButton");

const result =
    document.getElementById("result");

const resultLabel =
    document.getElementById("resultLabel");

const rate =
    document.getElementById("rate");

const updated =
    document.getElementById("updated");

const status =
    document.getElementById("status");

const quickRates =
    document.getElementById("quickRates");

const comparisonCurrency =
    document.getElementById("comparisonCurrency");

const comparisonAmount =
    document.getElementById("comparisonAmount");

const comparisonGrid =
    document.getElementById("comparisonGrid");

const copyButton =
    document.getElementById("copyButton");

const shareButton =
    document.getElementById("shareButton");

const themeButton =
    document.getElementById("themeButton");

const installButton =
    document.getElementById("installButton");

const connectionStatus =
    document.getElementById("connectionStatus");

const year =
    document.getElementById("year");


/* =========================================================
   DATA
========================================================= */

let currencies = {};
let rateCache = {};
let currentRateDate = null;
let deferredInstallPrompt = null;


/* =========================================================
   POPULAR CURRENCIES
========================================================= */

const popularCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "KES",
    "UGX",
    "TZS",
    "ZAR",
    "NGN",
    "GHS",
    "AED",
    "SAR",
    "CNY",
    "JPY",
    "INR",
    "CAD",
    "AUD",
    "CHF",
    "BRL"
];


/* =========================================================
   CURRENCY FLAG CLASSES
   No emoji used.
========================================================= */

const currencyFlagClasses = {

    AED: "flag-ae",
    AUD: "flag-au",
    BRL: "flag-br",
    CAD: "flag-ca",
    CHF: "flag-ch",
    CNY: "flag-cn",

    EUR: "flag-eu",
    GBP: "flag-gb",
    GHS: "flag-gh",

    INR: "flag-in",
    JPY: "flag-jp",
    KES: "flag-ke",
    NGN: "flag-ng",
    RWF: "flag-rw",
    SAR: "flag-sa",
    TZS: "flag-tz",
    UGX: "flag-ug",
    USD: "flag-us",
    ZAR: "flag-za",

    BIF: "flag-default",
    CDF: "flag-default",
    ETB: "flag-default",
    MAD: "flag-default",
    MUR: "flag-default",
    MWK: "flag-default",
    MZN: "flag-default",
    NAD: "flag-default",
    NOK: "flag-default",
    NZD: "flag-default",
    PKR: "flag-default",
    PLN: "flag-default",
    SEK: "flag-default",
    SGD: "flag-default",
    TRY: "flag-default",
    XAF: "flag-default",
    XOF: "flag-default",
    ZMW: "flag-default"
};


/* =========================================================
   FLAG HELPERS
========================================================= */

function getFlagClass(code) {

    return (
        currencyFlagClasses[code] ||
        "flag-default"
    );
}


function setCurrencyFlag(
    element,
    code
) {

    if (!element) {
        return;
    }

    element.className =
        `currency-flag ${getFlagClass(code)}`;

    element.textContent = "";

    element.setAttribute(
        "aria-label",
        `${code} currency`
    );
}


function createFlagElement(
    type,
    code
) {

    const element =
        document.createElement("span");

    element.className =
        `${type} ${getFlagClass(code)}`;

    element.setAttribute(
        "aria-hidden",
        "true"
    );

    return element;
}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value) {

    if (!Number.isFinite(value)) {
        return "—";
    }

    if (Math.abs(value) >= 1000) {

        return new Intl.NumberFormat(
            undefined,
            {
                maximumFractionDigits: 2
            }
        ).format(value);
    }

    return new Intl.NumberFormat(
        undefined,
        {
            maximumFractionDigits: 6
        }
    ).format(value);
}


/* =========================================================
   STATUS
========================================================= */

function setStatus(
    message,
    type = ""
) {

    if (!status) {
        return;
    }

    status.textContent =
        message;

    status.className =
        `status ${type}`.trim();
}


/* =========================================================
   LOAD CURRENCIES
========================================================= */

async function loadCurrencies() {

    try {

        setStatus(
            "Loading world currencies..."
        );

        const response =
            await fetch(
                `${API}/currencies`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load currencies."
            );
        }

        const data =
            await response.json();

        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid currency response."
            );
        }

        currencies = {};

        data.forEach(currency => {

            if (
                currency &&
                currency.iso_code
            ) {

                currencies[
                    currency.iso_code
                ] = currency;
            }
        });


        localStorage.setItem(
            CURRENCY_CACHE_KEY,
            JSON.stringify({
                timestamp: Date.now(),
                data
            })
        );


        populateCurrencySelects();


        setStatus(
            `${data.length} currencies available.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Currency loading error:",
            error
        );


        const cached =
            localStorage.getItem(
                CURRENCY_CACHE_KEY
            );


        if (cached) {

            try {

                const parsed =
                    JSON.parse(cached);

                const data =
                    Array.isArray(parsed.data)
                        ? parsed.data
                        : [];


                currencies = {};


                data.forEach(currency => {

                    if (
                        currency &&
                        currency.iso_code
                    ) {

                        currencies[
                            currency.iso_code
                        ] = currency;
                    }
                });


                populateCurrencySelects();


                setStatus(
                    "Offline mode — using saved currencies.",
                    "success"
                );

                return;


            } catch (cacheError) {

                console.error(
                    "Currency cache error:",
                    cacheError
                );
            }
        }


        setStatus(
            "Unable to load currencies. Check your internet connection.",
            "error"
        );
    }
}


/* =========================================================
   POPULATE SELECTS
========================================================= */

function populateCurrencySelects() {

    if (
        !fromCurrency ||
        !toCurrency
    ) {

        console.error(
            "Currency select elements are missing."
        );

        return;
    }


    const list =
        Object.values(currencies)
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


    const currentFrom =
        fromCurrency.value ||
        "RWF";


    const currentTo =
        toCurrency.value ||
        "USD";


    const currentComparison =
        comparisonCurrency
            ? comparisonCurrency.value ||
              "RWF"
            : "RWF";


    fromCurrency.innerHTML = "";
    toCurrency.innerHTML = "";


    if (comparisonCurrency) {
        comparisonCurrency.innerHTML = "";
    }


    list.forEach(currency => {

        const code =
            currency.iso_code;

        const name =
            currency.name;

        const symbol =
            currency.symbol || "";


        const text =
            `${name} (${code})${
                symbol
                    ? ` · ${symbol}`
                    : ""
            }`;


        fromCurrency.appendChild(
            new Option(
                text,
                code
            )
        );


        toCurrency.appendChild(
            new Option(
                text,
                code
            )
        );


        if (comparisonCurrency) {

            comparisonCurrency.appendChild(
                new Option(
                    text,
                    code
                )
            );
        }
    });


    fromCurrency.value =
        currencies[currentFrom]
            ? currentFrom
            : "RWF";


    toCurrency.value =
        currencies[currentTo]
            ? currentTo
            : "USD";


    if (comparisonCurrency) {

        comparisonCurrency.value =
            currencies[currentComparison]
                ? currentComparison
                : "RWF";
    }


    updateFlags();
}


/* =========================================================
   UPDATE FLAGS
========================================================= */

function updateFlags() {

    if (fromFlag) {

        setCurrencyFlag(
            fromFlag,
            fromCurrency
                ? fromCurrency.value
                : "RWF"
        );
    }


    if (toFlag) {

        setCurrencyFlag(
            toFlag,
            toCurrency
                ? toCurrency.value
                : "USD"
        );
    }
}


/* =========================================================
   CACHE HELPERS
========================================================= */

function saveRateCache(
    base,
    rates,
    date
) {

    rateCache[base] = {

        timestamp:
            Date.now(),

        date,

        rates
    };


    localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(rateCache)
    );
}


function loadRateCache() {

    try {

        const stored =
            localStorage.getItem(
                CACHE_KEY
            );


        if (!stored) {
            return;
        }


        rateCache =
            JSON.parse(stored);


    } catch (error) {

        console.error(
            "Rate cache error:",
            error
        );

        rateCache = {};
    }
}


/* =========================================================
   GET RATES
========================================================= */

async function getRates(base) {

    const cached =
        rateCache[base];


    if (
        cached &&
        Date.now() -
            cached.timestamp <
            CACHE_MAX_AGE
    ) {

        currentRateDate =
            cached.date;

        return cached.rates;
    }


    try {

        const response =
            await fetch(
                `${API}/rates?base=${encodeURIComponent(base)}`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Rate request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid rate response."
            );
        }


        const rates = {};


        data.forEach(item => {

            if (
                item &&
                item.quote &&
                Number.isFinite(
                    Number(item.rate)
                )
            ) {

                rates[
                    item.quote
                ] =
                    Number(item.rate);
            }
        });


        rates[base] = 1;


        const date =
            data.length &&
            data[0].date
                ? data[0].date
                : new Date()
                    .toISOString()
                    .slice(0, 10);


        saveRateCache(
            base,
            rates,
            date
        );


        currentRateDate =
            date;


        return rates;


    } catch (error) {

        if (cached) {

            currentRateDate =
                cached.date;

            return cached.rates;
        }

        throw error;
    }
}


/* =========================================================
   GET SINGLE RATE
========================================================= */

async function getRate(
    from,
    to
) {

    if (from === to) {

        return {
            rate: 1,
            date: currentRateDate
        };
    }


    try {

        const rates =
            await getRates(from);


        if (
            Number.isFinite(
                rates[to]
            )
        ) {

            return {
                rate: rates[to],
                date: currentRateDate
            };
        }

    } catch (error) {

        console.warn(
            "Base rate request failed:",
            error
        );
    }


    /* EUR fallback */

    if (
        from !== "EUR" &&
        to !== "EUR"
    ) {

        try {

            const eurRates =
                await getRates("EUR");


            const fromRate =
                eurRates[from];

            const toRate =
                eurRates[to];


            if (
                Number.isFinite(fromRate) &&
                Number.isFinite(toRate)
            ) {

                return {
                    rate:
                        toRate /
                        fromRate,

                    date:
                        currentRateDate
                };
            }

        } catch (error) {

            console.warn(
                "EUR fallback failed:",
                error
            );
        }
    }


    throw new Error(
        `No current rate available for ${from}/${to}`
    );
}


/* =========================================================
   MAIN CONVERSION
========================================================= */

async function convertCurrency() {

    if (
        !amountInput ||
        !fromCurrency ||
        !toCurrency ||
        !result ||
        !rate
    ) {

        return;
    }


    const amount =
        Number(
            amountInput.value
        );


    const from =
        fromCurrency.value;


    const to =
        toCurrency.value;


    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        result.textContent =
            "—";

        rate.textContent =
            "Enter a valid amount.";

        return;
    }


    result.textContent =
        "Loading...";

    rate.textContent =
        "Getting exchange rate...";


    try {

        const data =
            await getRate(
                from,
                to
            );


        const converted =
            amount * data.rate;


        if (resultLabel) {

            resultLabel.textContent =
                `${formatNumber(amount)} ${from} =`;
        }


        result.textContent =
            `${formatNumber(converted)} ${to}`;


        rate.textContent =
            `1 ${from} = ${formatNumber(data.rate)} ${to}`;


        if (updated) {

            updated.textContent =
                data.date
                    ? `Rate date: ${data.date}`
                    : "Latest saved rate";
        }


        setStatus(
            navigator.onLine
                ? "Conversion updated"
                : "Offline — using saved rate",
            "success"
        );


    } catch (error) {

        console.error(
            "Conversion error:",
            error
        );


        result.textContent =
            "Rate unavailable";


        rate.textContent =
            "Please try again";


        if (updated) {
            updated.textContent = "";
        }


        setStatus(
            "Unable to retrieve this exchange rate.",
            "error"
        );
    }
}


/* =========================================================
   SWAP
========================================================= */

function swapCurrencies() {

    if (
        !fromCurrency ||
        !toCurrency
    ) {

        return;
    }


    const oldFrom =
        fromCurrency.value;


    fromCurrency.value =
        toCurrency.value;


    toCurrency.value =
        oldFrom;


    updateFlags();

    convertCurrency();
}


/* =========================================================
   QUICK RATES
========================================================= */

async function loadQuickRates() {

    if (!quickRates) {
        return;
    }


    quickRates.innerHTML =
        "";


    try {

        const rates =
            await getRates("RWF");


        const targets =
            popularCurrencies.filter(
                code =>
                    code !== "RWF" &&
                    Number.isFinite(
                        rates[code]
                    )
            );


        targets.forEach(code => {

            const currency =
                currencies[code];


            if (!currency) {
                return;
            }


            const value =
                rates[code];


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "rate-card";


            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "rate-card-header";


            const flag =
                createFlagElement(
                    "rate-card-flag",
                    code
                );


            const info =
                document.createElement(
                    "div"
                );


            info.innerHTML = `
                <div class="rate-card-name">
                    ${escapeHtml(currency.name)}
                </div>

                <div class="rate-card-code">
                    ${code}
                </div>
            `;


            header.appendChild(flag);
            header.appendChild(info);


            const valueElement =
                document.createElement(
                    "div"
                );

            valueElement.className =
                "rate-card-value";


            valueElement.textContent =
                `1 ${code} = ${
                    formatNumber(1 / value)
                } RWF`;


            const dateElement =
                document.createElement(
                    "div"
                );

            dateElement.className =
                "rate-card-date";


            dateElement.textContent =
                currentRateDate
                    ? `Rate date: ${currentRateDate}`
                    : "Latest saved rate";


            card.appendChild(header);
            card.appendChild(valueElement);
            card.appendChild(dateElement);


            quickRates.appendChild(card);
        });


        if (
            !quickRates.children.length
        ) {

            quickRates.innerHTML = `
                <div class="loading-card">
                    No quick rates available.
                </div>
            `;
        }


    } catch (error) {

        console.error(
            "Quick rates error:",
            error
        );


        quickRates.innerHTML = `
            <div class="loading-card">
                Unable to load quick rates.
            </div>
        `;
    }
}


/* =========================================================
   MONEY COMPARISON
========================================================= */

async function loadComparison() {

    if (
        !comparisonCurrency ||
        !comparisonAmount ||
        !comparisonGrid
    ) {

        return;
    }


    const base =
        comparisonCurrency.value;


    const amount =
        Number(
            comparisonAmount.value
        );


    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        comparisonGrid.innerHTML = `
            <div class="loading-card">
                Enter a valid amount.
            </div>
        `;

        return;
    }


    comparisonGrid.innerHTML = `
        <div class="loading-card">
            Loading comparison...
        </div>
    `;


    try {

        const rates =
            await getRates(base);


        const targets =
            popularCurrencies.filter(
                code =>
                    code !== base &&
                    Number.isFinite(
                        rates[code]
                    )
            );


        comparisonGrid.innerHTML =
            "";


        targets.forEach(code => {

            const currency =
                currencies[code];


            if (!currency) {
                return;
            }


            const converted =
                amount *
                rates[code];


            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "comparison-item";


            const top =
                document.createElement(
                    "div"
                );

            top.className =
                "comparison-top";


            const flag =
                createFlagElement(
                    "comparison-flag",
                    code
                );


            const info =
                document.createElement(
                    "div"
                );


            info.innerHTML = `
                <div class="comparison-name">
                    ${escapeHtml(currency.name)}
                </div>

                <div class="comparison-code">
                    ${code}
                </div>
            `;


            top.appendChild(flag);
            top.appendChild(info);


            const valueElement =
                document.createElement(
                    "div"
                );

            valueElement.className =
                "comparison-value";


            valueElement.textContent =
                `${formatNumber(converted)} ${code}`;


            const rateElement =
                document.createElement(
                    "div"
                );

            rateElement.className =
                "comparison-rate";


            rateElement.textContent =
                `1 ${base} = ${
                    formatNumber(rates[code])
                } ${code}`;


            item.appendChild(top);
            item.appendChild(valueElement);
            item.appendChild(rateElement);


            comparisonGrid.appendChild(
                item
            );
        });


        if (
            !comparisonGrid.children.length
        ) {

            comparisonGrid.innerHTML = `
                <div class="loading-card">
                    No comparison rates available.
                </div>
            `;
        }


    } catch (error) {

        console.error(
            "Comparison error:",
            error
        );


        comparisonGrid.innerHTML = `
            <div class="loading-card">
                Unable to load comparison rates.
            </div>
        `;
    }
}


/* =========================================================
   COPY RESULT
========================================================= */

async function copyResult() {

    if (
        !result ||
        !resultLabel ||
        !copyButton
    ) {

        return;
    }


    const text =
        resultLabel.textContent +
        " " +
        result.textContent;


    if (
        result.textContent === "—" ||
        result.textContent === "Loading..." ||
        result.textContent === "Rate unavailable"
    ) {

        return;
    }


    try {

        await navigator.clipboard.writeText(
            text
        );


        const oldText =
            copyButton.textContent;


        copyButton.textContent =
            "Copied";


        setTimeout(() => {

            copyButton.textContent =
                oldText;

        }, 1500);


    } catch {

        alert(
            "Unable to copy result."
        );
    }
}


/* =========================================================
   SHARE
========================================================= */

async function shareResult() {

    if (
        !result ||
        !resultLabel ||
        !rate
    ) {

        return;
    }


    const text =
        `${resultLabel.textContent} ${result.textContent}
${rate.textContent}

Converted with Convertly`;


    if (
        result.textContent === "—" ||
        result.textContent === "Loading..." ||
        result.textContent === "Rate unavailable"
    ) {

        return;
    }


    if (navigator.share) {

        try {

            await navigator.share({

                title:
                    "Convertly Currency Conversion",

                text

            });

        } catch {
            /* User cancelled sharing. */
        }

    } else {

        await copyTextFallback(text);


        alert(
            "Sharing is not supported here. The result was copied instead."
        );
    }
}


/* =========================================================
   FALLBACK COPY
========================================================= */

async function copyTextFallback(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    } catch {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        document.body.appendChild(
            textarea
        );


        textarea.select();


        document.execCommand(
            "copy"
        );


        textarea.remove();
    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            character => {

                const entities = {

                    "&":
                        "&amp;",

                    "<":
                        "&lt;",

                    ">":
                        "&gt;",

                    '"':
                        "&quot;",

                    "'":
                        "&#039;"
                };


                return entities[
                    character
                ];
            }
        );
}


/* =========================================================
   DARK MODE
========================================================= */

function updateThemeButton() {

    if (!themeButton) {
        return;
    }


    const dark =
        document.body.classList.contains(
            "dark"
        );


    themeButton.setAttribute(
        "aria-label",
        dark
            ? "Switch to light mode"
            : "Switch to dark mode"
    );


    themeButton.setAttribute(
        "title",
        dark
            ? "Switch to light mode"
            : "Switch to dark mode"
    );
}


function loadTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        );


    if (saved === "dark") {

        document.body.classList.add(
            "dark"
        );

    } else {

        document.body.classList.remove(
            "dark"
        );
    }


    updateThemeButton();
}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        THEME_KEY,
        dark
            ? "dark"
            : "light"
    );


    updateThemeButton();
}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function updateConnectionStatus() {

    if (!connectionStatus) {
        return;
    }


    if (navigator.onLine) {

        connectionStatus.textContent =
            "Online";


        connectionStatus.classList.remove(
            "offline"
        );

    } else {

        connectionStatus.textContent =
            "Offline";


        connectionStatus.classList.add(
            "offline"
        );


        setStatus(
            "You're offline. Saved rates can still be used.",
            "success"
        );
    }
}


/* =========================================================
   PWA INSTALL
========================================================= */

if (installButton) {

    installButton.hidden =
        true;


    window.addEventListener(
        "beforeinstallprompt",
        event => {

            event.preventDefault();


            deferredInstallPrompt =
                event;


            installButton.hidden =
                false;


            console.log(
                "Convertly is ready to install."
            );
        }
    );


    installButton.addEventListener(
        "click",
        async () => {

            if (!deferredInstallPrompt) {

                console.log(
                    "No installation prompt is currently available."
                );

                return;
            }


            const prompt =
                deferredInstallPrompt;


            deferredInstallPrompt =
                null;


            installButton.hidden =
                true;


            try {

                await prompt.prompt();


                const choice =
                    await prompt.userChoice;


                console.log(
                    "Install result:",
                    choice.outcome
                );


            } catch (error) {

                console.error(
                    "Installation error:",
                    error
                );
            }
        }
    );


    window.addEventListener(
        "appinstalled",
        () => {

            deferredInstallPrompt =
                null;


            installButton.hidden =
                true;


            console.log(
                "Convertly has been installed."
            );
        }
    );
}


/* =========================================================
   SERVICE WORKER
========================================================= */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )

                .then(
                    registration => {

                        console.log(
                            "Convertly Service Worker registered:",
                            registration.scope
                        );
                    }
                )

                .catch(
                    error => {

                        console.error(
                            "Service Worker registration failed:",
                            error
                        );
                    }
                );
        }
    );
}


/* =========================================================
   CURRENCY ASSISTANT
========================================================= */

const chatToggle =
    document.getElementById("chatToggle");

const chatbot =
    document.getElementById("chatbot");

const chatClose =
    document.getElementById("chatClose");

const chatForm =
    document.getElementById("chatForm");

const chatInput =
    document.getElementById("chatInput");

const chatMessages =
    document.getElementById("chatMessages");

const chatSend =
    document.getElementById("chatSend");


/* =========================================================
   CURRENCY KNOWLEDGE
========================================================= */

const currencyKnowledge = {

    USD: {
        name: "US Dollar",
        country: "United States"
    },

    EUR: {
        name: "Euro",
        country: "European Union"
    },

    GBP: {
        name: "British Pound",
        country: "United Kingdom"
    },

    RWF: {
        name: "Rwandan Franc",
        country: "Rwanda"
    },

    KES: {
        name: "Kenyan Shilling",
        country: "Kenya"
    },

    UGX: {
        name: "Ugandan Shilling",
        country: "Uganda"
    },

    TZS: {
        name: "Tanzanian Shilling",
        country: "Tanzania"
    },

    ZAR: {
        name: "South African Rand",
        country: "South Africa"
    },

    NGN: {
        name: "Nigerian Naira",
        country: "Nigeria"
    },

    GHS: {
        name: "Ghanaian Cedi",
        country: "Ghana"
    },

    AED: {
        name:
            "United Arab Emirates Dirham",
        country:
            "United Arab Emirates"
    },

    SAR: {
        name: "Saudi Riyal",
        country: "Saudi Arabia"
    },

    CNY: {
        name: "Chinese Yuan",
        country: "China"
    },

    JPY: {
        name: "Japanese Yen",
        country: "Japan"
    },

    INR: {
        name: "Indian Rupee",
        country: "India"
    },

    CAD: {
        name: "Canadian Dollar",
        country: "Canada"
    },

    AUD: {
        name: "Australian Dollar",
        country: "Australia"
    },

    CHF: {
        name: "Swiss Franc",
        country: "Switzerland"
    },

    BRL: {
        name: "Brazilian Real",
        country: "Brazil"
    }
};


/* =========================================================
   COUNTRY → CURRENCY
========================================================= */

const countryCurrencies = {

    rwanda: "RWF",

    kenya: "KES",

    uganda: "UGX",

    tanzania: "TZS",

    "south africa": "ZAR",

    nigeria: "NGN",

    ghana: "GHS",

    "united states": "USD",

    usa: "USD",

    america: "USD",

    "united kingdom": "GBP",

    uk: "GBP",

    britain: "GBP",

    france: "EUR",

    germany: "EUR",

    italy: "EUR",

    spain: "EUR",

    japan: "JPY",

    china: "CNY",

    india: "INR",

    canada: "CAD",

    australia: "AUD",

    brazil: "BRL",

    switzerland: "CHF",

    "saudi arabia": "SAR",

    "united arab emirates": "AED"
};


/* =========================================================
   OPEN / CLOSE CHAT
========================================================= */

function openChat() {

    if (!chatbot) {
        return;
    }


    chatbot.classList.add(
        "open"
    );


    chatbot.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(() => {

        if (chatInput) {
            chatInput.focus();
        }

    }, 150);
}


function closeChat() {

    if (!chatbot) {
        return;
    }


    chatbot.classList.remove(
        "open"
    );


    chatbot.setAttribute(
        "aria-hidden",
        "true"
    );
}


if (chatToggle) {

    chatToggle.addEventListener(
        "click",
        () => {

            if (
                chatbot &&
                chatbot.classList.contains(
                    "open"
                )
            ) {

                closeChat();

            } else {

                openChat();
            }
        }
    );
}


if (chatClose) {

    chatClose.addEventListener(
        "click",
        closeChat
    );
}


/* =========================================================
   ADD CHAT MESSAGE
========================================================= */

function addChatMessage(
    message,
    type = "bot"
) {

    if (!chatMessages) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        `chat-message ${type}`;


    if (type === "bot") {

        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "message-avatar";


        avatar.textContent =
            "CV";


        wrapper.appendChild(
            avatar
        );
    }


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "message-content";


    const paragraph =
        document.createElement(
            "p"
        );


    paragraph.textContent =
        message;


    content.appendChild(
        paragraph
    );


    wrapper.appendChild(
        content
    );


    chatMessages.appendChild(
        wrapper
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTyping() {

    if (!chatMessages) {
        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "chat-message bot";


    wrapper.id =
        "chatTyping";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    avatar.textContent =
        "CV";


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "typing";


    typing.innerHTML =
        "<span></span><span></span><span></span>";


    wrapper.appendChild(
        avatar
    );


    wrapper.appendChild(
        typing
    );


    chatMessages.appendChild(
        wrapper
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


function hideTyping() {

    const typing =
        document.getElementById(
            "chatTyping"
        );


    if (typing) {
        typing.remove();
    }
}


/* =========================================================
   FIND CURRENCY CODE
========================================================= */

function findCurrencyCode(text) {

    if (!text) {
        return null;
    }


    const codes =
        Object.keys(
            currencyKnowledge
        );


    for (const code of codes) {

        const regex =
            new RegExp(
                `\\b${code}\\b`,
                "i"
            );


        if (
            regex.test(text)
        ) {

            return code;
        }
    }


    const lower =
        text.toLowerCase();


    for (
        const [country, code]
        of Object.entries(
            countryCurrencies
        )
    ) {

        if (
            lower.includes(country)
        ) {

            return code;
        }
    }


    for (
        const [code, data]
        of Object.entries(
            currencyKnowledge
        )
    ) {

        if (
            lower.includes(
                data.name.toLowerCase()
            )
        ) {

            return code;
        }
    }


    return null;
}


/* =========================================================
   PARSE CONVERSION
========================================================= */

function parseConversion(text) {

    if (!text) {
        return null;
    }


    const normalized =
        text
            .replace(/,/g, "")
            .trim();


    const amountMatch =
        normalized.match(
            /(?:^|\s)(\d+(?:\.\d+)?)/
        );


    if (!amountMatch) {
        return null;
    }


    const amount =
        Number(
            amountMatch[1]
        );


    if (
        !Number.isFinite(amount)
    ) {

        return null;
    }


    /*
       Examples:

       100 USD to RWF
       50 USD in RWF
       100 dollars to RWF
       200 RWF to USD
    */

    const currencyCodes =
        normalized.match(
            /\b[A-Z]{3}\b/gi
        );


    if (
        currencyCodes &&
        currencyCodes.length >= 2
    ) {

        const from =
            currencyCodes[0]
                .toUpperCase();


        const to =
            currencyCodes[1]
                .toUpperCase();


        if (
            currencyKnowledge[from] &&
            currencyKnowledge[to]
        ) {

            return {
                amount,
                from,
                to
            };
        }
    }


    const lower =
        normalized.toLowerCase();


    const toMatch =
        lower.match(
            /\b(?:to|in|into)\s+(.+)$/
        );


    if (!toMatch) {
        return null;
    }


    const targetText =
        toMatch[1].trim();


    const targetCode =
        findCurrencyCode(
            targetText
        );


    if (!targetCode) {
        return null;
    }


    const targetIndex =
        lower.lastIndexOf(
            targetText
        );


    const beforeTarget =
        lower.slice(
            0,
            targetIndex
        );


    const sourceCode =
        findCurrencyCode(
            beforeTarget
        );


    if (!sourceCode) {
        return null;
    }


    return {
        amount,
        from: sourceCode,
        to: targetCode
    };
}


/* =========================================================
   LIVE CHAT EXCHANGE RATE
========================================================= */

async function getChatRate(
    from,
    to
) {

    if (from === to) {
        return 1;
    }


    /*
       First use the main Convertly
       rate system.
    */

    try {

        const data =
            await getRate(
                from,
                to
            );


        if (
            data &&
            Number.isFinite(
                data.rate
            )
        ) {

            return data.rate;
        }

    } catch (error) {

        console.warn(
            "Main rate system unavailable:",
            error
        );
    }


    /*
       Direct Frankfurter fallback.
    */

    const url =
        `${API}/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;


    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Unable to retrieve exchange rate."
        );
    }


    const data =
        await response.json();


    const exchangeRate =
        Number(
            data.rate
        );


    if (
        !Number.isFinite(
            exchangeRate
        )
    ) {

        throw new Error(
            "Invalid exchange rate."
        );
    }


    return exchangeRate;
}


/* =========================================================
   FORMAT CHAT MONEY
========================================================= */

function formatChatMoney(
    amount
) {

    try {

        return new Intl.NumberFormat(
            undefined,
            {
                maximumFractionDigits: 2
            }
        ).format(amount);

    } catch {

        return Number(
            amount
        ).toFixed(2);
    }
}


/* =========================================================
   CHAT RESPONSE
========================================================= */

async function getChatResponse(
    message
) {

    const text =
        message.trim();


    const lower =
        text.toLowerCase();


    /* -----------------------------------------
       CONVERSION
    ----------------------------------------- */

    const conversion =
        parseConversion(
            text
        );


    if (conversion) {

        const {
            amount,
            from,
            to
        } = conversion;


        try {

            const exchangeRate =
                await getChatRate(
                    from,
                    to
                );


            const converted =
                amount *
                exchangeRate;


            return (
                `${formatChatMoney(amount)} ${from} ` +
                `is approximately ` +
                `${formatChatMoney(converted)} ${to}. ` +
                `The current rate is about ` +
                `1 ${from} = ` +
                `${exchangeRate.toFixed(4)} ${to}.`
            );


        } catch (error) {

            console.error(
                "Chat exchange rate error:",
                error
            );


            return (
                `I couldn't retrieve the live exchange rate ` +
                `for ${from} to ${to}. ` +
                `Please try again in a moment.`
            );
        }
    }


    /* -----------------------------------------
       CURRENCY CODE
    ----------------------------------------- */

    const codeMatch =
        text.match(
            /\b(USD|EUR|GBP|RWF|KES|UGX|TZS|ZAR|NGN|GHS|AED|SAR|CNY|JPY|INR|CAD|AUD|CHF|BRL)\b/i
        );


    if (
        codeMatch &&
        (
            lower.includes("what is") ||
            lower.includes("meaning") ||
            lower.includes("currency") ||
            lower.includes("code")
        )
    ) {

        const code =
            codeMatch[1]
                .toUpperCase();


        const info =
            currencyKnowledge[code];


        if (info) {

            return (
                `${code} is the currency code for ` +
                `${info.name}, used in ${info.country}.`
            );
        }
    }


    /* -----------------------------------------
       COUNTRY CURRENCY
    ----------------------------------------- */

    if (
        lower.includes("currency of") ||
        lower.includes("currency in") ||
        lower.includes("what currency")
    ) {

        for (
            const [country, code]
            of Object.entries(
                countryCurrencies
            )
        ) {

            if (
                lower.includes(country)
            ) {

                const info =
                    currencyKnowledge[code];


                if (info) {

                    return (
                        `The currency of ${country} ` +
                        `is the ${info.name} (${code}).`
                    );
                }
            }
        }
    }


    /* -----------------------------------------
       EXCHANGE RATES
    ----------------------------------------- */

    if (
        lower.includes(
            "how do exchange rates"
        ) ||
        lower.includes(
            "how exchange rates"
        ) ||
        lower.includes(
            "exchange rate work"
        )
    ) {

        return (
            "An exchange rate shows how much of one " +
            "currency is needed to buy another. " +
            "Rates can change because of market conditions, " +
            "interest rates, trade, inflation and other economic factors."
        );
    }


    /* -----------------------------------------
       SUPPORTED CURRENCIES
    ----------------------------------------- */

    if (
        lower.includes(
            "supported currencies"
        ) ||
        lower.includes(
            "which currencies"
        ) ||
        lower.includes(
            "currencies do you support"
        )
    ) {

        const codes =
            Object.keys(
                currencyKnowledge
            ).join(", ");


        return (
            `The assistant currently recognizes these ` +
            `common currencies: ${codes}.`
        );
    }


    /* -----------------------------------------
       HOW TO USE
    ----------------------------------------- */

    if (
        lower.includes(
            "how to use"
        ) ||
        lower.includes(
            "how does this work"
        ) ||
        lower.includes(
            "how can i convert"
        )
    ) {

        return (
            "Enter an amount and currency pair in the " +
            "converter. You can also ask me directly, " +
            "for example: 100 USD to RWF."
        );
    }


    /* -----------------------------------------
       GREETING
    ----------------------------------------- */

    if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower.includes(
            "hello there"
        )
    ) {

        return (
            "Hello. I can help with currency conversions, " +
            "currency codes, countries and exchange-rate questions."
        );
    }


    /* -----------------------------------------
       THANKS
    ----------------------------------------- */

    if (
        lower.includes("thank you") ||
        lower === "thanks"
    ) {

        return (
            "You're welcome. I'm here whenever you need " +
            "currency information."
        );
    }


    /* -----------------------------------------
       HELP
    ----------------------------------------- */

    if (
        lower === "help" ||
        lower.includes(
            "what can you do"
        )
    ) {

        return (
            "I can convert currencies using live exchange-rate " +
            "data, explain currency codes, identify currencies " +
            "by country and explain how exchange rates work. " +
            "Try: 50 USD to RWF."
        );
    }


    /* -----------------------------------------
       FALLBACK
    ----------------------------------------- */

    return (
        "I can help with currency questions and live " +
        "conversions. Try something like " +
        "\"100 USD to RWF\", \"What is EUR?\", or " +
        "\"What is the currency of Japan?\"."
    );
}


/* =========================================================
   SEND CHAT MESSAGE
========================================================= */

async function sendChatMessage(
    message
) {

    const cleanMessage =
        message.trim();


    if (!cleanMessage) {
        return;
    }


    addChatMessage(
        cleanMessage,
        "user"
    );


    if (chatInput) {
        chatInput.value = "";
    }


    if (chatSend) {
        chatSend.disabled = true;
    }


    showTyping();


    try {

        const response =
            await getChatResponse(
                cleanMessage
            );


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    350
                )
        );


        hideTyping();


        addChatMessage(
            response,
            "bot"
        );


    } catch (error) {

        hideTyping();


        addChatMessage(
            "Something went wrong. Please try again.",
            "bot"
        );


        console.error(
            "Currency Assistant:",
            error
        );


    } finally {

        if (chatSend) {
            chatSend.disabled = false;
        }


        if (chatInput) {
            chatInput.focus();
        }
    }
}


/* =========================================================
   CHAT FORM
========================================================= */

if (chatForm) {

    chatForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            if (chatInput) {

                sendChatMessage(
                    chatInput.value
                );
            }
        }
    );
}


/* =========================================================
   QUICK QUESTIONS
========================================================= */

document
    .querySelectorAll(
        "[data-question]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const question =
                    button.dataset.question;


                sendChatMessage(
                    question
                );
            }
        );
    });


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            chatbot &&
            chatbot.classList.contains(
                "open"
            )
        ) {

            closeChat();
        }
    }
);


/* =========================================================
   EVENT LISTENERS
========================================================= */

if (convertButton) {

    convertButton.addEventListener(
        "click",
        convertCurrency
    );
}


if (swapButton) {

    swapButton.addEventListener(
        "click",
        swapCurrencies
    );
}


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            if (fromCurrency) {

                delete rateCache[
                    fromCurrency.value
                ];
            }


            delete rateCache["RWF"];


            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(
                    rateCache
                )
            );


            setStatus(
                "Refreshing exchange rates..."
            );


            await convertCurrency();

            await loadQuickRates();

            await loadComparison();
        }
    );
}


if (fromCurrency) {

    fromCurrency.addEventListener(
        "change",
        () => {

            updateFlags();

            convertCurrency();
        }
    );
}


if (toCurrency) {

    toCurrency.addEventListener(
        "change",
        () => {

            updateFlags();

            convertCurrency();
        }
    );
}


if (amountInput) {

    amountInput.addEventListener(
        "input",
        convertCurrency
    );
}


if (comparisonCurrency) {

    comparisonCurrency.addEventListener(
        "change",
        loadComparison
    );
}


if (comparisonAmount) {

    comparisonAmount.addEventListener(
        "input",
        loadComparison
    );
}


if (copyButton) {

    copyButton.addEventListener(
        "click",
        copyResult
    );
}


if (shareButton) {

    shareButton.addEventListener(
        "click",
        shareResult
    );
}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        toggleTheme
    );
}


window.addEventListener(
    "online",
    () => {

        updateConnectionStatus();

        convertCurrency();
    }
);


window.addEventListener(
    "offline",
    updateConnectionStatus
);


/* =========================================================
   INITIALIZATION
========================================================= */

async function init() {

    if (year) {

        year.textContent =
            new Date().getFullYear();
    }


    loadTheme();

    loadRateCache();

    updateConnectionStatus();


    await loadCurrencies();


    if (
        fromCurrency &&
        toCurrency &&
        currencies &&
        Object.keys(
            currencies
        ).length
    ) {

        await convertCurrency();

        await loadQuickRates();

        await loadComparison();
    }
}


/* =========================================================
   START CONVERTLY
========================================================= */

init();