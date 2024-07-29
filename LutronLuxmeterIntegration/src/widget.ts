import { CamOverlayDrawingOptions } from 'camstreamerlib/CamOverlayDrawingAPI';
import { Painter, PainterOptions, Frame } from 'camstreamerlib/CamOverlayPainter/Painter';

const imageWidth = 325;
const luxmeterHeight = 254;
const camstreamerHeight = 92;

function toString(value: number): string {
    if (value === 0 || isNaN(value)) {
        return 'ERROR';
    } else {
        const text = value.toPrecision(4);
        return text.substring(0, 6);
    }
}
function initialisePainter(opt: PainterOptions, coOpt: CamOverlayDrawingOptions, ...frames: Frame[]) {
    const p = new Painter(opt, coOpt);

    p.registerFont('Digital', 'digital_font.ttf');
    p.registerImage('Luxmeter', 'luxmeter.png');
    p.registerImage('CamStreamer', 'camstreamer.png');

    p.insert(...frames);
    void p.connect();

    return p;
}

export class Widget {
    private painters: Painter[];
    private camstreamer: Frame;
    private luxmeter: Frame;
    private value: Frame;
    private scale: number;

    public constructor(
        opt: Omit<PainterOptions, 'width' | 'height'> & { scale: number },
        cameras: CamOverlayDrawingOptions[]
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
            x: imageWidth / 8,
            y: luxmeterHeight / 16,
            width: imageWidth * (3 / 4),
            height: luxmeterHeight * (3 / 4),
        });

        this.scale = opt.scale;
        this.painters = [];
        for (const coOpt of cameras) {
            this.painters.push(
                initialisePainter(
                    {
                        ...opt,
                        width: imageWidth,
                        height: luxmeterHeight + camstreamerHeight,
                    },
                    coOpt,
                    this.luxmeter,
                    this.value,
                    this.camstreamer
                )
            );
        }

        this.value.setFont('Digital');
    }
    public async display(value: number): Promise<void> {
        this.value.setText(toString(value), 'A_CENTER', 'TFM_SCALE', [0, 0, 0]);

        const promises = new Array<Promise<void>>();

        for (const p of this.painters) {
            promises.push(p.display(this.scale));
        }
        await Promise.all(promises);
    }
}
