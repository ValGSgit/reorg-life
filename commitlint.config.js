// Conventional Commits. See AGENTS.md for the short version.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [1, 'always', 100],
  },
};
