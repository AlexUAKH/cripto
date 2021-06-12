<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <v-loader v-if="loading" />

    <div class="container">
      <div class="w-full my-4"></div>
      <v-ticker-input :tickers="tickers" @add-ticker="addTicker($event)" />

      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div class="flex justify-between items-center">
          <v-pagination v-model="page" :isHaveNextPage="isHaveNextPage" />

          <div>Фильтр: <input v-model="filter" /></div>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />

        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <!-- Tickers (active with border-4 -->
          <v-ticker-list-item
            :selectedTicker="selectedTicker"
            :paginatedTickers="paginatedTickers"
            @delete-ticker="deleteTicker"
            @select-ticker="selectTicker"
          />
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
import { subscribeToTicker, unSubscribeToTicker } from "./api";
import vGraph from "./components/v-graph.vue";
import vLoader from "./components/v-loader.vue";
import vPagination from "./components/v-pagination.vue";
import vTickerInput from "./components/v-ticker-input.vue";
import vTickerListItem from "./components/v-ticker-list-item.vue";
export default {
  components: { vLoader, vGraph, vPagination, vTickerInput, vTickerListItem },
  name: "App",

  data: () => ({
    loading: true,
    tickers: [],
    selectedTicker: null,
    graph: [],
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
  created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = Number(windowData.page);
    }

    const dataFromLocal = localStorage.getItem("tickers");
    if (dataFromLocal) {
      this.tickers = JSON.parse(dataFromLocal);
      this.tickers.forEach(ticker => {
        //this.subscribeToUpdates(tiker.name);
        subscribeToTicker(ticker.name, price => {
          this.updateTicker(ticker.name, price);
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
    addTicker(tickerName) {
      //if (this.curencies.find(this.ticker)) return
      const curentTicker = { name: tickerName.toUpperCase(), value: "-" };
      this.tickers = [...this.tickers, curentTicker];

      //this.subscribeToUpdates(curentTicker.name);
      subscribeToTicker(curentTicker.name, price => {
        this.updateTicker(curentTicker.name, price);
      });

      this.filter = "";
    },
    selectTicker(ticker) {
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
