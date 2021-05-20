const API_KEY =
  "e11e9724d8f5a31459c7915874285eed4641fb210f5f8fef2c0b15e80ecf0107";

const tickerHandlers = new Map();

const loadTickers = () => {
  if (tickerHandlers.size === 0) {
    return;
  }
  return fetch(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
      ...tickerHandlers.keys()
    ].join(",")}&tsyms=USD&api_key=${API_KEY}`
  )
    .then(res => res.json())
    .then(rawData => {
      const updatedPrices = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value.USD])
      );

      Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
        const heandlers = tickerHandlers.get(currency) ?? [];
        heandlers.forEach(fn => fn(newPrice));

        console.log("rawData: ", updatedPrices);
      });
    });
};

export const loadCurencyList = () => {
  return fetch(
    "https://min-api.cryptocompare.com/data/top/totalvolfull?limit=100&tsym=USD"
  ).then(res => res.json());
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickerHandlers.get(ticker) || [];
  tickerHandlers.set(ticker, [...subscribers, cb]);
};

export const unSubscribeToTicker = ticker => {
  tickerHandlers.delete(ticker);
};

setInterval(loadTickers, 5000);
window.tickers = tickerHandlers;
