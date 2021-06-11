<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <v-loader v-if="loading" />

    <div class="container">
      <div class="w-full my-4"></div>
      <section>
        <div class="flex">
          <div class="max-w-xs">
            <label for="wallet" class="block text-sm font-medium text-gray-700">
              Тикер
            </label>
            <div class="mt-1 relative rounded-md shadow-md">
              <input
                type="text"
                name="wallet"
                v-model="ticker"
                @keydown.enter="addTicker"
                @keydown.delete="tickerExist = false"
                id="wallet"
                class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                placeholder="Например DOGE"
              />
            </div>
            <div
              v-if="tips.length"
              class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
            >
              <span
                v-for="(tip, ind) in tips"
                :key="tip + ind"
                @click="autoFillHandler(tip)"
                class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
              >
                {{ tip }}
              </span>
            </div>
            <div v-if="tickerExist" class="text-sm text-red-600">
              Такой тикер уже добавлен
            </div>
          </div>
        </div>
        <button
          v-if="!!ticker"
          type="button"
          @click="addTicker"
          class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <!-- Heroicon name: solid/mail -->
          <svg
            class="-ml-0.5 mr-2 h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="#ffffff"
          >
            <path
              d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            ></path>
          </svg>
          Добавить
        </button>
      </section>

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div class="flex justify-between items-center">
          <div>
            <button
              type="button"
              v-if="page > 1"
              @click="page = page - 1"
              class="m-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Prev
            </button>
            <button
              type="button"
              v-if="isHaveNextPage"
              @click="page = page + 1"
              class="m-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Next
            </button>
          </div>
          <div>Фильтр: <input v-model="filter" /></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />

        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <!-- Tickers (active with border-4 -->
          <div
            v-for="item in paginatedTickers"
            :key="item.name"
            @click="select(item)"
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            :class="{ 'border-4': selectedTicker === item }"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ item.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ item.value }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="deleteTicker(item)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>

        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <!-- chart -->
      <v-graph
        :graph-arr="graph"
        :ticker="selectedTicker"
        v-if="selectedTicker"
        @close-graph="electedTicker = null"
      />
    </div>
  </div>
</template>

<script>
import { loadCurencyList, subscribeToTicker, unSubscribeToTicker } from "./api";
import vGraph from "./components/v-graph.vue";
import vLoader from "./components/v-loader.vue";
export default {
  components: { vLoader, vGraph },
  name: "App",

  data: () => ({
    loading: true,
    ticker: "",
    tickers: [],
    selectedTicker: null,
    graph: [],
    tips: [],
    curencies: [],
    tickerExist: false,
    filter: "",
    page: 1,
    tickersOnPage: 3
  }),
  computed: {
    isHaveNextPage() {
      return this.filteredTickers.length > this.endT;
    },
    startT() {
      return this.tickersOnPage * (this.page - 1);
    },
    endT() {
      return this.tickersOnPage * this.page;
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startT, this.endT);
    },
    filteredTickers() {
      return this.tickers.filter(i =>
        i.name.includes(this.filter.toUpperCase())
      );
    },

    pageOptions() {
      return {
        filter: this.filter,
        page: this.page
      };
    }
  },
  watch: {
    selectedTicker() {
      this.graph = [];
    },
    paginatedTickers() {
      if (this.paginatedTickers.length == 0 && this.page > 1) {
        this.page -= 1;
      }
    },
    ticker() {
      if (this.ticker !== "") {
        this.ticker = this.ticker.toUpperCase();
        this.tips = this.curencies
          .filter(i => i.includes(this.ticker))
          .slice(0, 4);
      } else {
        this.tips = [];
      }
    },
    tickers() {
      localStorage.setItem("tickers", JSON.stringify(this.tickers));
    },
    filter() {
      this.page = 1;
    },
    pageOptions(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      );
    }
  },
  async created() {
    const cur = await loadCurencyList();
    this.curencies = cur.Data.map(i => i.CoinInfo.Name);

    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = windowData.page;
    }

    const dataFromLocal = localStorage.getItem("tickers");
    if (dataFromLocal) {
      this.tickers = JSON.parse(dataFromLocal);
      this.tickers.forEach(ticker => {
        //this.subscribeToUpdates(tiker.name);
        subscribeToTicker(ticker.name, price => {
          this.updateTicker(ticker.name, price);
          console.log("price: ", ticker.name, " ", price);
        });
      });
    }
    this.loading = false;
  },
  methods: {
    updateTicker(tickerName, price) {
      this.tickers
        .filter(t => t.name === tickerName)
        .forEach(t => (t.value = price));
      if (this.selectedTicker?.name === tickerName) {
        this.graph.push(price);
      }
    },
    subscribeToUpdates() {
      // setInterval(async () => {
      //   const exchangeData = await loadTicker(tickerName);
      //   this.tickers.find(t => t.name === tickerName).value =
      //     exchangeData.USD > 1
      //       ? exchangeData.USD.toFixed(2)
      //       : exchangeData.USD.toPrecision(2);
      //   if (this.selectedTicker?.name === tickerName) {
      //     this.graph.push(exchangeData.USD);
      //   }
      // }, 5000);
    },
    addTicker() {
      //if (this.curencies.find(this.ticker)) return
      const curentTicker = { name: this.ticker.toUpperCase(), value: "-" };
      this.tickers = [...this.tickers, curentTicker];

      //this.subscribeToUpdates(curentTicker.name);
      subscribeToTicker(curentTicker.name, price => {
        this.updateTicker(curentTicker.name, price);
      });

      this.ticker = "";
      this.filter = "";
    },
    autoFillHandler(t) {
      this.ticker = t.toUpperCase();
      const exist = this.tickers.filter(i => i.name === this.ticker).length;
      if (exist > 0) {
        this.tickerExist = true;
        return;
      } else {
        this.tips = [];
        this.addTicker();
      }
    },
    select(ticker) {
      this.selectedTicker === ticker
        ? (this.selectedTicker = null)
        : (this.selectedTicker = ticker);
    },
    deleteTicker(ticker) {
      this.tickers = this.tickers.filter(t => t !== ticker);
      if (this.selectedTicker == ticker) this.selectedTicker = null;
      unSubscribeToTicker(ticker.name);
    }
  }
};
</script>
