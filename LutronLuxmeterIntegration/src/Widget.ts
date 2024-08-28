import { CamOverlayDrawingOptions } from 'camstreamerlib/CamOverlayDrawingAPI';
import { Painter, PainterOptions, Frame } from 'camstreamerlib/CamOverlayPainter/Painter';
import type { TResult } from './LuxMeterReader';
import type { TCamera } from './settings';

const imageWidth = 720;
const imageHeight = 480;

export class Widget {
    private painters: Painter[];
    private luxmeter: Frame;
    private message: Frame;
    private value: Frame;
    private unit: Frame;
    private scale: number;

    public constructor(opt: Omit<PainterOptions, 'width' | 'height'> & { scale: number }, cameras: TCamera[]) {
        this.luxmeter = new Frame({
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight,
            bgImage: 'Luxmeter',
        });
        this.message = new Frame({
            x: 65,
            y: 100,
            width: 590,
            height: 180,
            enabled: false,
        });
        this.value = new Frame({
            x: 75,
            y: 90,
            width: 375,
            height: 180,
        });
        this.unit = new Frame({
            x: 485,
            y: 95,
            width: 160,
            height: 180,
        });

        this.scale = opt.scale;
        this.painters = [];
        for (const coOpt of cameras) {
            this.painters.push(
                this.initialisePainter(
                    {
                        ...opt,
                        width: imageWidth,
                        height: imageHeight,
                    },
                    coOpt,
                    this.luxmeter,
                    this.message,
                    this.value,
                    this.unit
                )
            );
        }

        this.value.setFont('Digital');
        this.message.setFont('Digital');
        this.message.setText('OUT OF RANGE', 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);
    }
    public async display(result: TResult): Promise<void> {
        if (result.value === 0 || isNaN(result.value)) {
            this.message.enable();
            this.value.disable();
            this.unit.disable();
        } else {
            this.message.disable();
            this.value.enable();
            this.unit.enable();
            this.value.setText(this.toString(result.value), 'A_RIGHT', 'TFM_SCALE', [0, 0, 0]);
            this.unit.setText(result.unit, 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);
        }

        const promises = new Array<Promise<void>>();

        for (const p of this.painters) {
            promises.push(p.display(this.scale));
        }
        await Promise.all(promises);
    }

    private toString(value: number): string {
        const text = value.toPrecision(4);
        return text.substring(0, 6);
    }
    private initialisePainter(opt: PainterOptions, coOpt: TCamera, ...frames: Frame[]) {
        const coOptions: CamOverlayDrawingOptions = {
            ...coOpt,
            camera: coOpt.cameraList,
            tls: coOpt.protocol !== 'http',
            tlsInsecure: coOpt.protocol !== 'https',
        };
        const p = new Painter(opt, coOptions);

        p.registerFont('Digital', 'digital_font.ttf');
        p.registerImage('Luxmeter', 'luxmeter.png');

        p.insert(...frames);
        void p.connect();

        return p;
    }
}
