export default function state() {
  return {
    info: null, // { public_key, config, abilities, missing }
    noAgent: false, // the business has not created its agent yet
    loaded: false,
    presets: [],
  };
}
