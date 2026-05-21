import fs from 'fs';
import path from 'path';
import { ComparisonRow, NormalizedOffer } from './schemas';

export interface StorageAdapter {
  saveComparison(data: any, filepath: string): Promise<void>;
  saveRawOffers(offers: any[], filepath: string): Promise<void>;
  loadRawOffers(filepath: string): Promise<any[]>;
}

export class GitHubStorageAdapter implements StorageAdapter {
  async saveComparison(data: any, filepath: string): Promise<void> {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  async saveRawOffers(offers: any[], filepath: string): Promise<void> {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(offers, null, 2));
  }

  async loadRawOffers(filepath: string): Promise<any[]> {
    if (!fs.existsSync(filepath)) return [];
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
}

export class SQLiteStorageAdapter implements StorageAdapter {
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    // In a real implementation, we would initialize sqlite3 or better-sqlite3 here
    // and run CREATE TABLE statements for comparisons and offers.
  }

  async saveComparison(data: any, filepath: string): Promise<void> {
    console.log(`[SQLiteStorageAdapter] Saving comparison to ${this.dbPath} (stub)`);
    // Stub: INSERT INTO comparisons (generated_at, json_data) VALUES (...)
  }

  async saveRawOffers(offers: any[], filepath: string): Promise<void> {
    console.log(`[SQLiteStorageAdapter] Saving ${offers.length} raw offers to ${this.dbPath} (stub)`);
    // Stub: INSERT INTO raw_offers ... ON CONFLICT REPLACE
  }

  async loadRawOffers(filepath: string): Promise<any[]> {
    console.log(`[SQLiteStorageAdapter] Loading raw offers from ${this.dbPath} (stub)`);
    // Stub: SELECT * FROM raw_offers
    return [];
  }
}
