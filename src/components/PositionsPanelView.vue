<template>
  <div class="flex h-full flex-col gap-6">
    <section class="panel-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">GPS Simulator</p>
          <h1 class="text-2xl font-semibold">Envío interactivo de posiciones</h1>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-400"
            type="button"
            @click="emit('open-config')"
            title="Configurar API GPS"
            aria-label="Configurar API GPS"
          >
            <Cog6ToothIcon class="h-4 w-4" aria-hidden="true" />
            <span
              class="pointer-events-none absolute bottom-full right-0 mb-2 rounded bg-slate-900 px-2 py-1 text-[10px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100 whitespace-nowrap"
            >
              Configurar API GPS
            </span>
          </button>
          <div class="text-right text-xs text-slate-300">
            <div class="font-semibold">Unix: {{ nowUnix }}</div>
            <div>{{ nowHuman }}</div>
          </div>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1 text-xs text-slate-300">
          Intervalo (s)
          <input
            class="w-28 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            type="number"
            min="1"
            :value="intervalSeconds"
            @input="emit('update-interval', Number($event.target.value))"
          />
        </label>

        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-40"
            type="button"
            :disabled="!hasPositions || (isRunning && !isPaused)"
            @click="emit('start')"
          >
            Start
          </button>
          <button
            class="rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-40"
            type="button"
            :disabled="!isRunning"
            @click="emit('pause')"
          >
            Pause
          </button>
          <button
            class="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
            type="button"
            :disabled="!isRunning && !hasPositions"
            @click="emit('stop')"
          >
            Stop
          </button>
        </div>

        <div class="ml-auto text-xs text-slate-400">
          <span v-if="isSending">Enviando...</span>
          <span v-else-if="isPaused">Pausado</span>
          <span v-else-if="isRunning">Ejecutando</span>
          <span v-else>Detenido</span>
        </div>
      </div>
    </section>

    <section class="panel-card p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">Defaults globales</h2>
          <p class="text-xs text-slate-400">
            Nuevos puntos heredan estos valores. Puedes sobrescribirlos por punto.
          </p>
        </div>
        <button
          class="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5"
          type="button"
          :disabled="!hasPositions"
          @click="emit('apply-defaults')"
        >
          Aplicar defaults a todos
        </button>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label
          v-for="field in defaultsFields"
          :key="field.key"
          class="flex flex-col gap-1 text-xs text-slate-300"
        >
          {{ field.label }}
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            :type="field.type"
            :step="field.step"
            :value="defaults[field.key]"
            @input="emit('update-default', field.key, $event.target.value)"
          />
        </label>
      </div>
    </section>

    <section class="panel-card p-6">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold">Posiciones</h2>
        <button
          class="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5"
          type="button"
          :disabled="!hasPositions"
          @click="emit('clear-positions')"
        >
          Limpiar todos
        </button>
      </div>

      <div class="mt-3 overflow-x-auto">
        <table class="positions-table table-fixed w-full text-left text-[10px] leading-4 text-slate-200">
          <thead class="text-[9px] uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th class="w-6 py-1 px-1.5">#</th>
              <th class="w-20 py-1 px-0.5" title="Latitud">Lat.</th>
              <th class="w-20 py-1 px-0.5" title="Longitud">Long.</th>
              <th class="w-14 py-1 px-1.5" title="Placa">Placa</th>
              <th class="w-10 py-1 px-1.5" title="Velocidad">Vel.</th>
              <th class="w-12 py-1 px-1.5" title="Odómetro">Odo.</th>
              <th class="w-10 py-1 px-1.5" title="Código HTTP">Cód.</th>
              <th class="w-16 py-1 pr-0.5 pl-1" title="Enviado">Env.</th>
              <th class="w-12 py-1 pl-1 pr-2" title="Estado">Est.</th>
              <th class="w-14 py-1 pl-2 pr-1 text-right" title="Acciones">Acc.</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="position in positions" :key="position.id">
              <tr
                class="relative cursor-pointer border-t border-slate-800/60 transition hover:bg-slate-900/50"
                :class="position.id === selectedPositionId ? 'is-selected bg-slate-900/80' : ''"
                @click="emit('select-position', position.id)"
              >
              <td class="px-1.5 py-1 font-semibold tabular-nums">
                {{ position.index }}
              </td>
              <td
                class="px-0.5 py-1 font-mono text-[9px] tabular-nums tracking-tight"
                :title="formatCoordinate(position.lat, 9)"
              >
                {{ formatCoordinate(position.lat, 9) }}
              </td>
              <td
                class="px-0.5 py-1 font-mono text-[9px] tabular-nums tracking-tight"
                :title="formatCoordinate(position.lng, 9)"
              >
                {{ formatCoordinate(position.lng, 9) }}
              </td>
              <td class="px-1.5 py-1">{{ position.effectivePlate }}</td>
              <td class="px-1.5 py-1 tabular-nums">
                {{ position.effectiveVelocity }}
              </td>
              <td class="px-1.5 py-1 tabular-nums">
                {{ position.effectiveOdometer }}
              </td>
              <td class="px-1.5 py-1">
                <span
                  class="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold"
                  :class="statusCodeClasses(position.statusCode)"
                >
                  {{ position.statusCode ?? '—' }}
                </span>
              </td>
              <td class="pr-0.5 pl-1 py-1">
                <div v-if="position.sentAtUnix">
                  <div class="text-[10px]">{{ position.sentAtHuman }}</div>
                  <div class="text-[9px] text-slate-400">{{ position.sentAtUnix }}</div>
                </div>
                <div v-else-if="position.countdownSeconds !== null" class="text-amber-300">
                  En {{ formatCountdown(position.countdownSeconds) }}
                </div>
                <div v-else-if="position.status === 'SENDING'" class="text-amber-300">
                  Enviando...
                </div>
                <div v-else class="text-slate-500">—</div>
              </td>
              <td class="pl-1 pr-4 py-1">
                <div class="flex flex-col gap-1">
                  <span
                    class="rounded-full px-2 py-0.5 text-[9px] font-semibold w-fit"
                    :class="statusClasses[position.status]"
                  >
                    {{ position.status }}
                  </span>
                  <span
                    v-if="position.status === 'FAILED' && position.statusInfo"
                    class="max-w-[9rem] truncate text-[9px] text-rose-300 cursor-help"
                    :title="position.statusInfo"
                  >
                    {{ position.statusInfo }}
                  </span>
                </div>
              </td>
              <td class="pl-2 pr-1 py-1 text-right">
                <div class="inline-flex items-center gap-0.5 rounded-full border border-slate-700/80 bg-slate-950/50 p-0.5">
                  <button
                    class="group relative inline-flex h-5 w-5 items-center justify-center rounded-full text-sky-300 transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:opacity-30"
                    type="button"
                    :disabled="!position.lastRequestPayload && !position.lastResponse"
                    @click.stop="emit('open-details', position.id)"
                    title="Ver detalles"
                    aria-label="Ver detalles"
                  >
                    <EyeIcon class="h-4 w-4" aria-hidden="true" />
                    <span
                      class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100"
                    >
                      Ver detalles
                    </span>
                  </button>
                  <button
                    class="group relative inline-flex h-5 w-5 items-center justify-center rounded-full text-emerald-300 transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:opacity-30"
                    type="button"
                    :disabled="!position.canSendNow"
                    @click.stop="emit('send-now', position.id)"
                    title="Enviar ahora"
                    aria-label="Enviar ahora"
                  >
                    <PaperAirplaneIcon class="h-4 w-4" aria-hidden="true" />
                    <span
                      class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100"
                    >
                      Enviar ahora
                    </span>
                  </button>
                  <button
                    class="group relative inline-flex h-5 w-5 items-center justify-center rounded-full text-rose-300 transition hover:-translate-y-0.5 hover:bg-slate-900"
                    type="button"
                    @click.stop="emit('remove-position', position.id)"
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <TrashIcon class="h-4 w-4" aria-hidden="true" />
                    <span
                      class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100"
                    >
                      Eliminar
                    </span>
                  </button>
                </div>
              </td>
              </tr>
            </template>
            <tr v-if="!positions.length">
              <td class="py-4 text-center text-slate-500" colspan="10">
                Haz clic en el mapa para agregar posiciones.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel-card p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold">Detalle del punto</h2>
          <p class="text-xs text-slate-400">
            {{ selectedIndex ? `Punto #${selectedIndex}` : 'Selecciona un punto en el mapa o la lista.' }}
          </p>
        </div>
        <button
          class="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5"
          type="button"
          :disabled="!selectedPosition"
          @click="emit('reset-selected-overrides')"
        >
          Reset overrides
        </button>
      </div>

      <div v-if="selectedPosition" class="mt-4 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-xs text-slate-300">
            Lat
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              type="number"
              step="0.000001"
              :value="selectedPosition.lat"
              @input="emit('update-selected-lat', $event.target.value)"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-300">
            Lng
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              type="number"
              step="0.000001"
              :value="selectedPosition.lng"
              @input="emit('update-selected-lng', $event.target.value)"
            />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label
            v-for="field in fields"
            :key="field.key"
            class="flex flex-col gap-1 text-xs text-slate-300"
          >
            <div class="flex items-center justify-between">
              <span>{{ field.label }}</span>
              <span class="text-[10px] text-slate-500">
                {{ overriddenKeys.includes(field.key) ? 'Override' : 'Default' }}
              </span>
            </div>
            <input
              class="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              :type="field.type"
              :step="field.step"
              :value="selectedEffective[field.key]"
              @input="emit('update-selected-override', field.key, $event.target.value)"
            />
          </label>
        </div>

        <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Última request / response
          </h3>
          <div class="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-[11px] font-semibold text-slate-300">Request</p>
              <pre class="mt-2 whitespace-pre-wrap text-[11px] text-slate-200">{{
                formatJson(selectedPosition.lastRequestPayload)
              }}</pre>
            </div>
            <div>
              <p class="text-[11px] font-semibold text-slate-300">Response</p>
              <pre class="mt-2 whitespace-pre-wrap text-[11px] text-slate-200">{{
                formatResponse(selectedPosition.lastResponse)
              }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="mt-4 text-sm text-slate-500">
        Ningún punto seleccionado.
      </div>
    </section>
  </div>

  <div
    v-if="detailsPosition"
    class="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4"
  >
    <div class="absolute inset-0" @click="emit('close-details')"></div>
    <div class="panel-card relative z-10 w-full max-w-4xl p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Detalle de envío</p>
          <h3 class="text-lg font-semibold">
            Punto #{{ detailsPosition.index ?? detailsPosition.id.slice(0, 6) }}
          </h3>
        </div>
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:-translate-y-0.5"
          type="button"
          @click="emit('close-details')"
          title="Cerrar"
          aria-label="Cerrar"
        >
          <XMarkIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Banner de error -->
      <div
        v-if="detailsPosition.status === 'FAILED' && detailsPosition.statusInfo"
        class="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"
      >
        <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-rose-300">
            Error de envío
          </p>
          <p class="mt-1 text-[11px] leading-relaxed text-rose-200/90">
            {{ detailsPosition.statusInfo }}
          </p>
        </div>
      </div>

      <div class="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold uppercase text-slate-900">
            POST
          </span>
          <span class="text-xs text-slate-200 break-all">
            {{ apiUrl || 'URL no configurada' }}
          </span>
        </div>
        <pre class="mt-4 whitespace-pre-wrap text-[11px] text-slate-200">{{
          formatJson(detailsPosition.lastRequestPayload)
        }}</pre>
      </div>

      <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Response
          </span>
          <span class="text-xs text-slate-200">
            HTTP {{ detailsPosition.statusCode ?? detailsPosition.lastResponse?.status ?? '—' }}
          </span>
        </div>
        <pre class="mt-3 whitespace-pre-wrap text-[11px] text-slate-200">{{
          formatResponse(detailsPosition.lastResponse)
        }}</pre>
      </div>

      <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Curl (sin token)
          </span>
          <button
            class="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-[11px] font-semibold text-slate-100 transition hover:-translate-y-0.5 disabled:opacity-40"
            type="button"
            :disabled="!curlSnippet"
            @click="copyCurl"
          >
            <ClipboardIcon v-if="!copied" class="h-4 w-4" aria-hidden="true" />
            <CheckIcon v-else class="h-4 w-4 text-emerald-300" aria-hidden="true" />
            {{ copied ? 'Copiado' : 'Copiar curl' }}
          </button>
        </div>
        <pre class="mt-3 whitespace-pre-wrap break-all text-[11px] text-slate-200">
{{ curlSnippet || 'URL no configurada.' }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  ClipboardIcon,
  CheckIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';

const emit = defineEmits([
  'start',
  'pause',
  'stop',
  'update-interval',
  'select-position',
  'remove-position',
  'clear-positions',
  'update-default',
  'apply-defaults',
  'update-selected-lat',
  'update-selected-lng',
  'update-selected-override',
  'reset-selected-overrides',
  'open-details',
  'close-details',
  'send-now',
  'open-config'
]);

const formatCoordinate = (value, decimals = 6) => Number(value).toFixed(decimals);
const formatCountdown = (value) => {
  const total = Math.max(0, Math.floor(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const formatJson = (value) => {
  if (!value) return 'Sin datos.';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatResponse = (response) => {
  if (!response) return 'Sin datos.';
  if (response.bodyJson) {
    return JSON.stringify(response.bodyJson, null, 2);
  }
  if (response.bodyText) {
    return response.bodyText;
  }
  return 'Sin datos.';
};

const statusCodeClasses = (code) => {
  if (!code) return 'border-slate-800 bg-slate-900/70 text-slate-400';
  if (code >= 200 && code < 300) return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300';
  if (code >= 300 && code < 400) return 'border-sky-400/40 bg-sky-400/10 text-sky-300';
  if (code >= 400 && code < 500) return 'border-amber-400/40 bg-amber-400/10 text-amber-300';
  return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
};

const props = defineProps({
  nowUnix: {
    type: Number,
    required: true
  },
  nowHuman: {
    type: String,
    required: true
  },
  intervalSeconds: {
    type: Number,
    required: true
  },
  isRunning: {
    type: Boolean,
    required: true
  },
  isPaused: {
    type: Boolean,
    required: true
  },
  isSending: {
    type: Boolean,
    required: true
  },
  hasPositions: {
    type: Boolean,
    required: true
  },
  positions: {
    type: Array,
    default: () => []
  },
  selectedPositionId: {
    type: String,
    default: null
  },
  selectedIndex: {
    type: Number,
    default: null
  },
  selectedPosition: {
    type: Object,
    default: null
  },
  selectedEffective: {
    type: Object,
    default: () => ({})
  },
  overriddenKeys: {
    type: Array,
    default: () => []
  },
  defaults: {
    type: Object,
    default: () => ({})
  },
  fields: {
    type: Array,
    default: () => []
  },
  defaultsFields: {
    type: Array,
    default: () => []
  },
  statusClasses: {
    type: Object,
    default: () => ({})
  },
  detailsPosition: {
    type: Object,
    default: null
  },
  apiUrl: {
    type: String,
    default: ''
  }
});

const escapeSingleQuotes = (value) => String(value).replace(/'/g, "'\\''");

const buildCurlSnippet = (url, payload) => {
  if (!url) return '';
  const parts = [`curl -X POST '${escapeSingleQuotes(url)}'`, "-H 'Content-Type: application/json'"];
  if (payload) {
    const serialized = JSON.stringify(payload);
    parts.push(`-d '${escapeSingleQuotes(serialized)}'`);
  }
  return parts.join(' \\\n  ');
};

const copied = ref(false);

const curlSnippet = computed(() =>
  props.detailsPosition ? buildCurlSnippet(props.apiUrl, props.detailsPosition.lastRequestPayload) : ''
);

const copyCurl = async () => {
  if (!curlSnippet.value) return;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(curlSnippet.value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = curlSnippet.value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    copied.value = false;
  }
};
</script>
