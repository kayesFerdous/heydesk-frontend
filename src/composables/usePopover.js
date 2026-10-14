import { ref, watch, onBeforeUnmount } from 'vue';

// A small menu that opens from a button (the account menu, Import): it closes
// on a click outside `root`, on Escape, and when the component goes away.
//
//   const { open, root } = usePopover();
//   <div ref="root"> <button @click="open = !open"> ... <div v-if="open"> </div>
export function usePopover() {
  const open = ref(false);
  const root = ref(null);

  function closeOnOutside(event) {
    if (!root.value?.contains(event.target)) open.value = false;
  }
  function closeOnEscape(event) {
    if (event.key === 'Escape') open.value = false;
  }

  watch(open, (isOpen) => {
    const method = isOpen ? 'addEventListener' : 'removeEventListener';
    document[method]('pointerdown', closeOnOutside);
    document[method]('keydown', closeOnEscape);
  });
  onBeforeUnmount(() => (open.value = false));

  return { open, root };
}
