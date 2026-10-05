// The token survives a reload; `me` is fetched again from it every time.
export default function state() {
  return {
    token: null,
    me: null,
  };
}
