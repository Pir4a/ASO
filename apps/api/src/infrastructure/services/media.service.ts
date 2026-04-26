import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { GridFSBucket, GridFSBucketReadStream, ObjectId } from 'mongodb';
import { Readable } from 'stream';

const BUCKET_NAME = 'media';

export interface UploadedMedia {
    id: string;
    mime: string;
    size: number;
    filename: string;
    url: string;
}

export interface MediaMetadata {
    id: string;
    mime: string;
    size: number;
    filename: string;
    uploadedAt: Date;
}

/**
 * GridFS-backed media storage. Files are uploaded as a single chunked stream
 * (default 255 KB chunks); metadata.contentType drives the response Content-Type.
 */
@Injectable()
export class MediaService implements OnModuleInit {
    private readonly logger = new Logger(MediaService.name);
    private bucket!: GridFSBucket;

    constructor(@InjectConnection() private readonly connection: Connection) { }

    onModuleInit(): void {
        if (!this.connection.db) {
            this.logger.warn('Mongo connection not ready yet — bucket will lazy-init.');
            return;
        }
        this.bucket = new GridFSBucket(this.connection.db, { bucketName: BUCKET_NAME });
    }

    private getBucket(): GridFSBucket {
        if (!this.bucket) {
            const db = this.connection.db;
            if (!db) throw new Error('Mongo connection unavailable.');
            this.bucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });
        }
        return this.bucket;
    }

    async upload(input: {
        buffer: Buffer;
        filename: string;
        mime: string;
    }): Promise<UploadedMedia> {
        const bucket = this.getBucket();
        const stream = bucket.openUploadStream(input.filename, {
            contentType: input.mime,
            metadata: { uploadedAt: new Date() },
        });

        await new Promise<void>((resolve, reject) => {
            stream.on('error', reject);
            stream.on('finish', () => resolve());
            Readable.from(input.buffer).pipe(stream);
        });

        const id = stream.id.toString();
        return {
            id,
            mime: input.mime,
            size: input.buffer.length,
            filename: input.filename,
            url: `/media/${id}`,
        };
    }

    async metadata(id: string): Promise<MediaMetadata> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Media not found.');
        }
        const bucket = this.getBucket();
        const cursor = bucket.find({ _id: new ObjectId(id) }).limit(1);
        const docs = await cursor.toArray();
        const doc = docs[0];
        if (!doc) throw new NotFoundException('Media not found.');
        return {
            id,
            mime: doc.contentType ?? 'application/octet-stream',
            size: doc.length,
            filename: doc.filename,
            uploadedAt: doc.uploadDate,
        };
    }

    stream(id: string): GridFSBucketReadStream {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Media not found.');
        }
        return this.getBucket().openDownloadStream(new ObjectId(id));
    }

    async delete(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Media not found.');
        }
        try {
            await this.getBucket().delete(new ObjectId(id));
        } catch (e) {
            // GridFS throws if id doesn't exist; treat that as a NotFound rather than 500.
            if ((e as Error).message?.includes('FileNotFound')) {
                throw new NotFoundException('Media not found.');
            }
            throw e;
        }
    }
}
