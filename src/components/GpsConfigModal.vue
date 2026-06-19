<template>
  <div class="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4">
    <div class="absolute inset-0" @click="emit('close')"></div>

    <div class="panel-card relative z-10 w-full max-w-lg p-6">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Configuración</p>
          <h2 class="text-lg font-semibold">API GPS</h2>
        </div>
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:-translate-y-0.5"
          type="button"
          @click="emit('close')"
          title="Cerrar"
          aria-label="Cerrar"
        >
          <XMarkIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Formulario -->
      <form class="mt-5 space-y-4" @submit.prevent="handleSave">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300" for="gps-url">
            URL de la API
          </label>
          <input
            id="gps-url"
            v-model="form.apiUrl"
            class="rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:ring-1"
            :class="errors.apiUrl
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-700 focus:ring-sky-500'"
            type="url"
            placeholder="https://example.com/api/gps"
            autocomplete="off"
          />
          <p v-if="errors.apiUrl" class="text-[11px] text-rose-400">{{ errors.apiUrl }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-slate-300" for="gps-token">
            Token de la API
          </label>
          <div class="relative">
            <input
              id="gps-token"
              v-model="form.apiToken"
              class="w-full rounded-lg border bg-slate-950 px-3 py-2 pr-10 text-sm text-slate-100 outline-none transition focus:ring-1"
              :class="errors.apiToken
                ? 'border-rose-500 focus:ring-rose-500'
                : 'border-slate-700 focus:ring-sky-500'"
              :type="showToken ? 'text' : 'password'"
              placeholder="Bearer token"
              autocomplete="off"
            />
            <button
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
              type="button"
              :title="showToken ? 'Ocultar token' : 'Mostrar token'"
              @click="showToken = !showToken"
            >
              <EyeSlashIcon v-if="showToken" class="h-4 w-4" aria-hidden="true" />
              <EyeIcon v-else class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p v-if="errors.apiToken" class="text-[11px] text-rose-400">{{ errors.apiToken }}</p>
        </div>

        <!-- Acciones -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            class="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5"
            type="button"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            class="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
            type="submit"
          >
            Guardar
          </button>
        </div>
      </form>

      <!-- Info de fallback -->
      <p class="mt-4 text-[11px] text-slate-500">
        La configuración se guarda localmente en el navegador. Si no hay configuración guardada,
        se usan los valores del archivo <code class="text-slate-400">.env</code>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { EyeIcon, EyeSlashIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  initialUrl: {
    type: String,
    default: ''
  },
  initialToken: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  apiUrl: props.initialUrl,
  apiToken: props.initialToken
});

const errors = reactive({
  apiUrl: '',
  apiToken: ''
});

const showToken = ref(false);

const validate = () => {
  errors.apiUrl = '';
  errors.apiToken = '';

  if (!form.apiUrl.trim()) {
    errors.apiUrl = 'La URL es requerida.';
  }

  if (!form.apiToken.trim()) {
    errors.apiToken = 'El token es requerido.';
  }

  return !errors.apiUrl && !errors.apiToken;
};

const handleSave = () => {
  if (!validate()) return;
  emit('save', form.apiUrl.trim(), form.apiToken.trim());
};
</script>
