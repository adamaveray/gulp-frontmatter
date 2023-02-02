export default class PluginError extends Error {
  constructor(message: string) {
    super(`@averay/gulp-frontmatter: ${message}`);
  }
}
