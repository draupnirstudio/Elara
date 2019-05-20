class ElaraStorage {
  isAvailable = false;
  
  constructor() {
    this.isAvailable = typeof (Storage) !== 'undefined';
    if (!this.isAvailable) {
      throw new Error('No localStorage support!');
    }
  }
  
  get(key) {
    let value;
    try {
      value = localStorage.getItem(key);
      return JSON.parse(value);
    } catch (e) {
      console.debug('localStorage get error:', e);
      return value;
    }
  }
  
  set(key, value) {
    let valueToSave;
    if (typeof value === 'object') {
      valueToSave = JSON.stringify(value);
    } else {
      valueToSave = value;
    }
    
    try {
      localStorage.setItem(key, valueToSave);
      return true;
    } catch (e) {
      console.error('localStorage error:', e);
      return false;
    }
  }
  
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('localStorage error:', e);
    }
  }
}

export const storageClient = new ElaraStorage();