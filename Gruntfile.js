const {readFileSync} = require("fs");
const loadGruntTasks = require("load-grunt-tasks");

const BUILD_DIR = "lib";
const LICENSE_FILE = "LICENSE";

const getLicenseJs = () => [
  "/*!",
  " * @preserve",
  " * @license",
  ...readFileSync(LICENSE_FILE, "utf8")
    .split("\n")
    .map(line => ` * ${line}`),
  " */",
].join("\n");

module.exports = grunt => {
  loadGruntTasks(grunt);
  grunt.initConfig({
    clean: {
      "build": [
        BUILD_DIR,
        ".tsbuildinfo",
        "**/*.cache",
      ],
    },
    ts: {"build": {tsconfig: "./tsconfig.json"}},
    usebanner: {
      "build": {
        options: {banner: getLicenseJs()},
        files: [
          {
            expand: true,
            cwd: BUILD_DIR,
            src: ["**/*.js"],
          },
        ],
      },
    },
  });

  grunt.registerTask(
    "build",
    "Build the library for release",
    [
      "ts:build",
      "usebanner:build",
    ],
  );

  grunt.registerTask(
    "default",
    "build",
  );
};
