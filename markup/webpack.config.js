import { existsSync } from 'fs';
import { resolve, join, posix, dirname, basename, parse } from 'path';
import readdir from '@jsdevtools/readdir-enhanced';
import webpack from 'webpack';
import ErrorsPlugin from '@soda/friendly-errors-webpack-plugin';
import HTMLWebpackPlugin from 'html-webpack-plugin';
import StyleLintPlugin from 'stylelint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
import ESLintPlugin from 'eslint-webpack-plugin';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import config from './config.json' with { type: 'json' };
const __dirname = process.cwd();

const SRC = config.src;
const DEST = config.dest;
const PROD = 'build';
const ENV = process.env.npm_lifecycle_event;
const isProduction = ENV === PROD;
const sitePages = config.templates.dynamic ? config.templates.src : '/';
const PUBLIC_PATH = '';

const getAssetPath = (type, assetPath) => {
  if (type === SRC) {
    return posix.join(__dirname, SRC, assetPath);
  }
  return posix.join(__dirname, DEST, assetPath);
};

const getAssetName = (dest, name, ext) => {
  return posix.join(dest, `${name}.${ext}`);
};

const getAllPagesExceptRoutes = () => {
  const templateFiles = readdir.sync(getAssetPath(SRC, sitePages), {
    deep: config.templates.extension !== 'html',
    filter: function (stats) {
      // Skip directories/files starting with _ (partials: _includes, _layout, _components, _utils)
      if (stats.path.split('/').some(segment => segment.startsWith('_'))) return false;
      const filteredFiles = stats.isFile() && stats.path !== '.DS_Store' && stats.path.includes(config.templates.extension);
      return stats.isFile() && filteredFiles;
    },
  });

  return templateFiles;
};

const generateStaticAssets = () => {
  let assetsArray = [];

  for (const asset in config.static) {
    const assetObject = config.static[asset];
    const srcPath = getAssetPath(SRC, assetObject.src);
    const destPath = getAssetPath(DEST, assetObject.dest ? assetObject.dest : assetObject.src);
    const assetFolderExist = existsSync(srcPath);

    if (assetFolderExist) {
      assetsArray.push({
        from: srcPath,
        to: destPath,
      });
    }
  }

  return assetsArray;
};

const pluginsConfiguration = {
  DevServer: {},
  BrowserSync: config.browsersync,
  MiniCssExtract: {
    filename: getAssetName(config.styles.dest, '[name]', 'css'),
  },
  DefinePlugin: {
    'process.env': {
      ENV: JSON.stringify(ENV),
      ROUTES: config.templates.dynamic ? JSON.stringify(getAllPagesExceptRoutes()) : '/',
    },
  },
  StyleLint: {
    configFile: 'stylelint.config.js',
    context: getAssetPath(SRC, config.styles.src),
  },
  ESLint: {
    overrideConfigFile: 'eslint.config.js',
    extensions: ['.js'],
    files: join(SRC, config.scripts.src),
  },
  ErrorsPlugin: {
    clearConsole: true,
  },
  CopyPlugin: {
    patterns: generateStaticAssets(),
  },
  ImageMinimizer: [
    {
      minimizer: {
        implementation: ImageMinimizerPlugin.sharpMinify,
        options: {
          encodeOptions: {
            jpeg: {
              // https://sharp.pixelplumbing.com/api-output#jpeg
              quality: 80,
            },
            webp: {
              // https://sharp.pixelplumbing.com/api-output#webp
              lossless: true,
            },
            avif: {
              // https://sharp.pixelplumbing.com/api-output#avif
              lossless: true,
            },

            // PNG by default sets the quality to 100%, which is same as lossless
            // https://sharp.pixelplumbing.com/api-output#png
            png: { compressionLevel: 2 },

            // GIF does not support lossless compression at all
            // https://sharp.pixelplumbing.com/api-output#gif
            gif: {},
          },
        },
      },
    },
    {
      minimizer: {
        implementation: ImageMinimizerPlugin.svgoMinify,
        options: {
          encodeOptions: {
            // Pass over SVGs multiple times to ensure all optimizations are applied (False by default)
            multipass: true,
            plugins: [
              // Built-in plugin preset enabled by default
              // See: https://github.com/svg/svgo#default-preset
              "preset-default",
            ],
          },
        },
      },
    }
  ]
};

// creating new instance of plugin for each of the pages that we have
const generateHtmlPlugins = () => {
  const templateFiles = getAllPagesExceptRoutes();

  return templateFiles.map((item) => {
    // Split names and extension
    const parts = item.split('.');
    const name = parts[0];
    const template = getAssetPath(SRC, `${join(sitePages, name)}.${config.templates.extension}`);
    const filename = getAssetPath(DEST, `${join(config.templates.dest, name)}.html`);

    // Create new HTMLWebpackPlugin with options
    return new HTMLWebpackPlugin({
      inject: false,
      title: basename(dirname(__dirname)),
      template,
      filename,
      minify: {
        removeRedundantAttributes: false, // do not remove type attribute from form inputs
      }
    });
  });
};

const getPlugins = () => {
  let devPlugins = [new webpack.DefinePlugin(pluginsConfiguration.DefinePlugin)];
  let prodPlugins = [];

  let defaultPlugins = [
    new RemoveEmptyScriptsPlugin(),
    new ErrorsPlugin(pluginsConfiguration.ErrorsPlugin),
    new MiniCssExtractPlugin(pluginsConfiguration.MiniCssExtract),
    new BrowserSyncPlugin(pluginsConfiguration.BrowserSync),
  ];

  if (generateStaticAssets().length) {
    defaultPlugins.push(new CopyWebpackPlugin(pluginsConfiguration.CopyPlugin));
  }

  if (!isProduction) {
    devPlugins.map((item) => defaultPlugins.push(item));
  }

  if (isProduction) {
    for (let i = 0; i < pluginsConfiguration.ImageMinimizer.length; i++) {
      prodPlugins.push(new ImageMinimizerPlugin(pluginsConfiguration.ImageMinimizer[i]));
    }
    prodPlugins.map((item) => defaultPlugins.push(item));
  }

  // enable linters only if config.linters === true
  if (config.linters && config.linters.css) {
    defaultPlugins.push(new StyleLintPlugin(pluginsConfiguration.StyleLint));
  }

  if (config.linters && config.linters.js) {
    defaultPlugins.push(new ESLintPlugin(pluginsConfiguration.ESLint));
  }

  if (config.templates.dynamic) {
    return defaultPlugins.concat(generateHtmlPlugins());
  }

  return defaultPlugins
};

const getTemplatesLoader = (templateType) => {
  const PUG = new RegExp('pug');
  const TWIG = new RegExp('twig');
  const viewsPath = join(SRC, config.templates.src);

  if (PUG.test(templateType)) {
    return {
      test: /\.pug$/,
      exclude: [resolve(__dirname, 'src/views/_utils'), resolve(__dirname, 'src/views/_includes'), resolve(__dirname, 'src/views/_layout')],
      use: [
        'raw-loader',
        {
          loader: 'pug-html-loader',
          options: {
            basedir: join(SRC, config.templates.src),
          },
        },
      ],
    };
  }

  if (TWIG.test(templateType)) {
    return {
      test: /\.twig$/,
      use: [
        'raw-loader',
        {
          loader: 'twig-html-loader',
          options: {
            data: (context) => {
              const data = resolve(__dirname, 'data.json');
              // going throught all twig files, including only _{helpers}
              const helpers = readdir.sync(getAssetPath(SRC, sitePages), {
                deep: true,
                filter: (stats) => stats.isFile() && stats.path.indexOf('_') !== -1,
              });

              helpers.forEach((file) => {
                // pushing helper file to context and force plugin to rebuild templates on helpers changes
                // fixing issue, when path inside helpers was changed, but compiler didn't noticed about those changes to the path
                context.addDependency(resolve(__dirname, join(SRC, config.templates.src, file)));
              });

              context.addDependency(data); // Force webpack to watch file
              return context.fs.readJsonSync(data, { throws: false }) || {};
            },
            namespaces: {
              layout: resolve(__dirname, join(viewsPath, '_layout')),
              components: resolve(__dirname, join(viewsPath, '_components')),
              includes: resolve(__dirname, join(viewsPath, '_includes')),
            },
          },
        },
      ],
    };
  }

  return {};
};

const getScriptsLoader = (templateType) => {
  const TS = new RegExp('ts');

  if (TS.test(templateType)) {
    return {
      // /node_modules\/(?!(module_to_include)\/).*/
      test: /\.tsx?$/,
      exclude: /node_modules/,
      rules:[
        {
          use: ['awesome-typescript-loader'],
        }
      ]
    };
  }

  return {
    test: /\.m?js$/,
    exclude: /node_modules/,
    rules:[
      {
        use: ['babel-loader'],
      }
    ]
  };
};

const getStaticAssetOutputPath = ({ assets, outputFolder, parsedUrlPath, stylesDest }) => {
  const { src } = assets;
  const destination = posix.relative(stylesDest, outputFolder);
  const source = posix.join(SRC, src);
  const resultPath = parsedUrlPath.dir.replace(source, destination);

  parsedUrlPath.dir = resultPath;

  return posix.format(parsedUrlPath);
};

const getModules = () => {
  const modules = {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { url: false },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: {
                  cssnano: config.minimizeCSS && isProduction ? {} : false,
                },
                config: true,
              },
            },
          },
          'group-css-media-queries-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quietDeps: true,
                silenceDeprecations: ['import'],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[ext]',
        },
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[ext]',
        },
      },
    ],
  };

  if (config.templates.dynamic) {
    modules.rules.unshift(getScriptsLoader(config.scripts.extension), getTemplatesLoader(config.templates.extension));
  }

  return modules;
};

const getOptimization = () => {
  if (!isProduction) return {};
  const cacheGroupName = 'vendors';
  const shouldBoost = config.cache_boost && !config.externals;

  const settings = {
    boost: {
      chunkIds: 'named',
      moduleIds: 'named',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          [cacheGroupName]: {
            chunks: 'all',
            test: /node_modules/,
          },
        },
      },
    },
    default: {},
  };

  const settingsType = shouldBoost ? 'boost' : 'default';

  return {
    ...settings[settingsType],
    minimize: config.minimizeJS,
    minimizer: [
      new TerserPlugin({
        exclude: !config.minimizeJS ? join(config.scripts.src, config.scripts.bundle) : undefined,
        extractComments: false,
        terserOptions: {
          compress: {
            inline: false,
            warnings: false,
            drop_console: true,
          },
          output: {
            comments: false,
          },
        },
      }),
    ],
  };
};

/*
    External entries, specified in config.json file as {externals}. Could be useful, if we need separate CSS file for frameworks like Bootstrap etc.
    Usage in config:

    "externals": {
      "bootstrap": "styles/bootstrap.scss",
      "test": "js/test.js"
    }

    Where [filename] = [key], e.g. "bootstrap": ... => "bootstrap.css"

    This will generate additional CSS file and additional JS file, also - they will be automatically included into the generated HTML page.
*/
const addExternalEntries = (entries) => {
  const EXTERNAL_POSITIONS = {
    before: 'beforeBundle',
    after: 'afterBundle',
    error: 'Order should be "beforeBundle" or "afterBundle" only',
  };
  for (const external in config.externals) {
    const targetBundle = config.externals[external];
    // externals inclusion order, afterBundle - add after main bundles, beforeBundle - add before main bundles
    const order = config.externals.order || EXTERNAL_POSITIONS.before;

    if (typeof targetBundle === 'object') {
      const bundles = targetBundle.map((bundle) => {
        const externalBundle = resolve(__dirname, SRC, bundle);
        const pathExcludeSrc = bundle.replace(`${SRC}/`, '');

        if (existsSync(externalBundle)) {
          return externalBundle;
        }
        return console.error(
          `Path to externals should not include ${SRC}/, webpack resolve paths to this folder automatically. \nPlease change path to the following: ${pathExcludeSrc}`
        );
      });

      if (order === EXTERNAL_POSITIONS.before) {
        entries = {
          [external]: bundles,
          ...entries,
        };
      } else if (order === EXTERNAL_POSITIONS.after) {
        entries = {
          ...entries,
          [external]: bundles,
        };
      } else {
        throw new Error(EXTERNAL_POSITIONS.error);
      }
    } else if (typeof targetBundle === 'string') {
      const externalBundle = resolve(__dirname, SRC, targetBundle);

      if (existsSync(externalBundle)) {
        if (order === EXTERNAL_POSITIONS.before) {
          entries = {
            [external]: externalBundle,
            ...entries,
          };
        } else if (order === EXTERNAL_POSITIONS.after) {
          entries = {
            ...entries,
            [external]: externalBundle,
          };
        } else {
          throw new Error(EXTERNAL_POSITIONS.error);
        }
      }
    } else {
      console.error('Externals property should be a String or Array of strings, e.g. bootstrap: "bundle/path" or bootstrap: ["path/to/scss", "path/to/js"]');
    }
  }

  return entries;
};

const getEntries = () => {
  // Need this since useBuildins: usage in babel didn't add polyfill for Promise.all() when webpack is bundling
  // const iterator = ['core-js/modules/es.array.iterator', 'regenerator-runtime/runtime'];
  const iterator = [];
  let entries = {};

  if (config.scripts) {
    // default JS entry {app.js} - used for all pages, if no specific entry is provided
    const entryJsFile = join(config.scripts.src, `${config.scripts.bundle}.${config.scripts.extension}`);
    const entry = iterator.concat([getAssetPath(SRC, entryJsFile)]);

    if (!config.scripts.static) {
      entries[config.scripts.bundle] = [...entry];
    }
  }

  if (config.styles) {
    // default CSS entry {main.scss} - used for all pages, if no specific entry is provided
    const entryCSSFile = join(config.styles.src, `${config.styles.bundle}.${config.styles.extension}`);
    const styleAsset = getAssetPath(SRC, entryCSSFile);

    if (entries[config.styles.bundle]) {
      entries[config.styles.bundle].push(styleAsset);
    } else {
      entries[config.styles.bundle] = [styleAsset];
    }
  }

  if (config.externals) entries = addExternalEntries(entries);

  return entries;
};

const webpackConfig = {
  mode: ENV === 'dev' ? 'development' : 'production',
  entry: getEntries(),
  devtool: isProduction ? false : 'source-map',
  stats: isProduction ? 'minimal' : 'minimal',
  externals: {
    jquery: 'jQuery',
  },
  output: {
    publicPath: PUBLIC_PATH,
    path: resolve(__dirname, DEST),
    filename: getAssetName(config.scripts.dest, '[name]', 'js'),
    crossOriginLoading: 'anonymous',
    clean: true,
  },
  plugins: getPlugins(),
  resolve: {
    mainFiles: ['index'],
    extensions: [`.${config.scripts.extension}`],
    alias: {
      JS: getAssetPath(SRC, config.scripts.src),
      Utils: getAssetPath(SRC, `${config.scripts.src}/utils`),
      Vendors: getAssetPath(SRC, `${config.scripts.src}/vendors`),
      Plugins: getAssetPath(SRC, `${config.scripts.src}/plugins`),
      Components: getAssetPath(SRC, `${config.scripts.src}/components`),
      Animations: getAssetPath(SRC, `${config.scripts.src}/animations`),
    },
  },
  optimization: {
    usedExports: true,
    ...getOptimization(),
  },
  module: getModules(),
  devServer: pluginsConfiguration.DevServer,
};

export default webpackConfig;
