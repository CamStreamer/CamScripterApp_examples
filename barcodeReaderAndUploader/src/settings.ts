import * as Joi from 'joi';
import * as fs from 'fs';

let settings = {
    camera: {
        protocol: '',
        ip: '',
        port: 0,
        user: '',
        pass: '',
    },
    overlay: {
        x: 0,
        y: 0,
        alignment: '',
        width: 0,
        height: 0,
        scale: 0,
    },
    storage: {
        url: '',
        outputDir: '',
        clientSecret: '',
        clientId: '',
        tenantId: '',
        connectionTimeoutS: 0,
        uploadTimeoutS: 0,
        numberOfRetries: 0,
    },
    ledSettings: {
        greenPort: 0,
        redPort: 0,
    },
    barcodeSettings: {
        displayTimeS: 0,
    },
};

const schema = Joi.object({
    camera: Joi.object({
        protocol: Joi.string(),
        ip: Joi.string().ip(),
        port: Joi.number().port(),
        user: Joi.string(),
        pass: Joi.string().allow(''),
    }),
    overlay: Joi.object({
        x: Joi.number(),
        y: Joi.number(),
        alignment: Joi.string(),
        width: Joi.number(),
        height: Joi.number(),
        scale: Joi.number(),
    }),
    storage: Joi.object({
        url: Joi.string().allow(''),
        outputDir: Joi.string().allow(''),
        clientSecret: Joi.string().allow(''),
        clientId: Joi.string().allow(''),
        tenantId: Joi.string().allow(''),
        connectionTimeoutS: Joi.number(),
        uploadTimeoutS: Joi.number(),
        numberOfRetries: Joi.number(),
    }),
    ledSettings: Joi.object({
        greenPort: Joi.number().port(),
        redPort: Joi.number().port(),
    }),
    barcodeSettings: Joi.object({
        displayTimeS: Joi.number(),
    }),
});

const loadSettings = async () => {
    try {
        const stringData = fs.readFileSync(process.env.PERSISTENT_DATA_PATH + 'settings.json');
        const data = JSON.parse(stringData.toString());
        await schema.validateAsync(data, { allowUnknown: true, presence: 'required' });
        settings = data;
        console.log('Settings was loaded.');
    } catch (err) {
        console.error('Error while validating settings schema', err);
        process.exit(1);
    }
};

export { settings, loadSettings };
