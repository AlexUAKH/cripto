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
          />
          <!-- <div
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
          </div> -->
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
