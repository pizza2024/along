const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SHARED_SRC = path.resolve(REPO_ROOT, 'src');
const TARO_SRC = path.resolve(__dirname, 'src');

module.exports = {
  presets: [
    [
      'taro',
      {
        framework: 'react',
        ts: true,
      },
    ],
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: [REPO_ROOT],
        alias: {
          '@/components': path.resolve(TARO_SRC, 'components'),
          '@/pages': path.resolve(TARO_SRC, 'pages'),
          '@/db/database': path.resolve(TARO_SRC, 'db/database'),
          '@': SHARED_SRC,
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
  ],
};
