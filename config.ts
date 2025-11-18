import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const awsCredentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

const dynamoConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: awsCredentials,
}as {
    credentials: {
        accessKeyId: string;
        secretAccessKey:  string;
    };
    region: string;
};

const dbClient = DynamoDBDocument.from(
  new DynamoDB(dynamoConfig),
  {
    marshallOptions: {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: false,
    },
  }
);

export { dbClient};