import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const errors = [];
const sourceExtensions = new Set([".ts", ".tsx"]);
const forbiddenTopLevelBaskets = [
  "services",
  "types",
  "contexts",
  "lib",
  "hooks",
  "components",
];

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (sourceExtensions.has(path.extname(entry.name))) result.push(full);
  }
  return result;
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function fail(file, message) {
  errors.push(`${rel(file)}: ${message}`);
}

for (const basket of forbiddenTopLevelBaskets) {
  const dir = path.join(srcRoot, basket);
  if (fs.existsSync(dir)) {
    fail(
      dir,
      `top-level ${basket}/ basket is forbidden; place code in features/, infrastructure/, providers/, shared/, config/, or app/`,
    );
  }
}

const files = walk(srcRoot);
const importPattern = /(?:from\s+|import\s*\()(['"])(@\/[^'"]+)\1/g;

for (const file of files) {
  const relative = rel(file);
  const source = fs.readFileSync(file, "utf8");
  const imports = [...source.matchAll(importPattern)].map((match) => match[2]);

  if (relative.startsWith("src/shared/")) {
    for (const specifier of imports) {
      if (/^@\/(features|infrastructure|providers|app)\//.test(specifier)) {
        fail(file, `shared layer cannot import ${specifier}`);
      }
    }
  }

  if (relative.startsWith("src/infrastructure/")) {
    for (const specifier of imports) {
      if (/^@\/(features|providers|app)\//.test(specifier)) {
        fail(file, `infrastructure layer cannot import ${specifier}`);
      }
    }
  }

  if (relative.startsWith("src/config/")) {
    for (const specifier of imports) {
      if (/^@\/(features|infrastructure|providers|app)\//.test(specifier)) {
        fail(file, `config layer cannot import ${specifier}`);
      }
    }
  }

  const featureMatch = relative.match(/^src\/features\/([^/]+)\//);
  if (featureMatch) {
    const currentFeature = featureMatch[1];
    for (const specifier of imports) {
      const imported = specifier.match(/^@\/features\/([^/]+)(\/.*)?$/);
      if (!imported) continue;
      const [, importedFeature, suffix = ""] = imported;
      if (importedFeature !== currentFeature && suffix !== "/public") {
        fail(
          file,
          `cross-feature import must use @/features/${importedFeature}/public, not ${specifier}`,
        );
      }
    }
  }

  if (relative.startsWith("src/providers/")) {
    for (const specifier of imports) {
      const imported = specifier.match(/^@\/features\/([^/]+)(\/.*)?$/);
      if (imported && imported[2] !== "/public") {
        fail(
          file,
          `provider may consume a feature only through @/features/${imported[1]}/public`,
        );
      }
    }
  }

  if (
    (relative.startsWith("src/features/") ||
      relative.startsWith("src/providers/") ||
      relative.startsWith("src/infrastructure/")) &&
    /queryKey\s*:\s*\[/.test(source)
  ) {
    fail(
      file,
      "ad-hoc TanStack query keys are forbidden; use the owning feature query-key factory",
    );
  }

  if (/^src\/features\/[^/]+\/screens\/.+\.tsx$/.test(relative)) {
    if (/\buseQuery\s*\(/.test(source) || /\buseMutation\s*\(/.test(source)) {
      fail(
        file,
        "screens cannot own TanStack queries/mutations; move server-state orchestration to queries/, mutations/, or hooks/",
      );
    }
    if (
      /from\s+['"]@\/features\/[^'"]+\/api\//.test(source) ||
      /from\s+['"]\.\.\/api\//.test(source)
    ) {
      fail(
        file,
        "screens cannot import API adapters directly; consume feature hooks/use-cases instead",
      );
    }
  }

  if (relative.startsWith("src/app/") && relative.endsWith(".tsx")) {
    const normalized = relative.slice("src/app/".length);
    const compositionFiles = new Set([
      "_layout.tsx",
      "index.tsx",
      "(tabs)/_layout.tsx",
    ]);
    if (!compositionFiles.has(normalized)) {
      const compact = source.trim();
      const routeWrapper =
        /^export \{ default \} from ['"]@\/features\/[^'"]+\/screens\/[^'"]+['"];?$/.test(
          compact,
        );
      if (!routeWrapper) {
        fail(
          file,
          "route files must be thin one-line feature screen re-exports; business/UI logic belongs in features/",
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Architecture check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Architecture check passed (${files.length} source files scanned).`,
);
