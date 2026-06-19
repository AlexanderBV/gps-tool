<template>
  <div class="panel-card relative h-full min-h-[420px]">
    <div class="absolute right-4 top-4 z-[500] flex flex-col gap-2">
      <button
        class="rounded-full bg-slate-100 text-slate-900 px-4 py-2 text-xs font-semibold shadow-lg transition hover:-translate-y-0.5 disabled:opacity-40"
        :disabled="!selectedPositionId"
        type="button"
        @click="onDeleteSelected"
      >
        Eliminar seleccionado
      </button>
      <button
        class="rounded-full border border-slate-200/40 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-100 shadow-lg backdrop-blur transition hover:-translate-y-0.5 disabled:opacity-40"
        :disabled="!markers.length"
        type="button"
        @click="onClearAll"
      >
        Limpiar todos
      </button>
    </div>

    <LMap
      class="h-full w-full rounded-2xl overflow-hidden"
      :zoom="zoom"
      :center="center"
      @click="onMapClick"
    >
      <LTileLayer
        url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        :subdomains="['mt0', 'mt1', 'mt2', 'mt3']"
        attribution="&copy; <a href='https://www.google.com/maps'>Google Maps</a>"
      />
      <LMarker
        v-for="marker in markers"
        :key="marker.id"
        :lat-lng="[marker.lat, marker.lng]"
        :draggable="true"
        :z-index-offset="marker.selected ? 500 : 0"
        @click="() => onMarkerClick(marker.id)"
        @dragend="(event) => onMarkerDragEnd(marker.id, event)"
      >
        <LTooltip
          :options="{
            permanent: true,
            direction: 'center',
            className: marker.selected ? 'marker-label marker-label--selected' : 'marker-label'
          }"
        >
          {{ marker.index }}
        </LTooltip>
      </LMarker>
    </LMap>
  </div>
</template>

<script setup>
import { LMap, LTileLayer, LMarker, LTooltip } from '@vue-leaflet/vue-leaflet';

defineProps({
  center: {
    type: Array,
    required: true
  },
  zoom: {
    type: Number,
    default: 13
  },
  markers: {
    type: Array,
    default: () => []
  },
  selectedPositionId: {
    type: String,
    default: null
  },
  onMapClick: {
    type: Function,
    required: true
  },
  onMarkerDragEnd: {
    type: Function,
    required: true
  },
  onMarkerClick: {
    type: Function,
    required: true
  },
  onDeleteSelected: {
    type: Function,
    required: true
  },
  onClearAll: {
    type: Function,
    required: true
  }
});
</script>
