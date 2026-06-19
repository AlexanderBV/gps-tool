import { computed } from 'vue';

export const useLeafletMarkers = (store) => {
  const markers = computed(() =>
    store.positions.map((position, index) => ({
      id: position.id,
      lat: position.lat,
      lng: position.lng,
      index: index + 1,
      selected: position.id === store.selectedPositionId
    }))
  );

  const handleMapClick = (event) => {
    if (!event?.latlng) return;
    store.addPosition(event.latlng.lat, event.latlng.lng);
  };

  const handleMarkerDragEnd = (positionId, event) => {
    const latlng = event?.target?.getLatLng?.();
    if (!latlng) return;
    store.updatePositionLatLng(positionId, latlng.lat, latlng.lng);
  };

  const handleMarkerClick = (positionId) => {
    store.selectPosition(positionId);
  };

  const deleteSelected = () => {
    if (!store.selectedPositionId) return;
    store.removePosition(store.selectedPositionId);
  };

  const clearAll = () => {
    store.clearPositions();
  };

  return {
    markers,
    handleMapClick,
    handleMarkerDragEnd,
    handleMarkerClick,
    deleteSelected,
    clearAll
  };
};
