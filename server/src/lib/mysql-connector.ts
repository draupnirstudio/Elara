import * as mysql from 'mysql';

const pool = mysql.createPool({
  'host': 'elara-mysql',
  'port': 3306,
  'user': 'elara',
  'database': 'elara',
  'password': 'CCrBgLBfIBrnBMHk'
});

export function query (sql: string, values?: any) {
  return new Promise((resolve, reject) => {
    
    if (values) {
      pool.query(sql, values,(error, results, fields) => {
        if(error) {
          reject(error);
          return;
        }
    
        resolve(results);
      });
      
      return;
    }
    
    pool.query(sql,(error, results, fields) => {
      if(error) {
        reject(error);
        return;
      }
      
      resolve(results);
    });
  });
}