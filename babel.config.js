// Needed by jest-expo (and Metro) to parse TypeScript and JSX.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
