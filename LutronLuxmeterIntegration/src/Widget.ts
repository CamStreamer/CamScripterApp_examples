import { CamOverlayDrawingOptions } from 'camstreamerlib/CamOverlayDrawingAPI';
import { Painter, PainterOptions, Frame } from 'camstreamerlib/CamOverlayPainter/Painter';
import type { TResult } from './LuxMeterReader';
import type { TCamera } from "./settings"

const imageWidth = 325;
const luxmeterHeight = 254;
const camstreamerHeight = 92;

export class Widget {
    private painters: Painter[];
    private camstreamer: Frame;
    private luxmeter: Frame;
    private value: Frame;
    private unit: Frame;
    private scale: number;

    public constructor(
        opt: Omit<PainterOptions, 'width' | 'height'> & { scale: number },
        cameras: TCamera[]
    ) {
        this.luxmeter = new Frame({
            x: 0,
            y: 0,
            width: imageWidth,
            height: luxmeterHeight,
            bgImage: 'Luxmeter',
        });
        this.camstreamer = new Frame({
            x: 0,
            y: luxmeterHeight,
            width: imageWidth,
            height: camstreamerHeight,
            bgImage: 'CamStreamer',
        });
        this.value = new Frame({
            x: 30,
            y: 15,
            width: 223,
            height: 190,
        });
        this.unit = new Frame({
            x: 259,
            y: 111,
            width: 40,
            height: 79,
        });

        this.scale = opt.scale;
        this.painters = [];
        for (const coOpt of cameras) {
            this.painters.push(
                this.initialisePainter(
                    {
                        ...opt,
                        width: imageWidth,
                        height: luxmeterHeight + camstreamerHeight,
                    },
                    coOpt,
                    this.luxmeter,
                    this.value,
                    this.unit,
                    this.camstreamer
                )
            );
        }

        this.value.setFont('Digital');
    }
    public async display(result: TResult): Promise<void> {
        this.value.setText(this.toString(result.value), 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);
        this.unit.setText(result.unit, 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);

        const promises = new Array<Promise<void>>();

        for (const p of this.painters) {
            promises.push(p.display(this.scale));
        }
        await Promise.all(promises);
    }

    private toString(value: number): string {
        if (value === 0 || isNaN(value)) {
            return 'ERROR';
        } else {
            const text = value.toPrecision(4);
            return text.substring(0, 6);
        }
    }
    private initialisePainter(opt: PainterOptions, coOpt: TCamera, ...frames: Frame[]) {
        const coOptions: CamOverlayDrawingOptions = {
            ...coOpt,
            camera: coOpt.cameraList,
            tls: coOpt.protocol !== 'http',
            tlsInsecure: coOpt.protocol === 'https',
        };
        const p = new Painter(opt, coOptions);

        p.registerFont('Digital', 'digital_font.ttf');
        p.registerImage('Luxmeter', 'luxmeter.png');
        p.registerImage('CamStreamer', 'camstreamer.png');

        p.insert(...frames);
        void p.connect();

        return p;
    }
}
