const API_KEY =
  "e11e9724d8f5a31459c7915874285eed4641fb210f5f8fef2c0b15e80ecf0107";
const AGGREGATE_INDEX = "5";

const tickerHandlers = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

socket.addEventListener("message", e => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  );
  if (type !== AGGREGATE_INDEX) {
    return;
  }
  const heandlers = tickerHandlers.get(currency) ?? [];
  heandlers.forEach(fn => fn(newPrice));
  console.log("e: ", e);
});

export const loadCurencyList = () => {
  return fetch(
    "https://min-api.cryptocompare.com/data/top/totalvolfull?limit=100&tsym=USD"
  ).then(res => res.json());
};

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }
  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWS(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

function unsubscribeFromTickerOnWS(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickerHandlers.get(ticker) || [];
  tickerHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWS(ticker);
};

export const unSubscribeToTicker = ticker => {
  tickerHandlers.delete(ticker);
  unsubscribeFromTickerOnWS(ticker);
};

window.tickers = tickerHandlers;
