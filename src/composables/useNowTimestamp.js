import { onMounted, onUnmounted, ref } from 'vue';
import { formatUnixTimestamp } from '../domain/formatTimestamp';

export const useNowTimestamp = () => {
  const nowUnix = ref(Math.floor(Date.now() / 1000));
  const nowHuman = ref(formatUnixTimestamp(nowUnix.value));
  let timerId;

  const updateNow = () => {
    nowUnix.value = Math.floor(Date.now() / 1000);
    nowHuman.value = formatUnixTimestamp(nowUnix.value);
  };

  onMounted(() => {
    updateNow();
    timerId = setInterval(updateNow, 1000);
  });

  onUnmounted(() => {
    if (timerId) clearInterval(timerId);
  });

  return {
    nowUnix,
    nowHuman
  };
};
