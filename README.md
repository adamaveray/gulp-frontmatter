# @averay/gulp-frontmatter

[![View code coverage on codecov][codecov-badge]][codecov]

[codecov]: https://codecov.io/gh/adamaveray/gulp-frontmatter
[codecov-badge]: https://codecov.io/gh/adamaveray/gulp-frontmatter/branch/main/graph/badge.svg

A Gulp plugin to load frontmatter from files, storing the values on the files in a [gulp-data][]-compatible manner, and passing the file along with the frontmatter section removed.

[gulp-data]: https://github.com/colynb/gulp-data

## Usage

```js
import frontmatter from '@averay/gulp-frontmatter';

gulp.src('...').pipe(/* Apply plugins */).pipe(frontmatter()).dest('...');
```

---

[MIT License](./LICENSE)
