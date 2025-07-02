import * as fs from 'fs';
import * as path from 'path';

export interface CSVRow {
  [key: string]: string;
}

export class CSVReader {
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip the second quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current);
    return result;
  }

  static readCSV(filePath: string): CSVRow[] {
    try {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) return [];
      
      const headers = this.parseCSVLine(lines[0]);
      const rows: CSVRow[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const row: CSVRow = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        rows.push(row);
      }
      
      return rows;
    } catch (error) {
      console.error(`Error reading CSV file ${filePath}:`, error);
      return [];
    }
  }

  static writeCSV(filePath: string, data: CSVRow[]): void {
    try {
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma or quote
            if (value.includes(',') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      const fullPath = path.resolve(filePath);
      fs.writeFileSync(fullPath, csvContent, 'utf-8');
    } catch (error) {
      console.error(`Error writing CSV file ${filePath}:`, error);
    }
  }
}