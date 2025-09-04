export const AWS_CONFIG = {
  region: import.meta.env.AWS_REGION ,
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY                 
  },
  tableName: import.meta.env.AWS_TABLE_NAME 
};
