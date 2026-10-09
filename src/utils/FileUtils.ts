import fs from "fs";
import path from "path";

/**
 * File operations used across the framework.
 *
 * All methods are synchronous on purpose. Tests read fixtures and write
 * reports at setup and teardown, not inside the hot path, and sync code
 * keeps those call sites free of await. The generator also writes files
 * in a plain loop, which async would only complicate.
 *
 * Every method is static - there is no state to hold.
 */
export class FileUtils {
  /**
   * Read a file as text.
   *
   * Throws if the file does not exist. That is deliberate: a missing
   * fixture is a setup problem the test cannot recover from, and failing
   * loudly beats returning "" and producing a confusing assertion failure
   * three steps later.
   */
  static read(filePath: string, encoding: BufferEncoding = "utf-8"): string {
    if (!FileUtils.exists(filePath)) {
      throw new Error(`File not found: ${path.resolve(filePath)}`);
    }
    return fs.readFileSync(filePath, encoding);
  }

  /**
   * Write text to a file, replacing whatever was there.
   *
   * Creates any missing parent folders, so writing to "reports/2026/10/x.txt"
   * works without creating the folders first.
   */
  static write(filePath: string, content: string): void {
    FileUtils.ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
  }

  /** Add to the end of a file, creating it if needed. */
  static append(filePath: string, content: string): void {
    FileUtils.ensureDir(path.dirname(filePath));
    fs.appendFileSync(filePath, content, "utf-8");
  }

  /** Does this path exist? Works for files and folders. */
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Delete a file.
   *
   * Does nothing if it is already gone, so cleanup code does not need an
   * exists() check first.
   */
  static delete(filePath: string): void {
    if (FileUtils.exists(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /** Copy a file, creating the destination folder if needed. */
  static copy(source: string, destination: string): void {
    if (!FileUtils.exists(source)) {
      throw new Error(
        `Cannot copy - source not found: ${path.resolve(source)}`,
      );
    }
    FileUtils.ensureDir(path.dirname(destination));
    fs.copyFileSync(source, destination);
  }

  /**
   * List the files in a folder.
   *
   * Returns full paths, not bare names, so the result can be passed
   * straight to read() or copy(). Folders are left out.
   *
   * Pass an extension to filter: listFiles("config", ".yaml")
   */
  static listFiles(dirPath: string, extension?: string): string[] {
    if (!FileUtils.exists(dirPath)) return [];

    return fs
      .readdirSync(dirPath)
      .map((name) => path.join(dirPath, name))
      .filter((full) => fs.statSync(full).isFile())
      .filter((full) => !extension || full.endsWith(extension));
  }

  /**
   * Create a folder, including any missing parents.
   *
   * Does nothing if it already exists.
   */
  static ensureDir(dirPath: string): void {
    if (!FileUtils.exists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Delete a folder and everything in it.
   *
   * Used to clear generated output before a fresh run. Does nothing if the
   * folder is not there.
   */
  static deleteDir(dirPath: string): void {
    if (FileUtils.exists(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  /** Turn a relative path into an absolute one, from the project root. */
  static resolve(...segments: string[]): string {
    return path.resolve(process.cwd(), ...segments);
  }

  /** The file name without its folder - "config/api.yaml" becomes "api.yaml". */
  static fileName(filePath: string): string {
    return path.basename(filePath);
  }

  /** The file name without folder or extension - "config/api.yaml" becomes "api". */
  static fileNameWithoutExtension(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /** Size in bytes. Returns 0 if the file is not there. */
  static size(filePath: string): number {
    if (!FileUtils.exists(filePath)) return 0;
    return fs.statSync(filePath).size;
  }
}
