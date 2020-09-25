module.exports = {
  getSnowpackPluginOutputSnapshotSerializer,
};

const {format} = require('util');

const strpAnsi = require('strip-ansi');

/**
 * Serializer of written files as well as console.log output.
 *
 * Both file contents and log output is normalized to account for differences
 * in UNIX and Windows systems.
 *
 * @param string basePath all files written outside this path will be ignored (usually set to __dirname)
 */
function getSnowpackPluginOutputSnapshotSerializer(basePath) {
  return {
    serialize({mock}) {
      const firstCallArg = mock.calls[0][0];

      if (firstCallArg.startsWith(basePath)) {
        const calls = mock.calls.filter(isLocal).map(toPathAndStringContent.bind(null, basePath));
        return calls
          .map(([path, content]) => {
            return `FILE: ${path}\n${content}`;
          })
          .join(
            '\n\n--------------------------------------------------------------------------------\n\n',
          );
      }

      const outputs = mock.calls.map(toSingleArgument).map(toNoralizedByteSize).map(removeColors);

      return outputs.join('\n');
    },

    test(value) {
      return value && value.mock;
    },
  };
}

function toPathAndStringContent(basePath, [path, content]) {
  const shortPath = path.replace(basePath, '').substr(1);
  // unix-ify folder separators for Windows
  const normalizedPath = shortPath.replace(/\\/g, '/');
  // unix-ify new lines
  const normalizedContent = content.toString().replace(/(\\r\\n)/g, '\\n');
  return [normalizedPath, normalizedContent];
}

function toSingleArgument([output, ...args]) {
  return format(output, ...args);
}
function toNoralizedByteSize(output) {
  return output.replace(/(\s{2,})\d+ bytes/g, '$1XXX bytes');
}

function removeColors(output) {
  return strpAnsi(output);
}

function isLocal(mock) {
  return mock[0].startsWith(__dirname);
}
