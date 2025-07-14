// Simple storage interface for the learning app
// This app primarily uses localStorage on the frontend for caching
// Backend storage is minimal since we're focused on AI content generation

export interface IStorage {
  // Add any future storage methods here if needed
  // Currently all data is cached client-side in localStorage
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize any needed in-memory storage
  }
}

export const storage = new MemStorage();
