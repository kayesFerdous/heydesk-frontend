<template>
  <!-- The landing page's proof: the product doing its job. A customer asks,
       the agent reads it back with the total, the customer says yes, and only
       then does it arrive in the owner's inbox. Example data, labelled so. -->
  <div ref="root">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="segmented" role="group" aria-label="Example business">
        <button
          v-for="(item, id) in scenes"
          :key="id"
          type="button"
          class="segment"
          :class="{ 'segment-active': id === sceneId }"
          :aria-pressed="id === sceneId ? 'true' : 'false'"
          @click="choose(id)"
        >
          <component :is="item.icon" :size="15" weight="bold"></component>
          {{ item.kind }}
          <!-- While the demo plays on its own, a line shows when it moves on. -->
          <span
            v-if="autoplay && id === sceneId"
            :key="`p${run}`"
            class="progress"
            :style="{ animationDuration: `${sceneLength}ms` }"
            aria-hidden="true"
          ></span>
        </button>
      </div>
      <p class="text-[0.8125rem] text-ink-soft">
        An example, not real customers.
        <button type="button" class="link ml-1" @click="replay">Play again</button>
      </p>
    </div>

    <div
      class="mt-4 grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[var(--radius-panel)] border border-line-strong bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <!-- The customer's side -->
      <section class="flex min-h-[25rem] flex-col border-b border-hairline bg-wash lg:border-r lg:border-b-0" aria-label="The customer's chat">
        <header class="flex items-center gap-3 border-b border-hairline bg-surface px-4 py-3">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-semibold text-brand" aria-hidden="true">
            {{ scene.initials }}
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold">{{ scene.business }}</span>
            <live-status label="Online" class="mt-0.5"></live-status>
          </span>
          <span class="ml-auto hidden items-center gap-1.5 text-xs text-ink-soft sm:inline-flex">
            <ph-globe :size="14"></ph-globe>
            Website chat
          </span>
        </header>

        <div class="flex flex-1 flex-col gap-2.5 px-4 py-5 text-sm leading-relaxed">
          <p v-if="step >= 1" :key="`a${run}`" class="arrive max-w-[85%] self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-brand px-4 py-2.5 text-white">
            {{ scene.asks }}
          </p>

          <p
            v-if="step === 2"
            class="arrive inline-flex gap-1 self-start rounded-[var(--radius-panel)] rounded-tl-sm bg-surface px-4 py-3.5 text-ink-soft ring-1 ring-hairline"
            aria-label="Typing"
          >
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </p>

          <div v-if="step >= 3" :key="`b${run}`" class="arrive max-w-[85%] self-start">
            <!-- Streams in word by word, the way the real agent replies. -->
            <p class="rounded-[var(--radius-panel)] rounded-tl-sm bg-surface px-4 py-2.5 text-ink ring-1 ring-hairline">
              {{ streamed }}<span v-if="streaming" class="caret" aria-hidden="true"></span>
            </p>
            <p v-if="!streaming" class="arrive mt-1.5 flex items-center gap-1.5 px-1 text-xs text-ink-soft">
              <ph-calculator :size="14" class="shrink-0 text-ink-faint"></ph-calculator>
              {{ scene.source }}
            </p>
          </div>

          <p v-if="step >= 4" :key="`c${run}`" class="arrive self-end rounded-[var(--radius-panel)] rounded-tr-sm bg-brand px-4 py-2.5 text-white">
            {{ scene.yes }}
          </p>
        </div>

        <div class="border-t border-hairline bg-surface p-3" aria-hidden="true">
          <div class="flex h-10 items-center rounded-full border border-line-strong px-4 text-sm text-ink-soft">
            Type a message
          </div>
        </div>
      </section>

      <!-- The owner's side -->
      <section class="flex flex-col" aria-label="Your inbox">
        <header class="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
          <span class="flex items-center gap-2 text-sm font-semibold">
            <ph-tray :size="18" class="text-ink-faint"></ph-tray>
            Inbox
            <span class="font-normal text-ink-soft">{{ scene.list }}</span>
          </span>
          <span :key="`n${run}${step >= 5}`" class="count" :class="{ 'count-new': step >= 5 }">{{ step >= 5 ? 1 : 0 }} new</span>
        </header>

        <p class="border-b border-hairline bg-wash px-5 py-1.5 text-xs font-semibold text-ink-soft">Today</p>

        <ul class="text-sm">
          <li v-if="step >= 5" :key="`r${run}`" class="landed border-b border-hairline px-5 py-3.5">
            <inbox-row :row="scene.row" time="Just now"></inbox-row>
            <p class="mt-2 flex items-center gap-1.5 pl-12 text-xs font-medium text-success">
              <ph-seal-check :size="15" weight="fill" class="shrink-0"></ph-seal-check>
              Read back to the customer and confirmed in chat
            </p>
          </li>
          <li v-else class="flex items-center gap-3 border-b border-hairline px-5 py-3.5 text-ink-soft">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line-strong" aria-hidden="true"></span>
            <span>Nothing reaches you until the customer says yes.</span>
          </li>
          <li v-for="row in scene.earlier" :key="row.name" class="border-b border-hairline px-5 py-3.5">
            <inbox-row :row="row" :time="row.time"></inbox-row>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import {
  PhBuildings,
  PhCalculator,
  PhForkKnife,
  PhGlobe,
  PhSealCheck,
  PhStethoscope,
  PhTray,
} from '@phosphor-icons/vue';

import LiveStatus from '../ui/LiveStatus.vue';
import InboxRow from './InboxRow.vue';

// Three example businesses, one per preset. Names and numbers are made up.
const SCENES = {
  restaurant: {
    kind: 'Restaurant',
    icon: PhForkKnife,
    business: 'Dhanmondi Kitchen',
    initials: 'DK',
    list: 'Orders',
    asks: 'Two chicken biryani for pickup at 8, please.',
    readBack: 'That is 2 Chicken Biryani, ৳900 in total, ready at 8:00 PM. Shall I place the order?',
    source: 'Price from your menu, added up by HeyDesk',
    yes: 'Yes',
    row: { initials: 'TA', name: 'Tanvir Ahmed', code: 'A-104', summary: '2 Chicken Biryani, pickup 8:00 PM', amount: '৳900', status: 'new' },
    earlier: [
      { initials: 'FI', name: 'Farhana Islam', code: 'A-103', summary: '1 Beef Tehari, pickup 7:30 PM', amount: '৳320', status: 'ready', time: '7:12 PM' },
      { initials: 'IH', name: 'Imran Hossain', code: 'A-102', summary: '3 Chicken Biryani, 2 Borhani', amount: '৳1,550', status: 'collected', time: '6:40 PM' },
    ],
  },
  clinic: {
    kind: 'Clinic',
    icon: PhStethoscope,
    business: 'Lakeview Clinic',
    initials: 'LC',
    list: 'Appointments',
    asks: 'Can I see Dr. Nasrin Akter on Saturday evening? I am Nusrat Jahan.',
    readBack: 'Dr. Nasrin Akter is free at 7:00 PM on Saturday, 10 Oct. Shall I request it for you?',
    source: "Time from the doctor's hours, checked by HeyDesk",
    yes: 'Yes, please',
    row: { initials: 'NJ', name: 'Nusrat Jahan', code: 'A-101', summary: 'Dr. Nasrin Akter, Sat, Oct 10, 7:00 PM', status: 'new' },
    earlier: [
      { initials: 'RK', name: 'Rahim Khan', code: 'A-100', summary: 'Dr. Kamal Uddin, Fri, Oct 9, 5:30 PM', status: 'handled', time: '11:05 AM' },
      { initials: 'SB', name: 'Sadia Begum', code: 'A-099', summary: 'Dr. Nasrin Akter, Thu, Oct 8, 6:00 PM', status: 'handled', time: '9:48 AM' },
    ],
  },
  office: {
    kind: 'Front office',
    icon: PhBuildings,
    business: 'Northpoint Realty',
    initials: 'NR',
    list: 'Messages',
    asks: 'Can someone call me about renting an office in Banani? My number is 01712 345678.',
    readBack: 'I will ask the team to call 01712 345678 about renting an office in Banani. Is that right?',
    source: 'Read back word for word before it is saved',
    yes: 'Yes, thanks',
    row: { initials: 'RH', name: 'Rafiq Hasan', summary: 'Call back about renting an office in Banani', status: 'new' },
    earlier: [
      { initials: 'MA', name: 'Mitu Akter', summary: 'Wants the floor plan by email', status: 'handled', time: '2:30 PM' },
      { initials: 'JU', name: 'Jamal Uddin', summary: 'Viewing next week, any weekday', status: 'handled', time: '12:15 PM' },
    ],
  },
};

// The pauses between beats, in milliseconds: before the question, before the
// agent starts typing, typing, between streamed words, before the yes, before
// the inbox, and how long the finished story stays up before the next one.
const BEAT = { ask: 500, think: 900, typing: 1100, word: 55, yes: 1100, inbox: 900, hold: 4200 };
const ORDER = Object.keys(SCENES);

export default {
  components: { InboxRow, LiveStatus, PhCalculator, PhGlobe, PhSealCheck, PhTray },
  data() {
    return {
      sceneId: 'restaurant',
      step: 0,
      words: 0,
      run: 0,
      // Cycles through the examples until the visitor picks one.
      autoplay: true,
    };
  },
  computed: {
    scenes() {
      return SCENES;
    },
    scene() {
      return SCENES[this.sceneId];
    },
    readBackWords() {
      return this.scene.readBack.split(' ');
    },
    streamed() {
      return this.readBackWords.slice(0, this.words).join(' ');
    },
    streaming() {
      return this.step === 3 && this.words < this.readBackWords.length;
    },
    // One scene from start to the move to the next, for the progress line.
    sceneLength() {
      const b = BEAT;
      return b.ask + b.think + b.typing + b.word * this.readBackWords.length + b.yes + b.inbox + b.hold;
    },
  },
  mounted() {
    this.timers = [];
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Play only while the demo is on screen; start again from the top on return.
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) this.play();
      else this.stop();
    });
    this.observer.observe(this.$refs.root);
  },
  beforeUnmount() {
    this.stop();
    this.observer.disconnect();
  },
  methods: {
    choose(id) {
      this.autoplay = false;
      this.sceneId = id;
      this.play();
    },
    replay() {
      this.autoplay = false;
      this.play();
    },
    stop() {
      this.run += 1; // any sequence still waiting sees it is stale and gives up
      this.timers.forEach(clearTimeout);
      this.timers = [];
    },
    wait(ms) {
      return new Promise((done) => this.timers.push(setTimeout(done, ms)));
    },
    async play() {
      this.stop();
      const run = this.run;
      const stale = () => run !== this.run;

      // Without motion, show the finished story at once and stay on it.
      if (this.reduce) {
        this.autoplay = false;
        this.step = 5;
        this.words = this.readBackWords.length;
        return;
      }

      this.step = 0;
      this.words = 0;
      const beats = [
        [BEAT.ask, 1],
        [BEAT.think, 2],
        [BEAT.typing, 3],
      ];
      for (const [ms, step] of beats) {
        await this.wait(ms);
        if (stale()) return;
        this.step = step;
      }
      while (this.words < this.readBackWords.length) {
        await this.wait(BEAT.word);
        if (stale()) return;
        this.words += 1;
      }
      await this.wait(BEAT.yes);
      if (stale()) return;
      this.step = 4;
      await this.wait(BEAT.inbox);
      if (stale()) return;
      this.step = 5;

      if (!this.autoplay) return;
      await this.wait(BEAT.hold);
      if (stale()) return;
      this.sceneId = ORDER[(ORDER.indexOf(this.sceneId) + 1) % ORDER.length];
      this.play();
    },
  },
};
</script>

<style scoped>
.count-new {
  background-color: var(--color-brand);
  color: #fff;
}

.segment {
  position: relative;
}

.progress {
  position: absolute;
  inset: auto 0.5rem 0.125rem;
  height: 2px;
  border-radius: 9999px;
  background-color: var(--color-brand);
  transform-origin: left;
  animation: progress linear both;
}

@keyframes progress {
  from {
    transform: scaleX(0);
  }
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -0.15em;
  background-color: var(--color-brand);
  animation: blink 0.9s steps(1) infinite;
}

@media (prefers-reduced-motion: no-preference) {
  .arrive {
    animation: arrive 0.45s var(--ease-settle) both;
  }

  /* The moment the page is about: the confirmed order lands, lit for a beat
     in cobalt tint, then settles into an ordinary row. */
  .landed {
    animation:
      arrive 0.5s var(--ease-settle) both,
      lit 2.4s ease-out both;
  }

  .count-new {
    animation: bump 0.4s var(--ease-settle);
  }
}

@keyframes bump {
  40% {
    transform: scale(1.15);
  }
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes lit {
  from {
    background-color: var(--color-brand-tint);
  }
  to {
    background-color: transparent;
  }
}

.dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background-color: currentColor;
  animation: blink 1.2s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
  }
  40% {
    opacity: 1;
  }
}
</style>
