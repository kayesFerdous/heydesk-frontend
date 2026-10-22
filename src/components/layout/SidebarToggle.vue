<template>
  <!-- Folds or unfolds the desktop sidebar, from the canvas beside the page
       title ([ on the keyboard does the same). Phones use the drawer instead. -->
  <button
    type="button"
    class="btn btn-secondary btn-sm btn-icon hidden shrink-0 md:inline-flex"
    :aria-label="label"
    :title="`${label}  [`"
    aria-keyshortcuts="["
    :aria-expanded="!ui.sidebarCollapsed"
    @click="ui.sidebarCollapsed = !ui.sidebarCollapsed"
  >
    <PhSidebarSimple :size="18"></PhSidebarSimple>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PhSidebarSimple } from '@phosphor-icons/vue';

import { useUiStore } from '../../stores/ui.js';

const { t } = useI18n();
const ui = useUiStore();
const label = computed(() => (ui.sidebarCollapsed ? t('shell.expand') : t('shell.collapse')));
</script>
