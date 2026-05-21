import fs from 'fs';
import path from 'path';

export interface ParserWarning {
  source: string;
  url: string;
  issue: string;
  timestamp: string;
}

export class ParserDiagnostics {
  private static warnings: ParserWarning[] = [];

  static warn(source: string, url: string, issue: string) {
    const warning: ParserWarning = {
      source,
      url,
      issue,
      timestamp: new Date().toISOString(),
    };
    this.warnings.push(warning);
    console.warn(`[PARSER WARNING] ${source} | ${issue} | ${url}`);
  }

  static getWarnings(): ParserWarning[] {
    return this.warnings;
  }

  static clear() {
    this.warnings = [];
  }

  static saveReport(outputDir: string) {
    const reportPath = path.join(outputDir, 'parser-warnings.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.warnings, null, 2));
    console.log(`Saved ${this.warnings.length} parser warnings to ${reportPath}`);
  }
}
