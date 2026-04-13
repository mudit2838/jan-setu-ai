import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const verifyS3 = async () => {
    console.log("\n--- Bharat JanSetu | S3 Connectivity Audit ---");
    
    const config = {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION || 'ap-south-1',
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    };

    console.log(`Target Bucket: ${config.bucket}`);
    console.log(`Region:        ${config.region}`);
    console.log(`Credentials:   ${config.hasAccessKey && config.hasSecretKey ? 'PRESENT' : 'MISSING'}`);

    if (!config.hasAccessKey || !config.hasSecretKey || !config.bucket) {
        console.error("❌ CRITICAL: Missing S3 environment variables in backend/.env");
        return;
    }

    const s3 = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    try {
        console.log("📡 Attempting to contact AWS S3...");
        await s3.send(new ListObjectsV2Command({ 
            Bucket: config.bucket, 
            MaxKeys: 1 
        }));
        console.log("✅ SUCCESS: Connectivity verified. The backend can successfully communicate with your bucket.");
    } catch (err) {
        console.error("\n❌ CLOUD REJECTION:");
        console.error(`Error Name: ${err.name}`);
        console.error(`Message:    ${err.message}`);
        
        console.log("\nTroubleshooting Guidance:");
        if (err.name === 'InvalidAccessKeyId') {
            console.log("👉 Check if your AWS_ACCESS_KEY_ID is correct and active.");
        } else if (err.name === 'SignatureDoesNotMatch') {
            console.log("👉 Check if your AWS_SECRET_ACCESS_KEY is correct (look for leading/trailing spaces).");
        } else if (err.name === 'NoSuchBucket') {
            console.log("👉 Check if the bucket name '"+config.bucket+"' is exactly correct.");
        } else if (err.name === 'AccessDenied') {
            console.log("👉 Your IAM user needs 's3:ListBucket' and 's3:PutObject' permissions.");
        } else if (err.name === 'CredentialsProviderError') {
            console.log("👉 AWS could not find your credentials. Check your .env variable names.");
        } else if (err.message.includes('ENOTFOUND')) {
            console.log("👉 Network error. Check your internet or ensure the region '"+config.region+"' is correct.");
        }
    }
    console.log("-----------------------------------------------\n");
};

verifyS3();
