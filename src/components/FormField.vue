<script setup lang="ts">
// FormField 用 props 接收欄位設定，讓登入/註冊類型的表單可以逐步共用同一個輸入元件。
defineProps({
  label: {
    type: String,
    required: true
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  autocomplete: {
    type: String,
    default: ''
  }
});

// emit update:modelValue 搭配父層 v-model，讓元件只負責輸入，不決定業務驗證規則。
const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input
      :name="name"
      :type="type"
      :autocomplete="autocomplete"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>
