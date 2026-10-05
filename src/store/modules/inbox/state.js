// What the sidebar badges and the Inbox page both need: how many things are
// waiting per job, and how many customers are waiting for a person.
export default function state() {
  return {
    jobs: [],
    needsHuman: 0,
    loaded: false,
  };
}
