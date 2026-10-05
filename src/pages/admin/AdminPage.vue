<template>
  <section class="flex flex-col">
    <header class="px-5 pt-6 sm:px-8 sm:pt-8">
      <h1 class="text-[1.75rem] font-semibold tracking-tight">Admin</h1>
      <p class="mt-1 text-ink-soft">Every business on HeyDesk.</p>

      <div class="mt-6 flex gap-6 overflow-x-auto border-b border-hairline" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="t.id === tab"
          class="tab-button"
          :class="{ 'tab-button-active': t.id === tab }"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>
    </header>

    <p v-if="error" class="px-5 py-8 text-sm sm:px-8" role="alert">
      <span class="text-danger">{{ error }}</span>
      <button type="button" class="ml-2 font-semibold text-brand hover:underline" @click="load">Try again</button>
    </p>

    <skeleton-rows v-else-if="!loaded" class="mt-2"></skeleton-rows>

    <!-- Businesses -->
    <div v-else-if="tab === 'businesses'">
      <div
        v-for="b in businesses"
        :key="b.id"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-hairline px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_8rem_9rem] sm:px-8"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-navy">{{ b.name }}</p>
          <p class="truncate text-sm text-ink-soft">{{ b.owner_email || 'No owner' }}</p>
        </div>
        <p class="hidden text-sm text-ink-soft sm:block">{{ b.preset || 'No agent yet' }}</p>
        <p class="hidden text-sm sm:block">{{ b.conversations }} {{ b.conversations === 1 ? 'chat' : 'chats' }}</p>
        <span class="chip justify-self-start" :class="b.status === 'active' ? 'bg-success-tint text-success' : 'bg-attention-tint text-attention'">
          {{ b.status === 'active' ? 'Active' : 'Suspended' }}
        </span>
        <div class="col-span-2 sm:col-span-1 sm:text-right">
          <span v-if="confirmingId === b.id" class="flex items-center gap-2 sm:justify-end">
            <button type="button" class="btn !h-9" :class="b.status === 'active' ? 'btn-danger' : 'btn-primary'" @click="toggleStatus(b)">
              {{ b.status === 'active' ? 'Suspend' : 'Reactivate' }}
            </button>
            <button type="button" class="btn btn-secondary !h-9" @click="confirmingId = null">Keep as is</button>
          </span>
          <button v-else type="button" class="btn btn-quiet !h-9 !px-3" @click="confirmingId = b.id">
            {{ b.status === 'active' ? 'Suspend' : 'Reactivate' }}
          </button>
        </div>
      </div>
      <p v-if="!businesses.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">No businesses yet.</p>
    </div>

    <!-- Owners -->
    <div v-else-if="tab === 'owners'">
      <div
        v-if="temporary"
        class="mx-5 mt-5 rounded-[var(--radius-control)] bg-brand-tint px-4 py-3 text-sm sm:mx-8"
        role="status"
      >
        <p class="font-semibold">New password for {{ temporary.email }}</p>
        <p class="mt-1">
          <code class="rounded bg-surface px-2 py-0.5 font-semibold select-all">{{ temporary.password }}</code>
        </p>
        <p class="mt-1 text-ink-soft">Shown once. Send it to them, and ask them to change it.</p>
      </div>
      <div
        v-for="u in users"
        :key="u.id"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-hairline px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_14rem_9rem] sm:px-8"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-navy">{{ u.email }}</p>
          <p class="truncate text-sm text-ink-soft sm:hidden">{{ u.business_name || 'HeyDesk admin' }}</p>
        </div>
        <p class="hidden truncate text-sm text-ink-soft sm:block">{{ u.business_name || 'HeyDesk admin' }}</p>
        <div class="text-right">
          <button
            v-if="u.role === 'owner'"
            type="button"
            class="btn btn-quiet !h-9 !px-3"
            :disabled="resettingId === u.id"
            @click="reset(u)"
          >
            Reset password
          </button>
          <span v-else class="chip bg-wash text-ink-soft">Admin</span>
        </div>
      </div>
    </div>

    <!-- Activity -->
    <div v-else>
      <div v-for="group in auditGroups" :key="group.label">
        <h2 class="px-5 pt-5 pb-2 text-sm font-semibold text-ink-soft sm:px-8">{{ group.label }}</h2>
        <div
          v-for="event in group.items"
          :key="event.id"
          class="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-hairline px-5 py-3 text-sm sm:px-8"
        >
          <p class="min-w-0">
            <span class="font-semibold">{{ event.actor_email }}</span>
            <span class="text-ink-soft"> {{ event.action }}</span>
            <span v-if="event.target" class="text-ink-soft"> ({{ event.target }})</span>
          </p>
          <p class="text-ink-soft">{{ time(event.at) }}</p>
        </div>
      </div>
      <p v-if="!audit.length" class="px-5 py-10 text-sm text-ink-soft sm:px-8">Nothing has happened yet.</p>
    </div>
  </section>
</template>

<script>
import SkeletonRows from '../../components/ui/SkeletonRows.vue';
import {
  fetchBusinesses,
  setBusinessStatus,
  fetchUsers,
  resetPassword,
  fetchAudit,
} from '../../api/admin.js';
import { groupByDay } from '../../lib/group.js';
import { formatTime } from '../../lib/format.js';

export default {
  components: { SkeletonRows },
  data() {
    return {
      tab: 'businesses',
      tabs: [
        { id: 'businesses', label: 'Businesses' },
        { id: 'owners', label: 'Owners' },
        { id: 'activity', label: 'Activity' },
      ],
      businesses: [],
      users: [],
      audit: [],
      loaded: false,
      error: null,
      confirmingId: null,
      resettingId: null,
      temporary: null,
    };
  },
  computed: {
    auditGroups() {
      return groupByDay(this.audit, 'at');
    },
  },
  created() {
    this.load();
  },
  methods: {
    time: formatTime,
    async load() {
      this.error = null;
      const token = this.$store.getters['auth/token'];
      try {
        [this.businesses, this.users, this.audit] = await Promise.all([
          fetchBusinesses(token),
          fetchUsers(token),
          fetchAudit(token),
        ]);
        this.loaded = true;
      } catch (error) {
        this.error = error.message;
      }
    },
    async toggleStatus(business) {
      const next = business.status === 'active' ? 'suspended' : 'active';
      try {
        await setBusinessStatus(this.$store.getters['auth/token'], business.id, next);
        business.status = next;
        this.confirmingId = null;
        this.audit = await fetchAudit(this.$store.getters['auth/token']);
      } catch (error) {
        this.error = error.message;
      }
    },
    async reset(user) {
      this.resettingId = user.id;
      try {
        const { password } = await resetPassword(this.$store.getters['auth/token'], user.id);
        this.temporary = { email: user.email, password };
        this.audit = await fetchAudit(this.$store.getters['auth/token']);
      } catch (error) {
        this.error = error.message;
      }
      this.resettingId = null;
    },
  },
};
</script>

<style scoped>
.tab-button {
  flex-shrink: 0;
  margin-bottom: -1px;
  height: 2.75rem;
  border-bottom: 2px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink-soft);
  transition: color 0.2s var(--ease-settle), border-color 0.2s var(--ease-settle);
}

.tab-button:hover {
  color: var(--color-ink);
}

.tab-button-active {
  color: var(--color-brand);
  border-bottom-color: var(--color-brand);
}
</style>
