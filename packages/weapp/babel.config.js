const path = require('path');

const WEAPP_SRC = path.resolve(__dirname, 'src');
const SHARED_SRC = path.resolve(__dirname, '../../packages/shared/src');

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
        root: [WEAPP_SRC],
        alias: {
          '@/components': path.resolve(WEAPP_SRC, 'components'),
          '@/pages': path.resolve(WEAPP_SRC, 'pages'),
          '@/db/database': path.resolve(WEAPP_SRC, 'db/database'),
          '@/hooks': path.resolve(WEAPP_SRC, 'hooks'),
          '@': WEAPP_SRC,
          '@moodly/shared': SHARED_SRC,
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
  ],
};
