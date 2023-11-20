type TUploaderData = {
    uploadTimeoutS: number;
    numberOfRetries: number;
};

export class Uploader {
    constructor(public externalStorage: IExternalStorage, private data: TUploaderData) {}

    uploadFile = async (file: Buffer, fileName: string) => {
        for (let tryNumber = 0; tryNumber < this.data.numberOfRetries; tryNumber++) {
            console.log(`Uploading file ${fileName} for the ${tryNumber + 1} time`);

            try {
                await new Promise<void>(async (resolve, reject) => {
                    const timeout = setTimeout(reject, this.data.uploadTimeoutS * 1000);
                    await this.externalStorage.uploadFile(file, fileName);
                    clearTimeout(timeout);
                    resolve();
                });
                return;
            } catch (e) {
                console.warn(e);

                if (tryNumber === this.data.numberOfRetries - 1) {
                    throw new Error(`Failed to upload ${fileName}`);
                }
            }
        }
    };
}

export interface IExternalStorage {
    uploadFile: (file: Buffer, fileName: string) => Promise<void>;
}
