<template>
  <div>
    <button
      type="button"
      v-if="modelValue > 1"
      @click="decrise"
      class="m-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
    >
      Prev
    </button>
    <button
      type="button"
      v-if="isHaveNextPage"
      @click="incrise"
      class="m-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
    >
      Next
    </button>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Number,
      default: 1
    },
    isHaveNextPage: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    incrise() {
      this.$emit("update:modelValue", this.modelValue + 1);
    },
    decrise() {
      this.$emit("update:modelValue", this.modelValue - 1);
    }
  }
};
</script>
