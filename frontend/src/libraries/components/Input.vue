<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';

interface Props {
   modelValue: string;
   label?: string;
   placeholder?: string;
   helperText?: string;
   maxLength?: number;
   minLength?: number;
   type?: 'text' | 'email' | 'password' | 'number' | 'tel';
   disabled?: boolean;
   readonly?: boolean;
   required?: boolean;
   error?: boolean;
   errorMessage?: string;
   icon?: string;
   clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
   maxLength: 120,
   minLength: 0,
   type: 'text',
   disabled: false,
   readonly: false,
   required: false,
   error: false,
   clearable: false,
});

const emit = defineEmits<{
   'update:modelValue': [value: string];
   blur: [];
   focus: [];
   clear: [];
}>();

const isFocused = ref(false);

// Validaciones
const validationRules = computed(() => {
   const value = props.modelValue?.trim() || '';

   return {
      minLength: value.length === 0 || value.length >= props.minLength,
      maxLength: value.length <= props.maxLength,
      required: !props.required || value.length > 0,
      email:
         props.type !== 'email' || value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
   };
});

const isValid = computed(() => {
   if (props.error) return false;
   return Object.values(validationRules.value).every((rule) => rule === true);
});

// Estados
const hasError = computed(() => !isValid.value && (props.modelValue?.length || 0) > 0);
const characterCount = computed(() => `${props.modelValue?.length || 0} / ${props.maxLength}`);

// Métodos
const handleInput = (event: Event) => {
   const target = event.target as HTMLInputElement;
   let value = target.value;

   if (value.length > props.maxLength) {
      value = value.slice(0, props.maxLength);
   }

   emit('update:modelValue', value);
};

const handleClear = () => {
   emit('update:modelValue', '');
   emit('clear');
};

const handleFocus = () => {
   isFocused.value = true;
   emit('focus');
};

const handleBlur = () => {
   isFocused.value = false;
   emit('blur');
};

// Obtener icono de validación
const getValidationIcon = computed(() => {
   const value = props.modelValue?.trim() || '';
   if (!value) return null;
   if (hasError.value) return 'mdi:alert-circle';
   if (isValid.value) return 'mdi:check-circle';
   return null;
});

// Obtener color de icono
const getValidationIconColor = computed(() => {
   if (hasError.value) return 'text-red-500';
   if (isValid.value) return 'text-green-500';
   return '';
});
</script>

<template>
   <div class="w-full flex flex-col gap-2">
      <!-- Label -->
      <div v-if="label" class="flex flex-row items-center justify-between">
         <label class="text-sm font-medium text-neutral-900">
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
         </label>
         <span class="text-xs text-neutral-600">{{ characterCount }}</span>
      </div>

      <!-- Input Container -->
      <div
         class="relative flex flex-row items-center gap-2 px-4 py-3 border-2 rounded-lg transition-all duration-200"
         :class="[
            isFocused
               ? 'border-blue-500 bg-blue-50'
               : hasError
                 ? 'border-red-500 bg-red-50'
                 : 'border-neutral-300 bg-white hover:border-neutral-400',
            disabled || readonly ? 'bg-neutral-100 opacity-60 cursor-not-allowed' : 'cursor-text',
         ]"
      >
         <!-- Icon Left -->
         <Icon v-if="icon" :icon="icon" class="w-5 h-5 text-neutral-600 flex-shrink-0" />

         <!-- Input -->
         <input
            :model-value="modelValue"
            :type="type"
            :placeholder="placeholder"
            :maxlength="maxLength"
            :minlength="minLength"
            :disabled="disabled"
            :readonly="readonly"
            :required="required"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            class="flex-1 bg-transparent outline-none text-neutral-900 placeholder-neutral-400 text-sm disabled:cursor-not-allowed"
         />

         <!-- Icons Right -->
         <div class="flex flex-row items-center gap-2">
            <Icon
               v-if="getValidationIcon"
               :icon="getValidationIcon"
               :class="['w-5 h-5 flex-shrink-0 transition-all', getValidationIconColor]"
            />

            <button
               v-if="clearable && modelValue && !disabled && !readonly"
               @click="handleClear"
               class="p-1 rounded hover:bg-neutral-200 active:scale-95 transition-all"
               type="button"
               title="Limpiar"
            >
               <Icon icon="mdi:close" class="w-4 h-4 text-neutral-600" />
            </button>
         </div>
      </div>

      <!-- Helper Text / Error Message -->
      <div v-if="errorMessage || helperText" class="flex flex-row items-start gap-2">
         <Icon
            :icon="hasError ? 'mdi:alert-circle' : 'mdi:information'"
            :class="['w-4 h-4 flex-shrink-0 mt-0.5', hasError ? 'text-red-500' : 'text-blue-500']"
         />
         <p :class="['text-xs', hasError ? 'text-red-600' : 'text-neutral-600']">
            {{ errorMessage || helperText }}
         </p>
      </div>

      <!-- Validation Details -->
      <div v-if="hasError" class="mt-1 text-xs text-neutral-600 space-y-1">
         <div v-if="!validationRules.minLength" class="flex items-center gap-1 text-red-600">
            <Icon icon="mdi:close" class="w-3 h-3" />
            Mínimo {{ minLength }} caracteres
         </div>
         <div v-if="!validationRules.maxLength" class="flex items-center gap-1 text-red-600">
            <Icon icon="mdi:close" class="w-3 h-3" />
            Máximo {{ maxLength }} caracteres
         </div>
         <div v-if="!validationRules.email" class="flex items-center gap-1 text-red-600">
            <Icon icon="mdi:close" class="w-3 h-3" />
            Email inválido
         </div>
         <div v-if="!validationRules.required" class="flex items-center gap-1 text-red-600">
            <Icon icon="mdi:close" class="w-3 h-3" />
            Campo requerido
         </div>
      </div>
   </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
   -webkit-appearance: none;
   margin: 0;
}

input[type='number'] {
   -moz-appearance: textfield;
}

input::placeholder {
   opacity: 0.6;
}
</style>
