export default function state() {
  return {
    info: null, // { public_key, config, jobs, missing }
    noAgent: false, // the business has not created its agent yet
    loaded: false,
    presets: [],
  };
}
