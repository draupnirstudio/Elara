import * as _ from 'lodash';

class ElaraStorage {
  isAvailable = false;
  
  constructor() {
    this.isAvailable = typeof (Storage) !== 'undefined';
    if (!this.isAvailable) {
      throw new Error('No localStorage support!');
    }
  }
  
  get(key) {
    let value = null;
    try {
      value = localStorage.getItem(key);
      if (_.isObject(value)) {
        return JSON.parse(value);
      }
      return value;
    } catch (e) {
      console.error('localStorage get error:', e);
      return value;
    }
  }
  
  set(key, value) {
    const _value = _.isObject(value) ? JSON.stringify(value) : value;
    
    try {
      localStorage.setItem(key, _value);
      return true;
    } catch (e) {
      console.error('localStorage set error:', e);
      return false;
    }
  }
  
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('localStorage remove error:', e);
    }
  }
}

export const storageClient = new ElaraStorage();